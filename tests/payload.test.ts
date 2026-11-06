import { expect, test } from 'vitest';

import { fromJson, parse } from '../src/payload.js';

function stop(over: Record<string, unknown> = {}): string {
  return JSON.stringify({
    session_id: 's1',
    transcript_path: '~/.claude/projects/x/s1.jsonl',
    cwd: '/x',
    hook_event_name: 'Stop',
    stop_hook_active: false,
    last_assistant_message: 'PROMPT-TEXT-NEVER-SENT',
    background_tasks: [],
    session_crons: [],
    ...over,
  });
}

test('a stop is read with its transcript expanded', () => {
  const got = parse(stop(), {});
  expect(got).toBeDefined();
  expect([got!.sessionId, got!.event, got!.error, got!.busy]).toEqual([
    's1',
    'Stop',
    undefined,
    false,
  ]);
  expect(got!.transcriptPath.endsWith('/.claude/projects/x/s1.jsonl')).toBe(true);
  expect(got!.transcriptPath).not.toContain('~');
});

test('a stop failure names its error kind', () => {
  const got = parse(stop({ hook_event_name: 'StopFailure', error: 'rate_limit' }), {});
  expect(got?.error).toBe('rate_limit');
  const nameless = parse(stop({ hook_event_name: 'StopFailure' }), {});
  expect(nameless?.error).toBe('unknown');
});

test('a session end is read', () => {
  const got = parse(stop({ hook_event_name: 'SessionEnd', reason: 'other' }), {});
  expect(got?.event).toBe('SessionEnd');
});

test('what is not ours is left alone', () => {
  expect(parse(stop({ hook_event_name: 'PreToolUse' }), {})).toBeUndefined();
  expect(parse(stop({ session_id: '../etc' }), {})).toBeUndefined();
  expect(parse(stop({ transcript_path: '' }), {})).toBeUndefined();
  expect(parse('', {})).toBeUndefined();
  expect(parse('not json', {})).toBeUndefined();
  expect(parse('[1]', {})).toBeUndefined();
});

test('a background subagent marks the session busy', () => {
  expect(parse(stop({ background_tasks: [{ type: 'shell' }] }), {})?.busy).toBe(false);
  const busy = parse(stop({ background_tasks: [{ type: 'subagent', status: 'running' }] }), {});
  expect(busy?.busy).toBe(true);
});

test('another editor running the hooks is left alone', () => {
  expect(parse(stop(), { CURSOR_VERSION: '1.0' })).toBeUndefined();
  expect(parse(stop({ conversation_id: 'c1' }), {})).toBeUndefined();
});

test('a payload survives the trip to the worker', () => {
  const got = parse(stop({ hook_event_name: 'StopFailure', error: 'overloaded' }), {});
  expect(fromJson(JSON.parse(JSON.stringify(got)))).toStrictEqual(got);
});

test('an error kind is short and never a message', () => {
  const long = parse(stop({ hook_event_name: 'StopFailure', error: 'x'.repeat(65) }), {});
  const spaced = parse(stop({ hook_event_name: 'StopFailure', error: 'API Error: 429' }), {});
  expect([long?.error, spaced?.error]).toEqual(['unknown', 'unknown']);
});
