/** The hook's own process, the command Claude Code runs, the manifests, and the bundles as they ship. */

import { spawnSync } from 'node:child_process';
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { beforeEach, expect, test, vi } from 'vitest';

import { main, workerPath } from '../src/hook.js';
import { AGENT } from '../src/record.js';
import { CAPTURE_CONTENT, SCRUB_PII, SCRUB_SECRETS } from '../src/settings.js';
import { main as workerMain } from '../src/worker.js';
import { KEY, type Json, Transcript, assertMetadataOnly, tempDir } from './helpers.js';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

// Each worker the hook starts, as it was started: never a real process here.
const started = vi.hoisted(() => ({
  calls: [] as Array<{ command: string; args: string[]; options: Json; stdin?: string }>,
}));

vi.mock('node:child_process', async (importOriginal) => {
  const real = await importOriginal<typeof import('node:child_process')>();
  const spawn = (command: string, args: string[], options: Json) => {
    const call: (typeof started.calls)[number] = { command, args, options };
    started.calls.push(call);
    return {
      on: () => undefined,
      unref: () => undefined,
      stdin: { on: () => undefined, end: (data: string) => void (call.stdin = data) },
    };
  };
  return { ...real, spawn };
});

beforeEach(() => {
  started.calls.length = 0;
});

const STOP = {
  session_id: 's1',
  transcript_path: '/tmp/s1.jsonl',
  cwd: '/home/someone/secret-project',
  hook_event_name: 'Stop',
  last_assistant_message: 'REPLY-TEXT-NEVER-SENT',
};

function filesIn(folder: string): string {
  return readdirSync(folder)
    .map((name) => join(folder, name))
    .filter((path) => statSync(path).isFile())
    .map((path) => readFileSync(path, 'utf8'))
    .join('');
}

test('the hook hands the session to a worker by its stdin and returns', async () => {
  const tmp = tempDir();
  expect(await main(JSON.stringify(STOP), { CLAUDE_PLUGIN_DATA: tmp })).toBe(0);
  expect(started.calls).toHaveLength(1);
  const [call] = started.calls;
  // The worker's argv is what ps shows: the payload goes by its stdin instead.
  expect([call!.command, ...call!.args]).toEqual([process.execPath, workerPath()]);
  expect(basename(workerPath())).toBe('worker.mjs');
  expect(dirname(workerPath())).toBe(join(ROOT, 'src'));
  expect((call!.options.stdio as unknown[])[0]).toBe('pipe');
  expect(JSON.parse(call!.stdin!)).toMatchObject({ sessionId: 's1', event: 'Stop' });
  assertMetadataOnly(call!.stdin!, filesIn(tmp));
});

test('the worker is detached in a session of its own, with no window on windows', async () => {
  const tmp = tempDir();
  await main(JSON.stringify(STOP), { CLAUDE_PLUGIN_DATA: tmp });
  const [call] = started.calls;
  expect(call!.options.detached).toBe(true);
  expect(call!.options.windowsHide).toBe(true);
});

test('the worker reads its payload from stdin', async () => {
  const tmp = tempDir();
  const payload = {
    sessionId: 's1',
    transcriptPath: join(tmp, 'none.jsonl'),
    event: 'Stop',
    busy: false,
  };
  expect(await workerMain(JSON.stringify(payload), { CLAUDE_PLUGIN_DATA: tmp })).toBe(0);
  expect(readFileSync(join(tmp, 'hook.log'), 'utf8')).toContain('no key');
});

test('the hook returns 0 with no folder to write', async () => {
  const tmp = tempDir();
  writeFileSync(join(tmp, 'file'), '');
  const nowhere = { CLAUDE_CONFIG_DIR: join(tmp, 'file', 'config') };
  expect(await main(JSON.stringify(STOP), nowhere)).toBe(0);
  expect(started.calls).toEqual([]);
});

test('the hook leaves another editor alone', async () => {
  const tmp = tempDir();
  const payload = { session_id: 's1', transcript_path: '/tmp/s1.jsonl', hook_event_name: 'Stop' };
  const env = { CLAUDE_PLUGIN_DATA: tmp, CURSOR_VERSION: '1' };
  expect(await main(JSON.stringify(payload), env)).toBe(0);
  expect(started.calls).toEqual([]);
});

function readJson(path: string): Json {
  return JSON.parse(readFileSync(join(ROOT, path), 'utf8')) as Json;
}

function hookCommand(): string {
  const hooks = readJson('hooks/hooks.json') as {
    hooks: Record<string, Array<{ hooks: Array<{ command: string }> }>>;
  };
  return hooks.hooks.Stop![0]!.hooks[0]!.command;
}

test('the manifests agree', () => {
  const plugin = readJson('.claude-plugin/plugin.json') as Json & {
    userConfig: Record<string, Json>;
  };
  const marketplace = readJson('.claude-plugin/marketplace.json') as {
    plugins: Array<{ name: string; source: string }>;
  };
  const hooks = readJson('hooks/hooks.json') as {
    hooks: Record<string, Array<{ hooks: Array<{ command: string }> }>>;
  };
  const project = readJson('package.json');
  expect(plugin.version).toBe(project.version);
  expect(plugin.name).toBe('telmoni-observability');
  expect(marketplace.plugins.map((p) => p.name)).toEqual(['telmoni-observability']);
  expect(marketplace.plugins[0]!.source).toBe('./');
  expect(Object.keys(hooks.hooks).sort()).toEqual(['SessionEnd', 'Stop', 'StopFailure']);
  const commands = new Set(
    Object.values(hooks.hooks).flatMap((event) =>
      event.flatMap((group) => group.hooks.map((hook) => hook.command)),
    ),
  );
  expect(commands.size).toBe(1);
  const command = [...commands][0]!;
  expect(command).toContain('node "${CLAUDE_PLUGIN_ROOT}/dist/hook.mjs"');
  // Node may fail, or be missing, without failing the session: a Stop hook's exit 2 sends Claude back to work.
  expect(command.split('|| true').length - 1).toBe(1);
  expect(command).not.toContain('exec');
  expect(plugin.userConfig.TELMONI_API_KEY!.sensitive).toBe(true);
  const contentSwitch = plugin.userConfig[CAPTURE_CONTENT]!;
  expect([contentSwitch.type, contentSwitch.default, contentSwitch.sensitive]).toEqual([
    'boolean',
    false,
    undefined,
  ]);
  const scrubbers = { [SCRUB_SECRETS]: 'Scrub secrets', [SCRUB_PII]: 'Scrub personal data' };
  for (const [name, title] of Object.entries(scrubbers)) {
    const option = plugin.userConfig[name]!;
    expect([option.type, option.default, option.title]).toEqual(['boolean', true, title]);
  }
  expect(AGENT).toBe('claude-code');
  const hookBundle = readFileSync(join(ROOT, 'dist', 'hook.mjs'), 'utf8');
  const workerBundle = readFileSync(join(ROOT, 'dist', 'worker.mjs'), 'utf8');
  // The hook loads no SDK before it returns: the worker's bundle alone carries it.
  expect(hookBundle).not.toContain('recordRun');
  expect(workerBundle).toContain('recordRun');
  expect(hookBundle).not.toContain(KEY);
  expect(workerBundle).not.toContain(KEY);
});

function fakeBin(tmp: string, scripts: Record<string, string>): string {
  const bin = join(tmp, 'bin');
  mkdirSync(bin);
  for (const [name, body] of Object.entries(scripts)) {
    writeFileSync(join(bin, name), `#!/bin/sh\n${body}\n`);
    chmodSync(join(bin, name), 0o755);
  }
  return bin;
}

test('the hook command exits 0 when node fails', () => {
  const tmp = tempDir();
  const bin = fakeBin(tmp, { node: "echo 'node: broken' >&2\nexit 2" });
  const done = spawnSync('/bin/sh', ['-c', hookCommand()], {
    input: '{}',
    env: { PATH: `${bin}:${process.env.PATH}`, CLAUDE_PLUGIN_ROOT: ROOT },
  });
  expect(done.status).toBe(0);
});

test('the hook command exits 0 with no node on the path', () => {
  const tmp = tempDir();
  const bin = fakeBin(tmp, {});
  const done = spawnSync('/bin/sh', ['-c', hookCommand()], {
    input: '{}',
    env: { PATH: bin, CLAUDE_PLUGIN_ROOT: ROOT },
  });
  expect(done.status).toBe(0);
});

test('the bundles record a turn as claude code runs them', { timeout: 30_000 }, async () => {
  const tmp = tempDir();
  const transcript = new Transcript(join(tmp, 'projects', 'p', 'session-one.jsonl'), 'session-one');
  transcript.prompt();
  transcript.reply();
  const data = join(tmp, 'data');
  const payload = { ...STOP, session_id: 'session-one', transcript_path: transcript.path };
  // No Telmoni at this endpoint: the worker keeps the run for the next hook, and says so.
  const env = {
    PATH: process.env.PATH ?? '',
    HOME: tmp,
    CLAUDE_PLUGIN_ROOT: ROOT,
    CLAUDE_PLUGIN_DATA: data,
    CLAUDE_PLUGIN_OPTION_TELMONI_API_KEY: KEY,
    CLAUDE_PLUGIN_OPTION_TELMONI_ENDPOINT: 'http://localhost:1',
  };
  const done = spawnSync('/bin/sh', ['-c', hookCommand()], { input: JSON.stringify(payload), env });
  expect(done.status).toBe(0);
  const log = join(data, 'hook.log');
  for (let waited = 0; waited < 25_000; waited += 100) {
    if (existsSync(log) && readFileSync(log, 'utf8').includes('not delivered')) break;
    await sleep(100);
  }
  expect(readFileSync(log, 'utf8')).toContain('not delivered');
  const state = JSON.parse(readFileSync(join(data, 'session-one.json'), 'utf8')) as {
    pending: unknown[];
  };
  expect(state.pending).toHaveLength(1);
  expect(existsSync(join(data, 'session-one.lock'))).toBe(false);
  assertMetadataOnly(filesIn(data));
});
