/** The hook's input: which session, which transcript, which event. */

import { homedir } from 'node:os';
import { join } from 'node:path';

import type { Env } from './settings.js';
import { errorKind, isObject } from './transcript.js';

export const EVENTS: readonly string[] = ['Stop', 'StopFailure', 'SessionEnd'];
const ID = /^[A-Za-z0-9._-]{1,128}$/;
// A background task of these kinds can still change the turn it belongs to.
const BUSY_KINDS: readonly unknown[] = ['subagent', 'workflow', 'teammate'];

/** What the hook hands its worker, by the worker's stdin. */
export interface Payload {
  sessionId: string;
  transcriptPath: string;
  event: string;
  error: string | undefined;
  busy: boolean;
}

/** The payload as the worker reads it back. */
export function fromJson(data: unknown): Payload {
  if (!isObject(data)) throw new TypeError('the payload is not an object');
  const { sessionId, transcriptPath, event, error, busy } = data;
  if (typeof sessionId !== 'string' || typeof transcriptPath !== 'string') {
    throw new TypeError('the payload names no session or transcript');
  }
  return {
    sessionId,
    transcriptPath,
    event: String(event),
    error: typeof error === 'string' ? error : undefined,
    busy: busy === true,
  };
}

/**
 * The payload, or none when it is not a turn of Claude Code's to record: another editor running
 * Claude Code's hooks; another event; no session.
 */
export function parse(raw: string, env: Env): Payload | undefined {
  if (env.CURSOR_VERSION || env.CURSOR_PROJECT_DIR) return undefined;
  let data: unknown;
  try {
    data = raw.trim() ? JSON.parse(raw) : undefined;
  } catch {
    return undefined;
  }
  if (!isObject(data)) return undefined;
  if (
    ['conversation_id', 'generation_id', 'cursor_version'].some((key) => Object.hasOwn(data, key))
  ) {
    return undefined;
  }
  const event = data.hook_event_name;
  const session = data.session_id;
  const path = data.transcript_path;
  if (typeof event !== 'string' || !EVENTS.includes(event)) return undefined;
  if (typeof session !== 'string' || !ID.test(session)) return undefined;
  if (typeof path !== 'string' || !path) return undefined;
  const tasks = data.background_tasks;
  const busy =
    Array.isArray(tasks) && tasks.some((task) => isObject(task) && BUSY_KINDS.includes(task.type));
  return {
    sessionId: session,
    transcriptPath: expandUser(path),
    event,
    error: event === 'StopFailure' ? (errorKind(data.error) ?? 'unknown') : undefined,
    busy,
  };
}

function expandUser(path: string): string {
  if (path === '~') return homedir();
  return path.startsWith('~/') ? join(homedir(), path.slice(2)) : path;
}
