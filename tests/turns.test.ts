import { expect, test } from 'vitest';

import * as t from '../src/transcript.js';
import * as turns from '../src/turns.js';
import { T0, type Transcript, setup, toolResponse, unpack } from './helpers.js';

function build(transcript: Transcript): [turns.Turn[], t.Read] {
  const read = t.readRows(transcript.path, 0);
  return [turns.assemble(read.rows, transcript.sessionId, read.end), read];
}

function at(seconds: number): Date {
  return new Date(T0.getTime() + seconds * 1000);
}

test('a prompt closes the turn before it and the last stays open', () => {
  const { transcript } = setup();
  transcript.prompt();
  transcript.reply();
  const second = transcript.prompt();
  transcript.reply({ messageId: 'msg_2' });
  const [found, read] = build(transcript);
  expect(found.map((turn) => turn.open)).toEqual([false, true]);
  expect(found[0]!.nextOffset).toBe(read.rows[2]!.offset);
  expect(found[1]!.nextOffset).toBe(read.end);
  expect(found[1]!.promptUuid).toBe(second.uuid);
});

test('a model call runs from the event before it', () => {
  const { transcript } = setup();
  transcript.prompt(); // t=1
  transcript.reply({ toolUses: [['tu1', 'Bash', {}]] }); // t=2
  transcript.result('tu1'); // t=3
  transcript.reply({ messageId: 'msg_2' }); // t=4
  const [turn] = unpack(build(transcript)[0], 1);
  const [first, second] = unpack(turn.modelCalls, 2);
  expect([first.start, first.end]).toEqual([at(1), at(2)]);
  expect([second.start, second.end]).toEqual([at(3), at(4)]);
  const [tool] = unpack(turn.toolCalls, 1);
  expect([tool.start, tool.end]).toEqual([at(2), at(3)]);
  expect(turn.end).toEqual(at(4));
});

test('the rows of one reply are one call', () => {
  const { transcript } = setup();
  transcript.prompt();
  transcript.reply({ messageId: 'same' });
  transcript.reply({ messageId: 'same', usage: { input_tokens: 1, output_tokens: 40 } });
  const [turn] = unpack(build(transcript)[0], 1);
  const [call] = unpack(turn.modelCalls, 1);
  expect(call.usage!.output).toBe(40);
  expect(call.end).toEqual(at(3));
});

test('a tools outcome', () => {
  const { transcript } = setup();
  transcript.prompt();
  transcript.reply({
    toolUses: [
      ['ok', 'Read', {}],
      ['bad', 'Bash', {}],
      ['stopped', 'Bash', {}],
      ['never', 'Bash', {}],
    ],
  });
  transcript.result('ok');
  transcript.result('bad', { isError: true });
  transcript.result('stopped', { interrupted: true });
  const [turn] = unpack(build(transcript)[0], 1);
  const byName = new Map(turn.toolCalls.map((tool) => [tool.toolUseId, tool]));
  const ok = byName.get('ok')!;
  const bad = byName.get('bad')!;
  const stopped = byName.get('stopped')!;
  expect([ok.errorType, ok.cancelled]).toEqual([undefined, false]);
  expect([bad.errorType, bad.cancelled]).toEqual(['ToolError', false]);
  expect([stopped.errorType, stopped.cancelled]).toEqual([undefined, true]);
  expect(byName.get('never')!.end).toBeUndefined();
});

test('an interruption cancels the turn unless a reply follows', () => {
  const { transcript } = setup();
  transcript.prompt();
  transcript.reply({ toolUses: [['tu1', 'Bash', {}]] });
  transcript.result('tu1', { interrupted: true });
  transcript.interrupt(true);
  transcript.reply({ messageId: 'msg_2' });
  transcript.prompt();
  transcript.reply({ messageId: 'msg_3' });
  transcript.interrupt();
  const [wentOn, stopped] = unpack(build(transcript)[0], 2);
  expect(wentOn.endedByInterruption).toBe(false);
  expect(stopped.endedByInterruption).toBe(true);
  expect(stopped.end).toEqual(at(8));
});

test('a background subagent keeps the turn waiting', () => {
  const { transcript } = setup();
  transcript.prompt();
  transcript.reply({
    toolUses: [['tu1', 'Agent', { subagent_type: 'Explore', run_in_background: true }]],
  });
  transcript.result('tu1', { asyncAgent: 'abc' });
  let [turn] = unpack(build(transcript)[0], 1);
  expect(turns.isComplete(turn, 'Stop', false, new Map())).toBe(false);
  expect(turns.isComplete(turn, 'SessionEnd', false, new Map())).toBe(true);
  transcript.notice('tu1');
  [turn] = unpack(build(transcript)[0], 1);
  expect(turns.isComplete(turn, 'Stop', false, new Map())).toBe(false);
  transcript.reply({ messageId: 'msg_2' });
  transcript.handback('abc');
  [turn] = unpack(build(transcript)[0], 1);
  expect(turns.isComplete(turn, 'Stop', false, new Map())).toBe(true);
  expect(turns.isComplete(turn, 'Stop', true, new Map())).toBe(false);
  const stillRunning = new Map<string, t.Subagent>([
    ['tu1', { toolUseId: 'tu1', agentType: 'Explore', finished: false, path: transcript.path }],
  ]);
  expect(turns.isComplete(turn, 'Stop', false, stillRunning)).toBe(false);
  transcript.prompt();
  const [closed] = unpack(build(transcript)[0], 2);
  expect(turns.isComplete(closed, 'Stop', true, new Map())).toBe(true);
});

test('a report handed back and replied to closes the turn before its notice', () => {
  const { transcript } = setup();
  transcript.prompt();
  transcript.reply({
    toolUses: [['tu1', 'Agent', { subagent_type: 'Explore', run_in_background: true }]],
  });
  transcript.result('tu1', { asyncAgent: 'abc' });
  transcript.handback('someone-else');
  transcript.reply({ messageId: 'msg_2' });
  let [turn] = unpack(build(transcript)[0], 1);
  expect(turns.isComplete(turn, 'Stop', false, new Map())).toBe(false);
  transcript.handback('abc');
  transcript.reply({ messageId: 'msg_3' });
  [turn] = unpack(build(transcript)[0], 1);
  expect(turns.isComplete(turn, 'Stop', false, new Map())).toBe(true);
  transcript.notice('tu1');
  [turn] = unpack(build(transcript)[0], 1);
  expect(turns.isComplete(turn, 'Stop', false, new Map())).toBe(true);
});

test('what ended a turn in error', () => {
  const { transcript } = setup();
  transcript.prompt();
  transcript.reply({ apiError: 'rate_limit' });
  transcript.prompt();
  transcript.reply({ messageId: 'msg_2' });
  const [failed, fine] = unpack(build(transcript)[0], 2);
  expect(turns.errorType(failed, 'StopFailure', 'overloaded')).toBe('rate_limit');
  expect(turns.errorType(fine, 'StopFailure', 'overloaded')).toBe('overloaded');
  expect(turns.errorType(fine, 'Stop', undefined)).toBeUndefined();
  expect(turns.errorType(failed, 'Stop', undefined)).toBe('rate_limit');
  failed.open = false;
  const empty = new turns.Turn(0, '', at(0), at(0));
  expect(turns.errorType(empty, 'StopFailure', undefined)).toBe('unknown');
});

test('rows copied from another session are passed over', () => {
  const { transcript } = setup();
  transcript.otherSession();
  transcript.otherSession();
  transcript.prompt();
  transcript.reply();
  const [found] = build(transcript);
  expect(found).toHaveLength(1);
});

test('a subagents transcript is one span of work', () => {
  const { transcript } = setup();
  const sub = transcript.subagent('tu1', { replies: 2 });
  const { models, tools, ended } = turns.collect(t.readRows(sub.path, 0).rows);
  expect(models).toHaveLength(2);
  expect(tools).toHaveLength(1);
  expect(ended).toEqual(sub.clock);
});

test('a notice landing in a later turn marks its tool call', () => {
  const { transcript } = setup();
  transcript.prompt();
  transcript.reply({
    toolUses: [['tu1', 'Agent', { subagent_type: 'Explore', run_in_background: true }]],
  });
  transcript.result('tu1', { asyncAgent: 'abc' });
  transcript.prompt();
  transcript.reply({ messageId: 'msg_2' });
  let [first, second] = unpack(build(transcript)[0], 2);
  expect(turns.isComplete(first, 'Stop', false, new Map())).toBe(false);
  transcript.notice('tu1');
  [first, second] = unpack(build(transcript)[0], 2);
  expect(turns.isComplete(first, 'Stop', false, new Map())).toBe(false);
  transcript.reply({ messageId: 'msg_3' });
  [first, second] = unpack(build(transcript)[0], 2);
  expect(turns.isComplete(first, 'Stop', false, new Map())).toBe(true);
  expect(turns.isComplete(second, 'Stop', false, new Map())).toBe(true);
});

test('a refused tool is cancelled and the turn with it', () => {
  const { transcript } = setup();
  transcript.prompt();
  transcript.reply({ toolUses: [['tu1', 'Bash', {}]] });
  transcript.denied('tu1');
  const [turn] = unpack(build(transcript)[0], 1);
  const [tool] = unpack(turn.toolCalls, 1);
  expect([tool.cancelled, tool.errorType]).toEqual([true, undefined]);
  expect(turn.endedByInterruption).toBe(true);
});

test('with content on the rows of one reply say one message', () => {
  const { transcript } = setup();
  transcript.prompt();
  // Claude Code writes a reply's blocks a row each, under the one message id.
  transcript.reply({ messageId: 'same', thinking: 'THINKING-NEVER-SENT' });
  transcript.reply({ messageId: 'same', toolUses: [['tu1', 'Bash', { command: 'ls' }]] });
  transcript.result('tu1');
  const read = t.readRows(transcript.path, 0);
  const [turn] = unpack(turns.assemble(read.rows, transcript.sessionId, read.end, true), 1);
  const [call] = unpack(turn.modelCalls, 1);
  expect(call.output!.map((part) => part.type)).toEqual(['reasoning', 'text', 'text', 'tool_call']);
  const [tool] = unpack(turn.toolCalls, 1);
  expect([tool.arguments, tool.result]).toEqual([{ command: 'ls' }, 'TOOL-OUTPUT-NEVER-SENT']);
  expect(turn.prompt).toEqual([{ type: 'text', content: 'PROMPT-TEXT-NEVER-SENT' }]);
  const [off] = unpack(build(transcript)[0], 1);
  expect(off.prompt).toBeUndefined();
  expect(off.modelCalls[0]!.output).toBeUndefined();
  expect([off.toolCalls[0]!.arguments, off.toolCalls[0]!.result]).toEqual([undefined, undefined]);
});

test('with content on each model call is given the prompt or the tool results since the last', () => {
  const { transcript } = setup();
  transcript.prompt();
  transcript.reply({
    toolUses: [
      ['tu1', 'Bash', {}],
      ['tu2', 'Read', {}],
    ],
  });
  transcript.result('tu1');
  transcript.result('tu2');
  transcript.reply({ messageId: 'msg_2', toolUses: [['tu3', 'Bash', {}]] });
  transcript.result('tu3');
  transcript.compaction();
  transcript.reply({ messageId: 'msg_3' });
  const read = t.readRows(transcript.path, 0);
  const [turn] = unpack(turns.assemble(read.rows, transcript.sessionId, read.end, true), 1);
  const prompt = { type: 'text', content: 'PROMPT-TEXT-NEVER-SENT' };
  expect(turn.modelCalls.map((call) => call.input)).toEqual([
    [{ role: 'user', parts: [prompt] }],
    [{ role: 'tool', parts: [toolResponse('tu1'), toolResponse('tu2')] }],
    [{ role: 'tool', parts: [toolResponse('tu3')] }],
  ]);
  const [compaction] = unpack(turn.compactions, 1);
  expect(compaction.summary).toEqual([{ type: 'text', content: 'COMPACT-SUMMARY-NEVER-SENT' }]);
  const [off] = unpack(build(transcript)[0], 1);
  expect(off.modelCalls.map((call) => call.input)).toEqual([undefined, undefined, undefined]);
  expect(off.compactions[0]!.summary).toBeUndefined();
});

test('the first call of work a blocking stop hook carries on is given nothing', () => {
  const { transcript } = setup();
  transcript.prompt();
  transcript.reply();
  transcript.stopBlocked();
  transcript.reply({ messageId: 'msg_2' });
  const read = t.readRows(transcript.path, 0);
  const [first, carried] = unpack(
    turns.assemble(read.rows, transcript.sessionId, read.end, true),
    2,
  );
  expect(first.modelCalls[0]!.input).toBeDefined();
  expect(carried.modelCalls[0]!.input).toBeUndefined();
});

test('a subagents first call is given its task', () => {
  const { transcript } = setup();
  const sub = transcript.subagent('tu1', { replies: 2 });
  const task = [{ type: 'text', content: 'SUBAGENT-PROMPT-NEVER-SENT' }];
  const { models } = turns.collect(t.readRows(sub.path, 0).rows, true, task);
  expect(models.map((call) => call.input)).toEqual([
    [{ role: 'user', parts: task }],
    [{ role: 'tool', parts: [toolResponse('tu1-sub-0')] }],
  ]);
});

test('a compaction is a step once a model call follows it and moves no end', () => {
  const { transcript } = setup();
  transcript.prompt(); // t=1
  transcript.reply({ toolUses: [['tu1', 'Bash', {}]] }); // t=2
  transcript.result('tu1'); // t=3
  transcript.compaction(); // its summary at t=3.6
  let [turn] = unpack(build(transcript)[0], 1);
  expect(turn.compactions).toEqual([]);
  expect(turn.end).toEqual(at(3));
  transcript.reply({ messageId: 'msg_2' }); // t=4.6
  [turn] = unpack(build(transcript)[0], 1);
  const [compaction] = unpack(turn.compactions, 1);
  expect([compaction.start, compaction.end]).toEqual([at(3), at(3.6)]);
  expect(turn.modelCalls[1]!.start).toEqual(at(3.6));
  expect(turn.end).toEqual(at(4.6));
});
