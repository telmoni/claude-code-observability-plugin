/** The tags a developer sets: asked for in order, and read from the nearest tags file above a turn's folder, never through a link and never a parent's in the nearest one's place. */

import { execFileSync } from 'node:child_process';
import { chmodSync, mkdirSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { expect, test } from 'vitest';

import * as tags from '../src/tags.js';
import { tempDir } from './helpers.js';

function write(folder: string, data: string | Record<string, unknown>): string {
  mkdirSync(folder, { recursive: true });
  const path = join(folder, tags.FILE);
  writeFileSync(path, typeof data === 'string' ? data : JSON.stringify(data));
  return path;
}

function heard(): [lines: string[], note: tags.Note] {
  const lines: string[] = [];
  return [lines, (line) => void lines.push(line)];
}

test('the nearest file at or above the folder gives its tags', () => {
  const tmp = tempDir();
  write(tmp, { repo: 'outer', team: 'core' });
  write(join(tmp, 'inner'), { repo: 'telmoni' });
  mkdirSync(join(tmp, 'inner', 'src', 'deep'), { recursive: true });
  const [lines, note] = heard();
  expect(Object.fromEntries(tags.fromFile(join(tmp, 'inner', 'src', 'deep'), note))).toEqual({
    repo: 'telmoni',
  });
  expect(Object.fromEntries(tags.fromFile(join(tmp, 'gone'), note))).toEqual({
    repo: 'outer',
    team: 'core',
  });
  expect(Object.fromEntries(tags.fromFile(undefined, note))).toEqual({});
  expect(Object.fromEntries(tags.fromFile('relative/folder', note))).toEqual({});
  expect(lines).toEqual([]);
});

test('a member that breaks a rule is dropped with a line naming none of it', () => {
  const tmp = tempDir();
  write(tmp, {
    repo: 'telmoni',
    skills: 'mine',
    'a:b': 'KEY-NEVER-LOGGED',
    '': 'x',
    ['k'.repeat(65)]: 'x',
    long: 'v'.repeat(257),
    ctl: 'VALUE-NEVER-LOGGED\n',
    number: 7,
    empty: '',
    ['k'.repeat(64)]: 'v'.repeat(256),
  });
  const [lines, note] = heard();
  expect(Object.fromEntries(tags.fromFile(tmp, note))).toEqual({
    repo: 'telmoni',
    empty: '',
    ['k'.repeat(64)]: 'v'.repeat(256),
  });
  expect(new Set(lines)).toEqual(
    new Set([
      "tag dropped: skills is the plugin's own",
      'tag dropped: its key is not 1 to 64 letters, digits, _ . or -',
      'tag dropped: its value is not text of at most 256 characters',
    ]),
  );
  expect(lines.some((line) => ['NEVER-LOGGED', tmp].some((word) => line.includes(word)))).toBe(
    false,
  );
});

test('a file that holds no json object gives no tags', () => {
  const tmp = tempDir();
  for (const text of ['[1, 2]', 'not json', '"repo"', '']) {
    write(tmp, text);
    const [lines, note] = heard();
    expect(Object.fromEntries(tags.fromFile(tmp, note))).toEqual({});
    expect(lines).toEqual(['tags file not read: not a JSON object']);
  }
  writeFileSync(join(tmp, tags.FILE), Buffer.from([0xff, 0xfe]));
  expect(Object.fromEntries(tags.fromFile(tmp, () => {}))).toEqual({});
});

test('a link a pipe a folder or a file past 64 kib is never read nor a parents instead', () => {
  const tmp = tempDir();
  write(tmp, { repo: 'outer' });
  const real = write(join(tmp, 'real'), { repo: 'linked' });
  mkdirSync(join(tmp, 'link'));
  symlinkSync(real, join(tmp, 'link', tags.FILE));
  mkdirSync(join(tmp, 'pipe'));
  // Node has no mkfifo of its own.
  execFileSync('mkfifo', [join(tmp, 'pipe', tags.FILE)]);
  mkdirSync(join(tmp, 'folder', tags.FILE), { recursive: true });
  const big = write(join(tmp, 'big'), { repo: 'big' });
  writeFileSync(big, JSON.stringify({ repo: 'big' }) + ' '.repeat(64 * 1024));
  const [lines, note] = heard();
  for (const place of ['link', 'pipe', 'folder', 'big']) {
    expect(Object.fromEntries(tags.fromFile(join(tmp, place), note)), place).toEqual({});
  }
  expect(lines).toEqual([
    ...Array<string>(3).fill('tags file not read: not a plain file'),
    'tags file not read: past 64 KiB',
  ]);
});

test('tags asked for are set and cleared in order and a word without equals dropped', () => {
  const [lines, note] = heard();
  const given = new Map([['team', 'core']]);
  const asked = tags.asked(
    given,
    ['repo=telmoni branch=main', 'branch= stray team=infra a:b=c'],
    note,
  );
  expect(Object.fromEntries(asked)).toEqual({ team: 'infra', repo: 'telmoni' });
  expect(Object.fromEntries(given)).toEqual({ team: 'core' });
  expect(lines).toEqual([
    'tag dropped: not key=value',
    'tag dropped: its key is not 1 to 64 letters, digits, _ . or -',
  ]);
});

test('a turns tags are those asked for then its files for every other key', () => {
  const tmp = tempDir();
  write(tmp, { repo: 'file', team: 'core' });
  expect(Object.fromEntries(tags.ofTurn(new Map([['repo', 'asked']]), tmp, () => {}))).toEqual({
    repo: 'asked',
    team: 'core',
  });
});

test('tags read back from the state are those that keep the rules', () => {
  const kept = tags.kept({ repo: 'telmoni', skills: 'x', 'a:b': 'y', n: 1, e: '' });
  expect(Object.fromEntries(kept)).toEqual({ repo: 'telmoni' });
  expect(Object.fromEntries(tags.kept(['repo']))).toEqual({});
});

test('a value no export could carry is dropped and a byte order mark read past', () => {
  const tmp = tempDir();
  const bytes = Buffer.from('\xef\xbb\xbf{"repo": "telmoni", "bad": "\\ud800"}', 'latin1');
  writeFileSync(join(tmp, tags.FILE), bytes);
  const [lines, note] = heard();
  expect(Object.fromEntries(tags.fromFile(tmp, note))).toEqual({ repo: 'telmoni' });
  expect(lines).toEqual(['tag dropped: its value is not text of at most 256 characters']);
  expect(Object.fromEntries(tags.asked(new Map(), ['repo=\ud800'], note))).toEqual({});
});

test('an entry that cannot be read stops the walk', () => {
  const tmp = tempDir();
  write(tmp, { repo: 'outer' });
  const locked = write(join(tmp, 'locked'), { repo: 'inner' });
  chmodSync(locked, 0);
  const [lines, note] = heard();
  try {
    expect(Object.fromEntries(tags.fromFile(join(tmp, 'locked'), note))).toEqual({});
  } finally {
    chmodSync(locked, 0o600);
  }
  expect(lines).toEqual(['tags file not read: unreadable']);
});
