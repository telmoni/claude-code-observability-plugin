import { appendFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { expect, test } from 'vitest';

import * as t from '../src/transcript.js';
import { IMAGE, Transcript, setup, tempDir, unpack } from './helpers.js';

function rows(transcript: Transcript): t.Row[] {
  return t.readRows(transcript.path, 0).rows;
}

test('rows come with their offsets and a partial line waits', () => {
  const path = join(tempDir(), 's.jsonl');
  const first = JSON.stringify({ type: 'user', n: 1 });
  const second = JSON.stringify({ type: 'user', n: 2 });
  writeFileSync(path, `${first}\n${second}\n{"type": "us`);
  const read = t.readRows(path, 0);
  expect(read.rows.map((row) => row.offset)).toEqual([0, first.length + 1]);
  expect(read.end).toBe(first.length + second.length + 2);
  expect(read.restarted).toBe(false);
  appendFileSync(path, 'er", "n": 3}\n');
  const later = t.readRows(path, read.end);
  expect(later.rows.map((row) => row.data.n)).toEqual([3]);
  writeFileSync(path, `${first}\n`);
  expect(t.readRows(path, later.end).restarted).toBe(true);
});

test('what counts as a prompt', () => {
  const { transcript } = setup();
  transcript.prompt();
  transcript.meta();
  transcript.companion();
  transcript.prompt('summary', { isCompactSummary: true });
  transcript.reply({ toolUses: [['tu1', 'Bash', {}]] });
  transcript.result('tu1');
  transcript.interrupt();
  transcript.notice('tu1');
  transcript.prompt('<local-command-stdout>out</local-command-stdout>');
  transcript.prompt('');
  transcript.prompt('side', { isSidechain: true });
  transcript.prompt('second');
  expect(rows(transcript).map((row) => t.isPrompt(row))).toEqual([
    true,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    true,
  ]);
});

test('an interruption has two kinds', () => {
  const { transcript } = setup();
  transcript.interrupt();
  transcript.interrupt(true);
  transcript.prompt();
  expect(rows(transcript).map((row) => t.interruption(row))).toEqual(['turn', 'tool', undefined]);
});

test('a notice names its tool call and a launch its agent', () => {
  const { transcript } = setup();
  transcript.notice('toolu_01');
  transcript.result('toolu_02', { asyncAgent: 'agent-9' });
  transcript.result('toolu_03');
  const found = rows(transcript);
  expect(t.notificationToolUseId(found[0]!)).toBe('toolu_01');
  expect(t.asyncAgent(found[1]!)).toBe('agent-9');
  expect(t.asyncAgent(found[2]!)).toBeUndefined();
});

test('usage counts the cache inside input and sums its writes', () => {
  const { transcript } = setup();
  transcript.reply({ messageId: 'a' });
  transcript.reply({
    messageId: 'b',
    usage: { input_tokens: 1, output_tokens: 2, cache_creation_input_tokens: 7 },
  });
  transcript.reply({ messageId: 'c', usage: { input_tokens: 'many' } });
  const [a, b, c] = unpack(
    rows(transcript).map((row) => t.usage(row)),
    3,
  );
  expect([a!.input, a!.output, a!.cacheRead, a!.cacheWrite]).toEqual([18, 20, 5, 3]);
  expect([b!.input, b!.cacheRead, b!.cacheWrite]).toEqual([8, undefined, 7]);
  expect([c!.input, c!.output]).toEqual([undefined, undefined]);
});

test('an api error gives its kind and never its message', () => {
  const { transcript } = setup();
  transcript.reply({ apiError: 'rate_limit' });
  transcript.reply({ messageId: 'b', apiError: 'something went wrong with the request' });
  transcript.reply({ messageId: 'c' });
  expect(rows(transcript).map((row) => t.apiError(row))).toEqual([
    'rate_limit',
    'ApiError',
    undefined,
  ]);
});

test('tool uses keep a name a skill and a subagents kind', () => {
  const { transcript } = setup();
  transcript.reply({
    toolUses: [
      ['tu1', 'Bash', { command: 'ls /secret/path' }],
      ['tu2', 'Skill', { skill: 'pr-review', args: 'x' }],
      ['tu3', 'Agent', { subagent_type: 'Explore', run_in_background: true, prompt: 'p' }],
    ],
  });
  const [row] = unpack(rows(transcript), 1);
  const uses = t.toolUses(row);
  expect(uses.map((u) => [u.name, u.skill, u.subagentType, u.background])).toEqual([
    ['Bash', undefined, undefined, false],
    ['Skill', 'pr-review', undefined, false],
    ['Agent', undefined, 'Explore', true],
  ]);
  expect(JSON.stringify(uses)).not.toContain('secret');
});

test('of a skill call the tag skills words alone are read', () => {
  const { transcript } = setup();
  transcript.reply({
    toolUses: [
      ['tu1', 'Skill', { skill: 'telmoni-observability:tag', args: 'repo=telmoni b=' }],
      ['tu2', 'Skill', { skill: 'pr-review', args: 'PROMPT-TEXT-NEVER-SENT' }],
      ['tu3', 'Skill', { skill: 'telmoni-observability:tag', args: ['repo=x'] }],
      ['tu4', 'Bash', { skill: 'telmoni-observability:tag', args: 'repo=x' }],
    ],
  });
  const [row] = unpack(rows(transcript), 1);
  expect(t.toolUses(row).map((u) => u.tags)).toEqual([
    'repo=telmoni b=',
    undefined,
    undefined,
    undefined,
  ]);
});

test('a typed tag command is read for its words and no other prompt past its head', () => {
  const { transcript } = setup();
  const name = '<command-name>/telmoni-observability:tag</command-name>';
  const message = '<command-message>telmoni-observability:tag</command-message>';
  transcript.prompt(`${name}\n${message}\n<command-args>repo=telmoni</command-args>`);
  transcript.prompt(`${message}\n${name}`);
  transcript.prompt('<command-name>/compact</command-name>\n<command-args>repo=x</command-args>');
  transcript.prompt(`PROMPT-TEXT-NEVER-SENT ${name}<command-args>repo=x</command-args>`);
  // The tag command's markers sit at a row's head: a long command is read no further.
  const longArgs = 'x'.repeat(300);
  transcript.prompt(
    `<command-name>/compact</command-name>\n<command-args>${longArgs}${name}</command-args>`,
  );
  const found = rows(transcript);
  expect(found.map((row) => t.tagCommand(row))).toEqual([
    'repo=telmoni',
    '',
    undefined,
    undefined,
    undefined,
  ]);
  expect(found.every((row) => t.isPrompt(row))).toBe(true);
  expect(found[0]!.cwd).toBe('/home/someone/secret-project');
});

test('names are plain names within ingests caps', () => {
  const { transcript } = setup();
  transcript.reply({ model: '/data/models/NAME-PATH-NEVER-SENT/qwen-30b' });
  transcript.reply({ messageId: 'b', model: '/models/NAME-PATH-NEVER-SENT/qwen3-coder.gguf' });
  transcript.reply({ messageId: 'c', model: '  anthropic/claude-opus-5-5 ' });
  transcript.reply({ messageId: 'd', model: 'm'.repeat(200) });
  transcript.reply({ messageId: 'd2', model: '/models/x\nNAME-TEXT-NEVER-SENT.gguf' });
  transcript.reply({
    messageId: 'e',
    toolUses: [
      ['tu1', 'read the file at NAME-TEXT-NEVER-SENT', {}],
      ['tu2', 'Skill', { skill: 'NAME-TEXT-NEVER-SENT and more' }],
      ['tu3', 'Agent', { subagent_type: '/data/models/NAME-PATH-NEVER-SENT' }],
      ['tu4', 'mcp__github__create_issue', {}],
      ['tu5', `mcp__${'s'.repeat(150)}__search`, {}],
    ],
  });
  const found = rows(transcript);
  expect(found.map((row) => t.model(row))).toEqual([
    'unknown',
    'qwen3-coder.gguf',
    'anthropic/claude-opus-5-5',
    'm'.repeat(128),
    'unknown',
    'claude-opus-5-5',
  ]);
  const uses = t.toolUses(found.at(-1)!);
  expect(uses.map((u) => [u.name, u.skill, u.subagentType])).toEqual([
    ['unknown', undefined, undefined],
    ['Skill', undefined, undefined],
    ['Agent', undefined, undefined],
    ['mcp__github__create_issue', undefined, undefined],
    [`mcp__${'s'.repeat(150)}`.slice(0, 145), undefined, undefined],
  ]);
});

test('subagents are found by the tool call that started them', () => {
  const { transcript } = setup();
  transcript.subagent('tu1', { agentId: 'one', agentType: 'Explore', finished: true });
  transcript.subagent('tu2', { agentId: 'two', agentType: 'Plan', finished: null });
  const folder = t.subagentsDir(transcript.path);
  writeFileSync(join(folder, 'agent-orphan.meta.json'), '{"agentType": "X"}');
  writeFileSync(join(folder, 'agent-gone.meta.json'), '{"toolUseId": "tu9"}');
  const found = t.discoverSubagents(transcript.path);
  expect([...found.keys()].sort()).toEqual(['tu1', 'tu2']);
  expect([found.get('tu1')!.agentType, found.get('tu1')!.finished]).toEqual(['Explore', true]);
  expect(found.get('tu2')!.finished).toBeUndefined();
  const elsewhere = new Transcript(join(dirname(transcript.path), 'x.jsonl'), 'x');
  expect(t.discoverSubagents(elsewhere.path)).toEqual(new Map());
});

test('an image alone is a prompt', () => {
  const { transcript } = setup();
  transcript.imagePrompt();
  transcript.imagePrompt({ withOrigin: false });
  transcript.imagePrompt({ withOrigin: false, caption: true });
  expect(rows(transcript).map((row) => t.isPrompt(row))).toEqual([true, true, true]);
});

test('a prompt says its text and its images by their bytes', () => {
  const { transcript } = setup();
  transcript.prompt();
  transcript.imagePrompt({ caption: true });
  const linked = { type: 'image', source: { type: 'url', url: 'https://example.com/a.png' } };
  transcript.row('user', { role: 'user', content: [linked, { type: 'text', text: ' ' }] });
  const [plain, pictured, other] = unpack(rows(transcript), 3);
  expect(t.promptParts(plain)).toEqual([{ type: 'text', content: 'PROMPT-TEXT-NEVER-SENT' }]);
  expect(t.promptParts(pictured)).toEqual([
    { type: 'blob', modality: 'image', content: IMAGE, mime_type: 'image/png' },
    { type: 'text', content: 'PROMPT-TEXT-NEVER-SENT' },
  ]);
  expect(t.promptParts(other)).toEqual([]);
});

test('a reply says its plain thinking text and tool calls never a redacted block', () => {
  const { transcript } = setup();
  transcript.reply({
    thinking: 'THINKING-NEVER-SENT',
    redacted: 'REDACTED-THINKING-NEVER-SENT',
    toolUses: [['tu1', 'Bash', { command: 'ls' }]],
  });
  // Thinking a model keeps to itself comes as an empty block beside its signature.
  transcript.reply({ messageId: 'b', thinking: '', text: '' });
  const [said, empty] = unpack(rows(transcript), 2);
  expect(t.replyParts(said)).toEqual([
    { type: 'reasoning', content: 'THINKING-NEVER-SENT' },
    { type: 'text', content: 'REPLY-TEXT-NEVER-SENT' },
    { type: 'tool_call', id: 'tu1', name: 'Bash', arguments: { command: 'ls' } },
  ]);
  expect(t.replyParts(empty)).toEqual([]);
});

test('a tool result says its output as recorded never claude codes own record', () => {
  const { transcript } = setup();
  transcript.result('tu1');
  const blocks = [{ type: 'text', text: 'TOOL-OUTPUT-NEVER-SENT' }];
  const result = { type: 'tool_result', tool_use_id: 'tu2', content: blocks };
  const own = { file: { filePath: '/secret/path', content: 'x' } };
  transcript.row('user', { role: 'user', content: [result] }, { toolUseResult: own });
  const [plain, listed] = unpack(rows(transcript), 2);
  expect(t.toolOutputs(plain)).toEqual(new Map([['tu1', 'TOOL-OUTPUT-NEVER-SENT']]));
  expect(t.toolOutputs(listed)).toEqual(new Map([['tu2', blocks]]));
});

test('a compactions summary is known by its flag and says its text alone', () => {
  const { transcript } = setup();
  transcript.compaction();
  transcript.prompt('x', { isCompactSummary: 'yes' });
  transcript.prompt();
  const source = { type: 'base64', media_type: 'image/png', data: IMAGE };
  const blocks = [
    { type: 'text', text: 'COMPACT-SUMMARY-NEVER-SENT' },
    { type: 'image', source },
  ];
  transcript.row('user', { role: 'user', content: blocks }, { isCompactSummary: true });
  const found = rows(transcript);
  expect(found.map((row) => t.isCompactSummary(row))).toEqual([false, true, false, false, true]);
  const summary = [{ type: 'text', content: 'COMPACT-SUMMARY-NEVER-SENT' }];
  expect(t.summaryParts(found[1]!)).toEqual(summary);
  expect(t.summaryParts(found[4]!)).toEqual(summary);
});

test('a subagents task is the prompt its call gave it', () => {
  expect(t.subagentTask({ subagent_type: 'Explore', prompt: 'find it' })).toBe('find it');
  expect(t.subagentTask({ prompt: ' ' })).toBeUndefined();
  expect(t.subagentTask(undefined)).toBeUndefined();
});
