/** What the plugin remembers of a session between hooks, and the lock one hook holds on it while it works. */

import { randomUUID } from 'node:crypto';
import {
  closeSync,
  fsyncSync,
  openSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  utimesSync,
  writeFileSync,
  writeSync,
} from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';

import type { PlainRun } from './record.js';
import * as tagRules from './tags.js';
import { isObject } from './transcript.js';

export const limits = {
  sent: 500,
  // Runs kept for a Telmoni that stays away: the newest, so the file stays small and current.
  pending: 200,
  // A lock not freshened for this long was left by a hook that died holding it.
  staleMs: 60_000,
};

// Bad bytes are a state not read, never one read as something else.
const UTF8 = new TextDecoder('utf-8', { fatal: true });

export class State {
  // Where the rows of the first turn not yet sent begin.
  offset = 0;
  sent: string[] = [];
  // Turns Telmoni could not take yet, in order, sent again before any new one.
  pending: PlainRun[] = [];
  warned: Record<string, boolean> = {};
  // Where the session's key sends (`destination`): its kept runs go there alone.
  destination: string | undefined;
  // The tags asked for in the turns before `offset`, which every later turn carries.
  tags: tagRules.Tags = new Map();

  /**
   * The session's state, new where none was saved; one that cannot be read throws, since read as
   * new it would send the whole session again and lose its kept runs.
   */
  static load(path: string): State {
    let text: string;
    try {
      text = UTF8.decode(readFileSync(path));
    } catch (fault) {
      if ((fault as NodeJS.ErrnoException).code === 'ENOENT') return new State();
      throw fault;
    }
    const data: unknown = JSON.parse(text);
    if (!isObject(data)) throw new TypeError('the state is not an object');
    const state = new State();
    const { offset, sent, pending, warned, destination, tags } = data;
    if (typeof offset === 'number' && Number.isInteger(offset) && offset >= 0)
      state.offset = offset;
    if (Array.isArray(sent)) {
      state.sent = sent.filter((item) => typeof item === 'string').slice(-limits.sent);
    }
    if (Array.isArray(pending)) state.pending = pending.filter(isObject) as unknown as PlainRun[];
    if (isObject(warned)) {
      state.warned = Object.fromEntries(
        Object.entries(warned)
          .filter(([, value]) => value === true)
          .map(([key]) => [key, true]),
      );
    }
    if (typeof destination === 'string') state.destination = destination;
    state.tags = tagRules.kept(tags);
    return state;
  }

  /** Written aside and synced before it replaces the last, so a power cut leaves one whole. */
  save(path: string): void {
    this.sent = this.sent.slice(-limits.sent);
    const text = JSON.stringify({
      offset: this.offset,
      sent: this.sent,
      pending: this.pending,
      warned: this.warned,
      destination: this.destination ?? null,
      tags: Object.fromEntries(this.tags),
    });
    const temporary = `${path}.${process.pid}.tmp`;
    const fd = openSync(temporary, 'w', 0o600);
    try {
      writeSync(fd, text);
      fsyncSync(fd);
    } finally {
      closeSync(fd);
    }
    renameSync(temporary, path);
    // Beside a state still holding runs, so any session's hook finds what is left to send.
    const marker = `${path.replace(/\.json$/, '')}.pending`;
    if (this.pending.length > 0) touch(marker);
    else rmSync(marker, { force: true });
  }

  markSent(runId: string): void {
    if (!this.sent.includes(runId)) this.sent.push(runId);
  }

  /** Lets the oldest pending runs go past the cap; how many went. */
  trimPending(): number {
    const over = this.pending.length - limits.pending;
    if (over <= 0) return 0;
    this.pending.splice(0, over);
    return over;
  }
}

function touch(path: string): void {
  const now = new Date();
  try {
    utimesSync(path, now, now);
  } catch {
    closeSync(openSync(path, 'a', 0o600));
  }
}

/**
 * One worker a session at a time. The file is made only where none is (`wx`) and holds its
 * holder's token, `<pid>:<uuid>`; it is freshened while held, and taken from a holder whose
 * process is gone or which left it stale.
 */
export class Lock {
  #token: string | undefined;
  #freshen: NodeJS.Timeout | undefined;

  constructor(readonly path: string) {}

  /** Takes the lock, waiting up to `waitMs` for its holder, or without limit when `waitMs` is none. */
  async acquire(waitMs: number | undefined, pollMs = 200): Promise<boolean> {
    const deadline = waitMs === undefined ? Infinity : Date.now() + waitMs;
    const token = `${process.pid}:${randomUUID()}`;
    for (;;) {
      try {
        writeFileSync(this.path, token, { flag: 'wx', mode: 0o600 });
        break;
      } catch (fault) {
        if ((fault as NodeJS.ErrnoException).code !== 'EEXIST') throw fault;
      }
      if (deadHolder(this.path) && breakDead(this.path)) continue;
      if (Date.now() >= deadline) return false;
      await sleep(pollMs);
    }
    this.#token = token;
    // Kept fresh while held, so only a dead hook's lock goes stale, however long the work takes.
    this.#freshen = setInterval(() => {
      try {
        const now = new Date();
        utimesSync(this.path, now, now);
      } catch {
        // Taken away: the release leaves it alone.
      }
    }, limits.staleMs / 6);
    this.#freshen.unref();
    return true;
  }

  release(): void {
    clearInterval(this.#freshen);
    const token = this.#token;
    this.#token = undefined;
    if (token === undefined) return;
    try {
      // Only its own: a hook that judged this one dead may hold the path now.
      if (readFileSync(this.path, 'utf8') === token) rmSync(this.path, { force: true });
    } catch {
      // Gone already.
    }
  }
}

/**
 * Removes a dead holder's lock, one hook at a time: two that judged it dead at once would
 * otherwise each remove it, the second removing the lock the first had just taken.
 */
function breakDead(path: string): boolean {
  const breaker = `${path}.break`;
  try {
    writeFileSync(breaker, '', { flag: 'wx', mode: 0o600 });
  } catch {
    // Another hook is breaking it; one that died doing so left the file, which goes stale too.
    if (Date.now() - modified(breaker) > limits.staleMs) rmSync(breaker, { force: true });
    return false;
  }
  try {
    if (!deadHolder(path)) return false;
    rmSync(path, { force: true });
    return true;
  } finally {
    rmSync(breaker, { force: true });
  }
}

function modified(path: string): number {
  try {
    return statSync(path).mtimeMs;
  } catch {
    return Date.now();
  }
}

/** Whether a lock's holder is gone: its process ended, or the lock went stale, which a reused pid cannot hide. */
function deadHolder(path: string): boolean {
  let token: string;
  let touched: number;
  try {
    token = readFileSync(path, 'utf8');
    touched = statSync(path).mtimeMs;
  } catch {
    // Let go between the two looks: the next try takes it.
    return false;
  }
  if (Date.now() - touched > limits.staleMs) return true;
  const pid = Number(token.split(':')[0]);
  return Number.isInteger(pid) && pid > 0 && !alive(pid);
}

function alive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (fault) {
    // Another user's process is alive; it is just not this one's to signal.
    return (fault as NodeJS.ErrnoException).code === 'EPERM';
  }
}
