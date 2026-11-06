/**
 * The tags a developer sets on a session's runs: asked for through the plugin's `tag` skill, or
 * kept in a `.telmoni-tags.json` at or above the folder a turn started in, read for its tags alone.
 * The folder and the file's path are never kept, sent or logged.
 */

import {
  type Stats,
  closeSync,
  constants,
  fstatSync,
  lstatSync,
  openSync,
  readSync,
} from 'node:fs';
import { dirname, isAbsolute, join } from 'node:path';

import { isObject } from './transcript.js';
import { within } from './text.js';

export const FILE = '.telmoni-tags.json';
const FILE_MAX = 64 * 1024;
// Ingest's caps: the tags a span carries, a value's characters.
export const TAGS_MAX = 32;
const VALUE_MAX = 256;
// Never a `:`, which the console's `key:value` filter splits on.
const KEY = /^[A-Za-z0-9_.-]{1,64}$/;
const CONTROL = /[\x00-\x1f\x7f-\x9f]/;
// Claude Code's own tag of the skills a turn ran.
const RESERVED = 'skills';
// Windows has neither: there, a link is followed and a pipe is no file to be found.
const NOFOLLOW = constants.O_NOFOLLOW ?? 0;
const NONBLOCK = constants.O_NONBLOCK ?? 0;
// A byte-order mark is taken off, as a text editor writes one.
const UTF8 = new TextDecoder('utf-8', { fatal: true });

export type Tags = Map<string, string>;
export type Note = (text: string) => void;

/** Why a tag is dropped, in words that name no key or value; none for one ingest keeps. */
export function problem(key: unknown, value: unknown = ''): string | undefined {
  if (typeof key !== 'string' || !KEY.test(key)) {
    return 'tag dropped: its key is not 1 to 64 letters, digits, _ . or -';
  }
  if (key === RESERVED) return "tag dropped: skills is the plugin's own";
  // A half of a character no export could carry, and the turn would never go.
  if (
    typeof value !== 'string' ||
    !within(value, VALUE_MAX) ||
    CONTROL.test(value) ||
    !value.isWellFormed()
  ) {
    return 'tag dropped: its value is not text of at most 256 characters';
  }
  return undefined;
}

/** `given` with each command's `key=value` set and `key=` cleared, in the order asked. */
export function asked(given: Tags, commands: readonly string[], note: Note): Tags {
  const kept = new Map(given);
  for (const command of commands) {
    for (const token of command.split(/\s+/)) {
      if (token === '') continue;
      const equals = token.indexOf('=');
      const key = equals < 0 ? token : token.slice(0, equals);
      const value = equals < 0 ? '' : token.slice(equals + 1);
      const why = equals < 0 ? 'tag dropped: not key=value' : problem(key, value);
      if (why !== undefined) note(why);
      else if (value) kept.set(key, value);
      else kept.delete(key);
    }
  }
  return kept;
}

/** A turn's tags: those asked for, then its file's for every key not asked for. */
export function ofTurn(asked: Tags, folder: string | undefined, note: Note): Tags {
  const tags = new Map(asked);
  for (const [key, value] of fromFile(folder, note)) {
    if (!tags.has(key)) tags.set(key, value);
  }
  return tags;
}

/**
 * The tags of the nearest `.telmoni-tags.json` at or above `folder`, a member that breaks a rule
 * dropped; none where there is no such file, or it is not one to read.
 */
export function fromFile(folder: string | undefined, note: Note): Tags {
  if (!folder || !isAbsolute(folder)) return new Map();
  for (let place = folder; ; place = dirname(place)) {
    const path = join(place, FILE);
    let found: Stats;
    try {
      found = lstatSync(path);
    } catch (fault) {
      const code = (fault as NodeJS.ErrnoException).code;
      if (code !== 'ENOENT' && code !== 'ENOTDIR') {
        note('tags file not read: unreadable');
        return new Map();
      }
      if (dirname(place) === place) return new Map();
      continue;
    }
    // The nearest entry decides: one not read leaves the turn with none, never a parent's.
    return found.isFile() ? read(path, note) : refused(note);
  }
}

function read(path: string, note: Note): Tags {
  let fd: number;
  try {
    // Never through a link, and never waiting on a pipe swapped in since the look.
    fd = openSync(path, constants.O_RDONLY | NOFOLLOW | NONBLOCK);
  } catch (fault) {
    if ((fault as NodeJS.ErrnoException).code === 'ELOOP') return refused(note);
    note('tags file not read: unreadable');
    return new Map();
  }
  let raw: Buffer;
  try {
    if (!fstatSync(fd).isFile()) return refused(note);
    raw = readUpTo(fd, FILE_MAX + 1);
  } catch {
    note('tags file not read: unreadable');
    return new Map();
  } finally {
    closeSync(fd);
  }
  if (raw.length > FILE_MAX) {
    note('tags file not read: past 64 KiB');
    return new Map();
  }
  let data: unknown;
  try {
    data = JSON.parse(UTF8.decode(raw));
  } catch {
    data = undefined;
  }
  if (!isObject(data)) {
    note('tags file not read: not a JSON object');
    return new Map();
  }
  const tags: Tags = new Map();
  for (const [key, value] of Object.entries(data)) {
    const why = problem(key, value);
    if (why !== undefined) note(why);
    else tags.set(key, value as string);
  }
  return tags;
}

function readUpTo(fd: number, max: number): Buffer {
  const buffer = Buffer.alloc(max);
  let filled = 0;
  while (filled < max) {
    const read = readSync(fd, buffer, filled, max - filled, null);
    if (read === 0) break;
    filled += read;
  }
  return buffer.subarray(0, filled);
}

function refused(note: Note): Tags {
  note('tags file not read: not a plain file');
  return new Map();
}

/** Tags read back from the plugin's own state: each that still keeps the rules. */
export function kept(given: unknown): Tags {
  if (!isObject(given)) return new Map();
  return new Map(
    Object.entries(given)
      .slice(0, TAGS_MAX)
      .filter((entry): entry is [string, string] => {
        const [key, value] = entry;
        return typeof value === 'string' && value !== '' && problem(key, value) === undefined;
      }),
  );
}
