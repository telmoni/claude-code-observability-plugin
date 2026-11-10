import { expect, test } from 'vitest';

import * as record from '../src/record.js';
import * as t from '../src/transcript.js';
import * as turns from '../src/turns.js';
import {
  IMAGE,
  type Json,
  type Transcript,
  type Use,
  assertMetadataOnly,
  setup,
  toolResponse,
  unpack,
} from './helpers.js';

function build(transcript: Transcript, { content = false } = {}): record.PlainTrace[] {
  const read = t.readRows(transcript.path, 0);
  const found = turns.assemble(read.rows, transcript.sessionId, read.end, content);
  const subagents = t.discoverSubagents(transcript.path);
  return found.map((turn) =>
    record.build(turn, {
      sessionId: transcript.sessionId,
      event: 'Stop',
      subagents,
      read: (known) => t.readRows(known.path, 0).rows,
    }),
  );
}

/** A trace's or a step's calls, each read as the plain values the state file keeps. */
function calls(of: object): Json[] {
  return (of as Json).calls as Json[];
}

function keys(of: object): Set<string> {
  return new Set(Object.keys(of));
}

function said(role: string, ...parts: Json[]): Json[] {
  return [{ role, parts }];
}

test("a trace id is the same each time, the session's own, and 32 hex digits", () => {
  expect(record.traceId('s', 'u')).toBe(record.traceId('s', 'u'));
  expect(record.traceId('s', 'u')).not.toBe(record.traceId('s2', 'u'));
  expect(record.traceId('s', 'u')).not.toBe(record.traceId('s', 'u2'));
  expect(record.traceId('s', 'u')).toMatch(/^[0-9a-f]{32}$/);
});

test('a turn becomes a trace with its calls in order', () => {
  const { transcript } = setup();
  transcript.prompt();
  transcript.reply({
    toolUses: [
      ['tu1', 'Skill', { skill: 'pr-review' }],
      ['tu2', 'Bash', { command: 'x' }],
    ],
  });
  transcript.result('tu1');
  transcript.result('tu2', { isError: true });
  transcript.reply({ messageId: 'msg_2' });
  const [made] = unpack(build(transcript), 1);
  expect(made.agent).toBe('claude-code');
  expect(made.session_id).toBe('session-one');
  expect(made.release).toBe('2.1.310');
  expect(made.tags).toEqual({ skills: 'pr-review' });
  expect(calls(made).map((c) => c.kind)).toEqual(['model', 'tool', 'tool', 'model']);
  expect(
    calls(made)
      .map((c) => c.name)
      .slice(1, 3),
  ).toEqual(['Skill', 'Bash']);
  expect(calls(made)[2]!.error_type).toBe('ToolError');
  expect(calls(made)[0]!.usage).toEqual({
    input: 18,
    output: 20,
    cache_read: 5,
    cache_write: 3,
  });
  expect([made.error_type, made.cancelled]).toEqual([null, false]);
  assertMetadataOnly(JSON.stringify(made));
});

test('a call never answered is cancelled with the turn', () => {
  const { transcript } = setup();
  transcript.prompt();
  transcript.reply({ toolUses: [['tu1', 'Bash', {}]] });
  transcript.interrupt();
  const [made] = unpack(build(transcript), 1);
  expect(made.cancelled).toBe(true);
  expect(calls(made)[1]!.cancelled).toBe(true);
  expect(calls(made)[1]!.end).toBe(made.end);
});

test('a subagent is a step holding its own calls', () => {
  const { transcript } = setup();
  transcript.prompt();
  transcript.reply({
    toolUses: [
      ['tu1', 'Agent', { subagent_type: 'Explore', prompt: 'SUBAGENT-PROMPT-NEVER-SENT' }],
    ],
  });
  transcript.subagent('tu1', { replies: 2 });
  transcript.result('tu1');
  transcript.reply({ messageId: 'msg_2' });
  const [made] = unpack(build(transcript), 1);
  const step = calls(made)[1]!;
  expect([step.kind, step.name]).toEqual(['step', 'subagent Explore']);
  expect(calls(step).map((c) => c.kind)).toEqual(['model', 'tool', 'model']);
  expect(calls(made).map((c) => c.kind)).toEqual(['model', 'step', 'model']);
  assertMetadataOnly(JSON.stringify(made));
});

test('the skills tag is cut at a name', () => {
  const { transcript } = setup();
  transcript.prompt();
  const uses = Array.from({ length: 40 }, (_, i): Use => [
    `tu${i}`,
    'Skill',
    { skill: `skill-number-${String(i).padStart(2, '0')}` },
  ]);
  transcript.reply({ toolUses: uses });
  const [made] = unpack(build(transcript), 1);
  const tag = made.tags.skills!;
  expect(tag.length).toBeLessThanOrEqual(record.TAG_MAX);
  expect(
    tag.split(',').every((name) => name.startsWith('skill-number-') && name.length === 15),
  ).toBe(true);
});

test('with content on a trace holds the conversation as claude code recorded it', () => {
  const { transcript } = setup();
  transcript.conversation();
  const [made] = unpack(build(transcript, { content: true }), 1);
  const image = { type: 'blob', modality: 'image', content: IMAGE, mime_type: 'image/png' };
  const prompt = { type: 'text', content: 'PROMPT-TEXT-NEVER-SENT' };
  const reply = { type: 'text', content: 'REPLY-TEXT-NEVER-SENT' };
  expect(made.input_messages).toEqual(said('user', image, prompt));
  const [first, bash, , step, last] = unpack(calls(made), 5);
  const bashCall = { type: 'tool_call', id: 'tu1', name: 'Bash' };
  expect(first.output_messages).toEqual(
    said('assistant', { type: 'reasoning', content: 'THINKING-NEVER-SENT' }, reply, {
      ...bashCall,
      arguments: { command: 'cat /secret/path' },
    }),
  );
  expect(bash.arguments).toEqual({ command: 'cat /secret/path' });
  expect(bash.result).toBe('TOOL-OUTPUT-NEVER-SENT');
  const task = { type: 'text', content: 'SUBAGENT-PROMPT-NEVER-SENT' };
  expect(step.input_messages).toEqual(said('user', task));
  const answer = { type: 'text', content: 'SUBAGENT-REPLY-NEVER-SENT' };
  expect(step.output_messages).toEqual(said('assistant', answer));
  expect(made.output_messages).toEqual(said('assistant', reply));
  expect(last.output_messages).toEqual(said('assistant', reply));
  const kept = JSON.stringify(made);
  expect(kept).not.toContain('REDACTED-THINKING-NEVER-SENT');
  expect(kept).not.toContain('/home/someone/secret-project');
  expect(kept).not.toContain(transcript.path);
});

test('with content off a trace holds what it always held', () => {
  const { transcript } = setup();
  transcript.conversation();
  const [made] = unpack(build(transcript), 1);
  const trace = [
    'trace_id',
    'agent',
    'start',
    'end',
    'session_id',
    'release',
    'tags',
    'error_type',
  ];
  expect(keys(made)).toEqual(new Set([...trace, 'cancelled', 'calls']));
  const [first, bash, second, step, last] = unpack(calls(made), 5);
  const timed = ['kind', 'start', 'end', 'error_type', 'cancelled'];
  for (const model of [first, second, last]) {
    expect(keys(model)).toEqual(new Set([...timed, 'model', 'provider', 'usage']));
  }
  expect(keys(bash)).toEqual(new Set([...timed, 'name']));
  expect(keys(step)).toEqual(new Set([...timed, 'name', 'calls']));
  assertMetadataOnly(JSON.stringify(made));
});

test('a subagents own subagent is a step inside its step and a compaction one of its own', () => {
  const { transcript } = setup();
  transcript.longTurn();
  const [made] = unpack(build(transcript), 1);
  const [first, , compaction, second, step, last] = unpack(calls(made), 6);
  const timed = ['kind', 'start', 'end', 'error_type', 'cancelled'];
  expect(keys(compaction)).toEqual(new Set([...timed, 'name']));
  expect([compaction.kind, compaction.name]).toEqual(['step', 'compaction']);
  expect([compaction.error_type, compaction.cancelled]).toEqual([null, false]);
  expect(step.name).toBe('subagent Explore');
  expect(calls(step).map((c) => c.name)).toEqual([undefined, 'subagent Plan', undefined]);
  const inner = calls(step)[1]!;
  expect(keys(inner)).toEqual(new Set([...timed, 'name', 'calls']));
  expect(keys(step)).toEqual(new Set([...timed, 'name', 'calls']));
  expect(calls(inner).map((c) => c.kind)).toEqual(['model']);
  for (const model of [first, second, last]) {
    expect(keys(model)).toEqual(new Set([...timed, 'model', 'provider', 'usage']));
  }
  assertMetadataOnly(JSON.stringify(made));
});

test('subagents nest as deep as the sdk takes a step and past it go as their call', () => {
  const { transcript } = setup();
  transcript.prompt();
  transcript.reply({ toolUses: [['tu1', 'Agent', { subagent_type: 'Explore' }]] });
  transcript.nested('tu1', record.STEP_DEPTH_MAX + 1);
  transcript.result('tu1');
  transcript.reply({ messageId: 'msg_2' });
  const [made] = unpack(build(transcript), 1);
  let node = calls(made)[1]!;
  let steps = 0;
  while (node.kind === 'step') {
    steps += 1;
    node = calls(node)[1]!;
  }
  expect(steps).toBe(record.STEP_DEPTH_MAX);
  expect([node.kind, node.name]).toEqual(['tool', 'Agent']);
});

test('a subagent whose transcript names its own call is expanded once', () => {
  const { transcript } = setup();
  transcript.prompt();
  transcript.reply({ toolUses: [['tu1', 'Agent', { subagent_type: 'Explore' }]] });
  const sub = transcript.subagent('tu1', { replies: 0 });
  sub.reply({ messageId: 'abc-m0', toolUses: [['tu1', 'Agent', { subagent_type: 'Explore' }]] });
  sub.result('tu1');
  sub.reply({ messageId: 'abc-m1' });
  transcript.clock = sub.clock;
  transcript.result('tu1');
  transcript.reply({ messageId: 'msg_2' });
  const [made] = unpack(build(transcript), 1);
  const step = calls(made)[1]!;
  expect(calls(step).map((c) => c.kind)).toEqual(['model', 'tool', 'model']);
});

test('with content on each model call carries what it was given', () => {
  const { transcript } = setup();
  transcript.longTurn();
  const [made] = unpack(build(transcript, { content: true }), 1);
  const [first, , compaction, second, step, last] = unpack(calls(made), 6);
  const image = { type: 'blob', modality: 'image', content: IMAGE, mime_type: 'image/png' };
  const prompt = { type: 'text', content: 'PROMPT-TEXT-NEVER-SENT' };
  expect(first.input_messages).toEqual(said('user', image, prompt));
  expect(made.input_messages).toEqual(said('user', image, prompt));
  expect(second.input_messages).toEqual(said('tool', toolResponse('tu1')));
  expect(last.input_messages).toEqual(said('tool', toolResponse('tu2')));
  const summary = { type: 'text', content: 'COMPACT-SUMMARY-NEVER-SENT' };
  expect(compaction.output_messages).toEqual(said('assistant', summary));
  expect(compaction).not.toHaveProperty('input_messages');
  const [launch, inner, answer] = unpack(calls(step), 3);
  const task = { type: 'text', content: 'SUBAGENT-PROMPT-NEVER-SENT' };
  expect(launch.input_messages).toEqual(said('user', task));
  expect(step.input_messages).toEqual(said('user', task));
  expect(answer.input_messages).toEqual(said('tool', toolResponse('tu2-in')));
  const reply = { type: 'text', content: 'SUBAGENT-REPLY-NEVER-SENT at 1' };
  expect(step.output_messages).toEqual(said('assistant', reply));
  const asked = { type: 'text', content: 'SUBAGENT-PROMPT-NEVER-SENT at 2' };
  expect(inner.input_messages).toEqual(said('user', asked));
  expect(calls(inner)[0]!.input_messages).toEqual(said('user', asked));
  const answered = { type: 'text', content: 'SUBAGENT-REPLY-NEVER-SENT at 2' };
  expect(inner.output_messages).toEqual(said('assistant', answered));
});

test('a compaction no model call follows leaves its turn as it was', () => {
  const { transcript } = setup();
  transcript.prompt();
  transcript.reply();
  const before = build(transcript, { content: true });
  transcript.compaction();
  expect(build(transcript, { content: true })).toEqual(before);
});

test('the same turn built twice is the same record', () => {
  const { transcript } = setup();
  transcript.longTurn();
  expect(build(transcript, { content: true })).toEqual(build(transcript, { content: true }));
  expect(build(transcript)).toEqual(build(transcript));
});
