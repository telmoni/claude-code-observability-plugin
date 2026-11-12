/** The plugin's settings and where it keeps its state. */

import { createHash } from 'node:crypto';
import { accessSync, chmodSync, constants, mkdirSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, isAbsolute, join } from 'node:path';

export type Env = Readonly<Record<string, string | undefined>>;

// The developer's switch for content: the SDKs' variable, and the plugin's own setting's name.
export const CAPTURE_CONTENT = 'TELMONI_CAPTURE_CONTENT';
// The scrubbers' switches, named as the content switch is.
export const SCRUB_SECRETS = 'TELMONI_SCRUB_SECRETS';
export const SCRUB_PII = 'TELMONI_SCRUB_PII';
// Unicode's White_Space, which the SDKs trim the variable of; `trim` takes a byte-order mark too.
const WHITE_SPACE =
  '[\\t\\n\\v\\f\\r \\x85\\xa0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]';
const ENDS = new RegExp(`^${WHITE_SPACE}+|${WHITE_SPACE}+$`, 'g');
// Claude Code's switches for a cloud that serves the model, by the GenAI conventions' names.
const SERVED_BY = [
  ['CLAUDE_CODE_USE_BEDROCK', 'aws.bedrock'],
  ['CLAUDE_CODE_USE_VERTEX', 'gcp.vertex_ai'],
  ['CLAUDE_CODE_USE_FOUNDRY', 'azure.ai.inference'],
] as const;

export interface Settings {
  apiKey: string | undefined;
  // None unless set: the plugin sends nowhere until it is told where.
  endpoint: string | undefined;
  stateDir: string;
  provider: string;
  // The conversation handed to the SDK, which sends it only where the project keeps content.
  captureContent: boolean;
  // The SDK's scrubbers, which replace secrets and personal data in what content it sends.
  scrubSecrets: boolean;
  scrubPii: boolean;
}

/** Who serves the model, as the conventions and the price table name it. */
export function providerOf(env: Env): string {
  for (const [name, provider] of SERVED_BY) {
    const given = (env[name] ?? '').trim().toLowerCase();
    if (given === '1' || given === 'true') return provider;
  }
  return 'anthropic';
}

/**
 * Where the state, the locks and the log live: the folder Claude Code keeps for the plugin across
 * its updates, else `telmoni` under its config folder.
 */
export function stateDir(env: Env): string {
  const data = env.CLAUDE_PLUGIN_DATA;
  if (data && isAbsolute(data)) {
    const made = usable(data);
    if (made !== undefined) return made;
  }
  // A relative one would put the state under the session's working folder.
  const given = env.CLAUDE_CONFIG_DIR;
  const home = given && isAbsolute(given) ? given : join(homedir(), '.claude');
  const made = usable(join(home, 'telmoni'));
  if (made === undefined) throw new Error('no writable state folder');
  return made;
}

function usable(path: string): string | undefined {
  try {
    mkdirSync(dirname(path), { recursive: true });
    mkdirSync(path, { mode: 0o700 });
  } catch (fault) {
    if ((fault as NodeJS.ErrnoException).code !== 'EEXIST') return undefined;
  }
  try {
    if (!statSync(path).isDirectory()) return undefined;
    // mkdir's mode is a new folder's alone: one an earlier version made stays open to others.
    chmodSync(path, 0o700);
  } catch {
    // Not the owner's to close: whether it can be written decides.
  }
  try {
    accessSync(path, constants.W_OK | constants.X_OK);
    return path;
  } catch {
    return undefined;
  }
}

/**
 * The plugin's own switch as Claude Code hands the hook a boolean setting, `true`; the
 * environment's as the SDKs read it, `1` alone, White_Space off its ends.
 */
function contentOn(value: string | undefined, own: boolean): boolean {
  if (own) return value === 'true';
  return (value ?? '').replace(ENDS, '') === '1';
}

/**
 * A scrubber, on unless turned off: the plugin's own switch at Claude Code's `false` alone; the
 * environment's at `0` alone, White_Space off its ends.
 */
function scrubOn(value: string | undefined, own: boolean): boolean {
  if (own) return value !== 'false';
  return (value ?? '').replace(ENDS, '') !== '0';
}

/**
 * The environment's key first, since a repository's `.claude/settings.json` points one checkout at
 * another project, else the plugin's own; each with the endpoint and the switches beside it, so a
 * key never goes to an endpoint, nor takes a switch, set somewhere else.
 */
export function readSettings(env: Env): Settings {
  const prefix = (env.TELMONI_API_KEY ?? '').trim() ? '' : 'CLAUDE_PLUGIN_OPTION_';
  const own = prefix !== '';
  const key = (env[`${prefix}TELMONI_API_KEY`] ?? '').trim();
  const endpoint = (env[`${prefix}TELMONI_ENDPOINT`] ?? '').trim();
  return {
    apiKey: key || undefined,
    endpoint: endpoint || undefined,
    stateDir: stateDir(env),
    provider: providerOf(env),
    captureContent: contentOn(env[`${prefix}${CAPTURE_CONTENT}`], own),
    scrubSecrets: scrubOn(env[`${prefix}${SCRUB_SECRETS}`], own),
    scrubPii: scrubOn(env[`${prefix}${SCRUB_PII}`], own),
  };
}

/**
 * Where this key sends, as a digest of the endpoint and the key: what a session's kept traces are
 * held to, so another session's hook sends them nowhere they were not meant to go.
 */
export function destination(settings: Pick<Settings, 'apiKey' | 'endpoint'>): string {
  return createHash('sha256')
    .update(`${settings.endpoint ?? ''}\n${settings.apiKey ?? ''}`)
    .digest('hex')
    .slice(0, 16);
}
