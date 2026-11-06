import { chmodSync, mkdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, expect, test, vi } from 'vitest';

import { DEFAULT_ENDPOINT, type Env, providerOf, readSettings, stateDir } from '../src/settings.js';
import { tempDir } from './helpers.js';

afterEach(() => {
  vi.unstubAllEnvs();
});

test('a key goes only with the endpoint named beside it', () => {
  const base = { CLAUDE_CONFIG_DIR: tempDir() };
  const plugin = {
    CLAUDE_PLUGIN_OPTION_TELMONI_API_KEY: 'from-plugin',
    CLAUDE_PLUGIN_OPTION_TELMONI_ENDPOINT: 'https://plugin.example',
  };
  let read = readSettings({ ...base, ...plugin, TELMONI_ENDPOINT: 'https://repo.example' });
  expect([read.apiKey, read.endpoint]).toEqual(['from-plugin', 'https://plugin.example']);
  read = readSettings({ ...base, ...plugin, TELMONI_API_KEY: 'from-env' });
  expect([read.apiKey, read.endpoint]).toEqual(['from-env', DEFAULT_ENDPOINT]);
  const blank = {
    ...base,
    ...plugin,
    TELMONI_API_KEY: '  ',
    TELMONI_ENDPOINT: 'https://repo.example',
  };
  read = readSettings(blank);
  expect([read.apiKey, read.endpoint]).toEqual(['from-plugin', 'https://plugin.example']);
});

test('the state lives in the plugins data folder', () => {
  const data = join(tempDir(), 'data');
  expect(stateDir({ CLAUDE_PLUGIN_DATA: data })).toBe(data);
  expect(statSync(data).isDirectory()).toBe(true);
});

test('without a data folder the state lives under the config folder', () => {
  const tmp = tempDir();
  const env = { CLAUDE_PLUGIN_DATA: 'relative/path', CLAUDE_CONFIG_DIR: tmp };
  expect(stateDir(env)).toBe(join(tmp, 'telmoni'));
});

test('settings read their defaults', () => {
  const read = readSettings({ CLAUDE_CONFIG_DIR: tempDir() });
  expect(read.apiKey).toBeUndefined();
  expect(read.endpoint).toBe(DEFAULT_ENDPOINT);
  expect(read.captureContent).toBe(false);
  expect([read.scrubSecrets, read.scrubPii]).toEqual([true, true]);
});

test('the content switch goes with the key', () => {
  const own = {
    CLAUDE_CONFIG_DIR: tempDir(),
    CLAUDE_PLUGIN_OPTION_TELMONI_API_KEY: 'from-plugin',
    CLAUDE_PLUGIN_OPTION_TELMONI_CAPTURE_CONTENT: 'true',
  };
  expect(readSettings(own).captureContent).toBe(true);
  // The environment's key takes the environment's switch, never the plugin's own.
  const envKey = { ...own, TELMONI_API_KEY: 'from-env' };
  expect(readSettings(envKey).captureContent).toBe(false);
  expect(readSettings({ ...envKey, TELMONI_CAPTURE_CONTENT: '1' }).captureContent).toBe(true);
  // The plugin's own key takes its own switch, whatever the environment says.
  const switchedOff = { ...own, CLAUDE_PLUGIN_OPTION_TELMONI_CAPTURE_CONTENT: 'false' };
  expect(readSettings({ ...switchedOff, TELMONI_CAPTURE_CONTENT: '1' }).captureContent).toBe(false);
});

test.each<[string | undefined, boolean]>([
  ['true', true],
  ['false', false],
  ['1', false],
  ['True', false],
  ['yes', false],
  [' true', false],
  ['', false],
  [undefined, false],
])(
  'the plugins own switch is on at the true claude code hands the hook alone (%j, %s)',
  (given, on) => {
    const env: Record<string, string> = {
      CLAUDE_CONFIG_DIR: tempDir(),
      CLAUDE_PLUGIN_OPTION_TELMONI_API_KEY: 'k',
    };
    if (given !== undefined) env.CLAUDE_PLUGIN_OPTION_TELMONI_CAPTURE_CONTENT = given;
    expect(readSettings(env).captureContent).toBe(on);
  },
);

test.each<[string | undefined, boolean]>([
  // The SDKs' own cases, `sdk/fixtures/capture_content.json`.
  [undefined, false],
  ['', false],
  ['1', true],
  [' 1\t', true],
  ['0', false],
  ['true', false],
  ['yes', false],
  ['TRUE', false],
  ['on', false],
  ['01', false],
  ['1.0', false],
  // Unicode's White_Space is trimmed, and nothing else: no separator, no byte-order mark `trim` takes.
  [' 1　', true],
  ['\x1c1', false],
  ['﻿1', false],
])('the environments switch is read as the sdks read it (%j, %s)', (given, on) => {
  const env: Record<string, string> = { CLAUDE_CONFIG_DIR: tempDir(), TELMONI_API_KEY: 'k' };
  if (given !== undefined) env.TELMONI_CAPTURE_CONTENT = given;
  expect(readSettings(env).captureContent).toBe(on);
});

function scrubbing(env: Env): [boolean, boolean] {
  const read = readSettings(env);
  return [read.scrubSecrets, read.scrubPii];
}

test('the scrubbers switches go with the key', () => {
  const own = {
    CLAUDE_CONFIG_DIR: tempDir(),
    CLAUDE_PLUGIN_OPTION_TELMONI_API_KEY: 'from-plugin',
    CLAUDE_PLUGIN_OPTION_TELMONI_SCRUB_SECRETS: 'false',
  };
  expect(scrubbing(own)).toEqual([false, true]);
  expect(scrubbing({ ...own, CLAUDE_PLUGIN_OPTION_TELMONI_SCRUB_PII: 'false' })).toEqual([
    false,
    false,
  ]);
  // The plugin's own key takes its own switches, whatever the environment says.
  expect(scrubbing({ ...own, TELMONI_SCRUB_PII: '0' })).toEqual([false, true]);
  // The environment's key takes the environment's switches, never the plugin's own.
  const envKey = { ...own, TELMONI_API_KEY: 'from-env' };
  expect(scrubbing(envKey)).toEqual([true, true]);
  expect(scrubbing({ ...envKey, TELMONI_SCRUB_SECRETS: '0' })).toEqual([false, true]);
  expect(scrubbing({ ...envKey, TELMONI_SCRUB_PII: '0' })).toEqual([true, false]);
});

test.each<[string | undefined, boolean]>([
  ['false', false],
  ['true', true],
  ['False', true],
  [' false', true],
  ['0', true],
  ['', true],
  [undefined, true],
])(
  'the plugins own scrubbers are off at the false claude code hands the hook alone (%j, %s)',
  (given, on) => {
    const env: Record<string, string> = {
      CLAUDE_CONFIG_DIR: tempDir(),
      CLAUDE_PLUGIN_OPTION_TELMONI_API_KEY: 'k',
    };
    if (given !== undefined) {
      env.CLAUDE_PLUGIN_OPTION_TELMONI_SCRUB_SECRETS = given;
      env.CLAUDE_PLUGIN_OPTION_TELMONI_SCRUB_PII = given;
    }
    expect(scrubbing(env)).toEqual([on, on]);
  },
);

test.each<[string | undefined, boolean]>([
  [undefined, true],
  ['', true],
  ['0', false],
  [' 0\t', false],
  [' 0　', false],
  ['1', true],
  ['false', true],
  ['no', true],
  ['off', true],
  ['00', true],
  ['0.0', true],
  // Unicode's White_Space is trimmed, and nothing else: no separator, no byte-order mark `trim` takes.
  ['\x1c0', true],
  ['﻿0', true],
])('the environments scrubbers are off at 0 alone (%j, %s)', (given, on) => {
  const env: Record<string, string> = { CLAUDE_CONFIG_DIR: tempDir(), TELMONI_API_KEY: 'k' };
  if (given !== undefined) {
    env.TELMONI_SCRUB_SECRETS = given;
    env.TELMONI_SCRUB_PII = given;
  }
  expect(scrubbing(env)).toEqual([on, on]);
});

test('the provider follows claude codes switches', () => {
  expect(providerOf({})).toBe('anthropic');
  expect(providerOf({ CLAUDE_CODE_USE_BEDROCK: '1' })).toBe('aws.bedrock');
  expect(providerOf({ CLAUDE_CODE_USE_VERTEX: 'TRUE' })).toBe('gcp.vertex_ai');
  expect(providerOf({ CLAUDE_CODE_USE_FOUNDRY: '1' })).toBe('azure.ai.inference');
  expect(providerOf({ CLAUDE_CODE_USE_BEDROCK: '0' })).toBe('anthropic');
});

test('a relative config folder is never taken', () => {
  const tmp = tempDir();
  vi.stubEnv('HOME', tmp);
  expect(stateDir({ CLAUDE_CONFIG_DIR: 'relative' })).toBe(join(tmp, '.claude', 'telmoni'));
});

test('the state folder is the owners alone', () => {
  const made = stateDir({ CLAUDE_PLUGIN_DATA: join(tempDir(), 'data') });
  expect(statSync(made).mode & 0o777).toBe(0o700);
});

test('a state folder an earlier version left open is closed', () => {
  const data = join(tempDir(), 'data');
  mkdirSync(data, { mode: 0o755 });
  chmodSync(data, 0o755);
  stateDir({ CLAUDE_PLUGIN_DATA: data });
  expect(statSync(data).mode & 0o777).toBe(0o700);
});
