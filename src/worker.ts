/**
 * The work of one hook, in a process of its own: read what the session wrote since the last hook,
 * send each turn that has ended, remember the rest.
 */

import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

import { Log } from './log.js';
import { type Payload, fromJson } from './payload.js';
import * as records from './record.js';
import type { PlainRun } from './record.js';
import { type SendHooks, Sender, type Verdict } from './send.js';
import { type Env, type Settings, destination, readSettings } from './settings.js';
import { Lock, State, limits } from './state.js';
import * as tagRules from './tags.js';
import * as transcript from './transcript.js';
import * as turns from './turns.js';

export const waits = {
  // A Stop waits this long for another hook on the session; the session's end waits it out.
  stopMs: 60_000,
  settleQuietMs: 500,
  settleLimitMs: 3_000,
  settlePollMs: 100,
  // Each run sent is remembered at most this soon after the last: a catch-up may take hours.
  saveEveryMs: 1_000,
  // A session's lock untouched this long is let go: a session hooks again within days, or not at all.
  sweepAfterMs: 7 * 24 * 3600 * 1000,
};

/** The worker's whole input: the payload its hook wrote to its stdin. */
export async function main(raw: string, env: Env, hooks: SendHooks = {}): Promise<number> {
  try {
    return await run(fromJson(JSON.parse(raw)), env, hooks);
  } catch {
    // A worker never fails the session, even with nowhere to log.
    return 0;
  }
}

export async function run(given: Payload, env: Env, hooks: SendHooks = {}): Promise<number> {
  let settings: Settings;
  try {
    settings = readSettings(env);
  } catch {
    return 0;
  }
  const log = new Log(join(settings.stateDir, 'hook.log'));
  try {
    await work(given, settings, log, hooks);
  } catch (fault) {
    // A hook never fails the session: the fault is a line naming its kind.
    log.line(given.sessionId, given.event, `failed: ${nameOf(fault)}`);
  }
  return 0;
}

async function work(given: Payload, settings: Settings, log: Log, hooks: SendHooks): Promise<void> {
  const { sessionId: session, event } = given;
  const statePath = join(settings.stateDir, `${session}.json`);
  const lock = new Lock(join(settings.stateDir, `${session}.lock`));
  if (!(await lock.acquire(event === 'SessionEnd' ? undefined : waits.stopMs))) {
    log.line(session, event, 'another hook holds the session; the next hook sends');
    return;
  }
  let reached = false;
  try {
    let state: State;
    try {
      state = State.load(statePath);
    } catch (fault) {
      // Left as it is: read as new, it would send the session again and lose its kept runs.
      log.line(session, event, `state not read (${nameOf(fault)}); nothing sent`);
      return;
    }
    if (!settings.apiKey) {
      if (!state.warned.key) {
        state.warned.key = true;
        state.save(statePath);
        log.line(
          session,
          event,
          'no key: set TELMONI_API_KEY as a plugin setting or in the environment',
        );
      }
      return;
    }
    const path = given.transcriptPath;
    if (!isFile(path)) {
      log.line(session, event, 'no transcript at the path given');
      return;
    }
    await settle(path);
    const read = transcript.readRows(path, state.offset);
    if (read.restarted) {
      state.offset = 0;
      state.tags = new Map();
    }
    const subagents = transcript.discoverSubagents(path);
    const found = turns.assemble(read.rows, session, read.end, settings.captureContent);
    const sender = new Sender(settings, log, session, event, hooks);
    state.destination = destination(settings);
    const saver = new Saver(state, statePath);
    try {
      await deliver(state, found, sender, given, subagents, log, saver);
    } finally {
      saver.save();
    }
    reached = state.pending.length === 0;
  } finally {
    lock.release();
  }
  if (reached) await sendLeft(settings, log, session, event, hooks);
  await sweepLocks(settings, session);
}

/**
 * Lock files of other sessions gone quiet, judged by their state's last save; a state stays, since
 * read as missing it would send a resumed session from its start, and it keeps no transcript's
 * path to judge it by.
 */
async function sweepLocks(settings: Settings, own: string): Promise<void> {
  const now = Date.now();
  for (const name of listed(settings.stateDir, '.lock')) {
    if (name === own) continue;
    const path = join(settings.stateDir, `${name}.lock`);
    const last = Math.max(modified(path), modified(join(settings.stateDir, `${name}.json`)));
    if (now - last <= waits.sweepAfterMs) continue;
    // Taken, as a dead holder's lock is, and let go, which removes it.
    const lock = new Lock(path);
    if (await lock.acquire(0)) lock.release();
  }
}

/**
 * Other sessions' kept runs, the longest waiting first, each where its own session's key sends
 * alone: their last hook may have met no Telmoni.
 */
async function sendLeft(
  settings: Settings,
  log: Log,
  own: string,
  event: string,
  hooks: SendHooks,
): Promise<void> {
  const here = destination(settings);
  const markers = listed(settings.stateDir, '.pending')
    .map((session) => ({ session, at: modified(join(settings.stateDir, `${session}.pending`)) }))
    .sort((a, b) => a.at - b.at || (a.session < b.session ? -1 : 1));
  for (const { session } of markers) {
    if (session === own) continue;
    const lock = new Lock(join(settings.stateDir, `${session}.lock`));
    if (!(await lock.acquire(0))) continue;
    let emptied = true;
    try {
      const path = join(settings.stateDir, `${session}.json`);
      let state: State;
      try {
        state = State.load(path);
      } catch {
        continue;
      }
      // Another key, or another endpoint: that session's own next hook sends them.
      if (state.destination !== here) continue;
      const sender = new Sender(settings, log, session, event, hooks);
      const saver = new Saver(state, path);
      try {
        emptied = await sendPending(state, sender, log, session, event, saver);
      } finally {
        saver.save();
      }
    } finally {
      lock.release();
    }
    // Telmoni is away again: the next hook of any session tries again.
    if (!emptied) return;
  }
}

/** The sessions with a file of this suffix in the state folder. */
function listed(folder: string, suffix: string): string[] {
  try {
    return readdirSync(folder)
      .filter((name) => name.endsWith(suffix) && name.length > suffix.length)
      .map((name) => name.slice(0, -suffix.length));
  } catch {
    return [];
  }
}

function modified(path: string): number {
  try {
    return statSync(path).mtimeMs;
  } catch {
    return 0;
  }
}

function isFile(path: string): boolean {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

/** Saves the state as each run goes, at most once in `saveEveryMs`, and whenever asked. */
class Saver {
  #last = performance.now();

  constructor(
    readonly state: State,
    readonly path: string,
  ) {}

  soon(): void {
    if (performance.now() - this.#last >= waits.saveEveryMs) this.save();
  }

  save(): void {
    this.state.save(this.path);
    this.#last = performance.now();
  }
}

async function deliver(
  state: State,
  found: turns.Turn[],
  sender: Sender,
  given: Payload,
  subagents: ReadonlyMap<string, transcript.Subagent>,
  log: Log,
  saver: Saver,
): Promise<void> {
  const { sessionId: session, event } = given;
  const note = noter(state, log, session, event);
  // What Telmoni could not take before goes first, and holds what follows.
  await sendPending(state, sender, log, session, event, saver);
  // The tags asked for so far, as of each turn: kept past a turn as the offset passes it.
  let asked = state.tags;
  for (const turn of found) {
    asked = tagRules.asked(asked, turn.asked, note);
    const runId = records.runId(session, turn.promptUuid);
    if (state.sent.includes(runId)) {
      state.offset = turn.nextOffset;
      state.tags = asked;
      continue;
    }
    if (!turns.isComplete(turn, event, given.busy, subagents)) {
      log.line(session, event, `held ${runId.slice(0, 8)}: its turn is not over yet`);
      break;
    }
    if (turn.modelCalls.length === 0 && turn.toolCalls.length === 0) {
      state.offset = turn.nextOffset;
      state.tags = asked;
      continue;
    }
    const made = records.build(turn, {
      sessionId: session,
      event,
      payloadError: given.error,
      subagents,
      read: readSubagent,
      provider: sender.settings.provider,
      tags: tagRules.ofTurn(asked, turn.folder, note),
      note,
    });
    if (state.pending.length > 0) {
      state.pending.push(made);
    } else {
      const verdict = await sender.send(made, state.warned);
      noteVerdict(log, session, event, made, verdict);
      if (verdict.outcome === 'undelivered') state.pending.push(made);
      else state.markSent(runId);
    }
    state.offset = turn.nextOffset;
    state.tags = asked;
    saver.soon();
  }
  const dropped = state.trimPending();
  if (dropped > 0) {
    log.line(
      session,
      event,
      `dropped ${dropped} runs Telmoni could not take, the newest ${limits.pending} kept`,
    );
  }
}

/** A dropped tag's line, once a session for each kind of rule it broke. */
function noter(state: State, log: Log, session: string, event: string): tagRules.Note {
  return (text) => {
    if (!state.warned[`tags:${text}`]) {
      state.warned[`tags:${text}`] = true;
      log.line(session, event, text);
    }
  };
}

/** The kept runs, in order, until one is still not delivered; whether none is left. */
async function sendPending(
  state: State,
  sender: Sender,
  log: Log,
  session: string,
  event: string,
  saver: Saver,
): Promise<boolean> {
  while (state.pending.length > 0) {
    const first = state.pending[0]!;
    const verdict = await sender.send(first, state.warned);
    noteVerdict(log, session, event, first, verdict);
    if (verdict.outcome === 'undelivered') return false;
    state.pending.shift();
    if (typeof first.run_id === 'string') state.markSent(first.run_id);
    saver.soon();
  }
  return true;
}

function readSubagent(known: transcript.Subagent): transcript.Row[] {
  try {
    return transcript.readRows(known.path, 0).rows;
  } catch {
    return [];
  }
}

function noteVerdict(
  log: Log,
  session: string,
  event: string,
  made: PlainRun,
  verdict: Verdict,
): void {
  const run = String(made.run_id).slice(0, 8);
  const lines: Record<Verdict['outcome'], string> = {
    sent: `sent ${run}`,
    partial: `taken in part ${run}: ${verdict.detail}`,
    refused: `refused, not sent again ${run}: ${verdict.detail}`,
    undelivered: `not delivered ${run}, sent again at the next hook: ${verdict.detail}`,
  };
  log.line(session, event, lines[verdict.outcome]);
}

/** Waits for the transcript to stop growing: a hook can run before its last rows land. */
async function settle(path: string): Promise<void> {
  const deadline = performance.now() + waits.settleLimitMs;
  let seen = mark(path);
  let quietSince = performance.now();
  while (performance.now() < deadline) {
    await sleep(waits.settlePollMs);
    const now = mark(path);
    if (now !== seen) {
      seen = now;
      quietSince = performance.now();
    } else if (performance.now() - quietSince >= waits.settleQuietMs) {
      return;
    }
  }
}

function mark(path: string): string {
  try {
    const stat = statSync(path, { bigint: true });
    return `${stat.size}:${stat.mtimeNs}`;
  } catch {
    return 'gone';
  }
}

function nameOf(fault: unknown): string {
  return fault instanceof Error ? fault.name : typeof fault;
}
