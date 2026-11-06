/**
 * Claude Code's hook: reads the event, hands the session to a worker of its own and returns at
 * once, so no turn and no exit waits on Telmoni. It loads no SDK: the worker's bundle carries it.
 */

import { spawn } from 'node:child_process';
import { closeSync, openSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { type Payload, parse } from './payload.js';
import { type Env, stateDir } from './settings.js';

export async function main(raw: string, env: Env): Promise<number> {
  try {
    const given = parse(raw, env);
    if (given !== undefined) start(given, env);
  } catch {
    // A hook never fails the session, even with nowhere to log.
  }
  return 0;
}

/** The worker's bundle, beside this one's. */
export function workerPath(): string {
  return join(dirname(fileURLToPath(import.meta.url)), 'worker.mjs');
}

function start(payload: Payload, env: Env): void {
  const log = openSync(join(stateDir(env), 'hook.log'), 'a', 0o600);
  try {
    // Detached in a session of its own, and on Windows with no window: the worker outlives the hook.
    const child = spawn(process.execPath, [workerPath()], {
      detached: true,
      env: { ...env },
      stdio: ['pipe', 'ignore', log],
      windowsHide: true,
    });
    const stdin = child.stdin!;
    child.on('error', () => {});
    stdin.on('error', () => {});
    // By its stdin, not its argv: ps shows argv to everyone, and the payload names the transcript.
    stdin.end(JSON.stringify(payload));
    child.unref();
  } finally {
    closeSync(log);
  }
}
