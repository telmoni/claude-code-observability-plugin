/** The hook end to end, the SDK included, against a Telmoni that answers as told. */

import { type ChildProcess, spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { once } from 'node:events';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  utimesSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';

import { QueueFullError, Telmoni } from 'telmoni';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import { STEP_DEPTH_MAX, traceId } from '../src/record.js';
import { Sender } from '../src/send.js';
import { destination } from '../src/settings.js';
import { Lock, limits } from '../src/state.js';
import { waits } from '../src/worker.js';
import {
  ENDPOINT,
  IMAGE_BYTES,
  KEY,
  type Json,
  type Span,
  Transcript,
  type Use,
  assertMetadataOnly,
  setup,
  tempDir,
  toolResponse,
} from './helpers.js';

// Each client the plugin makes, as the SDK was handed it, and each flush's timeout.
const sdk = vi.hoisted(() => ({ configs: [] as Json[], flushes: [] as number[] }));

vi.mock('telmoni', async (importOriginal) => {
  const real = await importOriginal<typeof import('telmoni')>();
  class Telmoni extends real.Telmoni {
    constructor(...given: ConstructorParameters<typeof real.Telmoni>) {
      super(...given);
      sdk.configs.push({ ...given[0] });
    }

    override flush(timeoutSeconds?: number): Promise<boolean> {
      sdk.flushes.push(timeoutSeconds ?? 30);
      return super.flush(timeoutSeconds);
    }
  }
  return { ...real, Telmoni };
});

beforeEach(() => {
  sdk.configs.length = 0;
  sdk.flushes.length = 0;
});

afterEach(() => {
  vi.restoreAllMocks();
});

type State = {
  offset: number;
  sent: string[];
  pending: Array<Json & { trace_id: string; calls: Json[] }>;
  tags: Json;
};

function stateOf(hook: ReturnType<typeof setup>['hook'], session = 'session-one'): State {
  return hook.state(session) as unknown as State;
}

function traceIds(spans: Span[]): unknown[] {
  return spans.map((span) => span.traceId);
}

function sizeOf(path: string): number {
  return statSync(path).size;
}

test('a turn is sent as a trace', async () => {
  const { hook, transcript } = setup();
  transcript.prompt();
  transcript.reply({ toolUses: [['tu1', 'Bash', { command: 'cat /secret/path' }]] });
  transcript.result('tu1');
  transcript.reply({ messageId: 'msg_2' });
  expect(await hook.run(transcript)).toBe(0);
  const agents = hook.server.agents();
  expect(agents).toHaveLength(1);
  expect(agents[0]!.attrs['gen_ai.conversation.id']).toBe('session-one');
  expect(agents[0]!.resource['service.version']).toBe('2.1.310');
  const models = hook.server.models();
  expect(models).toHaveLength(2);
  expect(models[0]!.attrs['gen_ai.usage.input_tokens']).toBe(18);
  expect(models[0]!.attrs['gen_ai.usage.cache_read.input_tokens']).toBe(5);
  expect(models[0]!.attrs['gen_ai.usage.cache_write.input_tokens']).toBe(3);
  const tools = hook.server.byAttr('gen_ai.tool.name', 'Bash');
  expect(tools).toHaveLength(1);
  expect(tools[0]!.attrs).not.toHaveProperty(['error.type']);
  expect(stateOf(hook).offset).toBe(sizeOf(transcript.path));
  expect(hook.log()).toContain('sent');
  assertMetadataOnly(...hook.server.bodies, hook.kept());
});

test('names a model wrote leave as plain names and a long one loses nothing', async () => {
  const { hook, transcript } = setup();
  transcript.prompt();
  transcript.reply({
    model: '/data/models/NAME-PATH-NEVER-SENT/qwen-30b',
    toolUses: [
      ['tu1', 'run NAME-TEXT-NEVER-SENT now', {}],
      ['tu2', 'Skill', { skill: 'NAME-TEXT-NEVER-SENT /secret/path' }],
      ['tu3', 'Task', { subagent_type: 'NAME-TEXT-NEVER-SENT kind' }],
    ],
  });
  transcript.result('tu1');
  transcript.result('tu2');
  transcript.subagent('tu3', { agentType: 'NAME-TEXT-NEVER-SENT kind' });
  transcript.result('tu3');
  transcript.reply({ messageId: 'msg_2', model: 'x'.repeat(300) });
  expect(await hook.run(transcript)).toBe(0);
  const agents = hook.server.agents();
  expect(agents).toHaveLength(1);
  expect(JSON.stringify(agents[0]!.attrs)).not.toContain('skills');
  const models = hook.server.models().map((span) => span.attrs['gen_ai.request.model']);
  expect(models).toContain('unknown');
  expect(models).toContain('x'.repeat(128));
  expect(hook.server.byAttr('gen_ai.tool.name', 'unknown').length).toBeGreaterThan(0);
  expect(hook.log()).not.toContain('refused');
  assertMetadataOnly(...hook.server.bodies, hook.kept(), hook.log());
});

test('the provider is the cloud claude code is set to', async () => {
  const { tmp, hook, transcript } = setup();
  transcript.prompt();
  transcript.reply();
  await hook.run(transcript, { env: { CLAUDE_CODE_USE_BEDROCK: '1' } });
  const other = new Transcript(join(tmp, 'projects', 'p', 'session-two.jsonl'), 'session-two');
  other.prompt();
  other.reply();
  await hook.run(other);
  const providers = hook.server.models().map((span) => span.attrs['gen_ai.provider.name']);
  expect(providers).toEqual(['aws.bedrock', 'anthropic']);
});

test("a trace kept without a provider goes as anthropic's", async () => {
  const { hook, transcript } = setup();
  transcript.prompt();
  transcript.reply();
  hook.server.answers = [503, 503, 503];
  await hook.run(transcript, { env: { CLAUDE_CODE_USE_VERTEX: 'true' } });
  const path = join(hook.stateDir, 'session-one.json');
  const kept = JSON.parse(readFileSync(path, 'utf8')) as State;
  expect(kept.pending[0]!.calls[0]!.provider).toBe('gcp.vertex_ai');
  delete kept.pending[0]!.calls[0]!.provider;
  writeFileSync(path, JSON.stringify(kept));
  await hook.run(transcript);
  const models = hook.server.models();
  expect(models).toHaveLength(1);
  expect(models[0]!.attrs['gen_ai.provider.name']).toBe('anthropic');
});

const TAG_SKILL = 'telmoni-observability:tag';

function asked(toolUseId: string, words: string): Use {
  return [toolUseId, 'Skill', { skill: TAG_SKILL, args: words }];
}

function typed(words: string): string {
  return (
    `<command-name>/${TAG_SKILL}</command-name>\n` +
    `<command-message>${TAG_SKILL}</command-message>\n<command-args>${words}</command-args>`
  );
}

function tagsOf(agent: Span): Json {
  const prefix = 'telmoni.tag.';
  return Object.fromEntries(
    Object.entries(agent.attrs)
      .filter(([key]) => key.startsWith(prefix))
      .map(([key, value]) => [key.slice(prefix.length), value]),
  );
}

test('a tag asked for mid session goes on that turn and every later one until cleared', async () => {
  const { hook, transcript } = setup();
  transcript.prompt();
  transcript.reply();
  await hook.run(transcript);
  transcript.prompt();
  transcript.reply({ toolUses: [asked('tu1', 'repo=telmoni branch=main')] });
  transcript.result('tu1');
  transcript.reply({ messageId: 'msg_2' });
  await hook.run(transcript);
  transcript.prompt();
  transcript.reply({ messageId: 'msg_3' });
  await hook.run(transcript);
  transcript.prompt(typed('branch='));
  transcript.reply({ messageId: 'msg_4' });
  transcript.prompt();
  transcript.reply({ messageId: 'msg_5' });
  await hook.run(transcript);
  expect(hook.server.agents().map(tagsOf)).toEqual([
    {},
    { repo: 'telmoni', branch: 'main', skills: TAG_SKILL },
    { repo: 'telmoni', branch: 'main' },
    { repo: 'telmoni' },
    { repo: 'telmoni' },
  ]);
  expect(stateOf(hook).tags).toEqual({ repo: 'telmoni' });
  assertMetadataOnly(...hook.server.bodies, hook.kept(), hook.log());
});

test('the tags file above the folder a turn started in goes on it and no path leaves', async () => {
  const { tmp, hook, transcript } = setup();
  const repo = join(tmp, 'work-FOLDER-NEVER-SENT', 'telmoni');
  mkdirSync(join(repo, 'src'), { recursive: true });
  writeFileSync(join(repo, '.telmoni-tags.json'), JSON.stringify({ repo: 'telmoni', skills: 'x' }));
  const elsewhere = join(tmp, 'elsewhere-FOLDER-NEVER-SENT');
  mkdirSync(elsewhere);
  transcript.prompt(undefined, { cwd: join(repo, 'src') });
  transcript.reply();
  transcript.prompt(undefined, { cwd: elsewhere });
  transcript.reply({ messageId: 'msg_2' });
  transcript.prompt(undefined, { cwd: repo });
  transcript.reply({ messageId: 'msg_3', toolUses: [asked('tu1', 'repo=asked')] });
  transcript.result('tu1');
  transcript.reply({ messageId: 'msg_4' });
  await hook.run(transcript);
  expect(hook.server.agents().map(tagsOf)).toEqual([
    { repo: 'telmoni' },
    {},
    { repo: 'asked', skills: TAG_SKILL },
  ]);
  expect(hook.log().split("tag dropped: skills is the plugin's own").length - 1).toBe(1);
  for (const text of [...hook.server.bodies, hook.kept(), hook.log()]) {
    expect(text).not.toContain('FOLDER-NEVER-SENT');
    expect(text).not.toContain(tmp);
  }
});

test('past 32 tags the rest are dropped with a line and the turn still sent', async () => {
  const { tmp, hook, transcript } = setup();
  const many = Object.fromEntries(
    Array.from({ length: 40 }, (_, i) => [`k${String(i).padStart(2, '0')}`, 'v']),
  );
  writeFileSync(join(tmp, '.telmoni-tags.json'), JSON.stringify(many));
  transcript.prompt(undefined, { cwd: tmp });
  transcript.reply({ toolUses: [['tu1', 'Skill', { skill: 'pr-review' }]] });
  transcript.result('tu1');
  transcript.reply({ messageId: 'msg_2' });
  await hook.run(transcript);
  const agents = hook.server.agents();
  expect(agents).toHaveLength(1);
  const sent = tagsOf(agents[0]!);
  expect(Object.keys(sent)).toHaveLength(32);
  expect(sent.skills).toBe('pr-review');
  expect(sent).toHaveProperty('k30');
  expect(sent).not.toHaveProperty('k31');
  expect(hook.log().split('tags past 32 dropped').length - 1).toBe(1);
});

test('the next hook sends only what is new', async () => {
  const { hook, transcript } = setup();
  transcript.prompt();
  transcript.reply();
  await hook.run(transcript);
  transcript.prompt();
  transcript.reply({ messageId: 'msg_2' });
  await hook.run(transcript);
  const agents = hook.server.agents();
  expect(agents).toHaveLength(2);
  expect(new Set(traceIds(agents)).size).toBe(2);
  expect(stateOf(hook).sent).toHaveLength(2);
});

test('the work a blocking stop hook carries on is a trace of its own', async () => {
  const { hook, transcript } = setup();
  transcript.prompt();
  transcript.reply();
  await hook.run(transcript);
  transcript.stopBlocked();
  transcript.reply({ messageId: 'msg_2', toolUses: [['tu1', 'Bash', {}]] });
  transcript.result('tu1');
  transcript.reply({ messageId: 'msg_3' });
  await hook.run(transcript);
  const agents = hook.server.agents();
  expect(agents).toHaveLength(2);
  expect(agents[0]!.traceId).not.toBe(agents[1]!.traceId);
  expect(hook.server.byAttr('gen_ai.tool.name', 'Bash').length).toBeGreaterThan(0);
  expect(hook.server.models()).toHaveLength(3);
  expect(stateOf(hook).offset).toBe(sizeOf(transcript.path));
  assertMetadataOnly(...hook.server.bodies, hook.kept(), hook.log());
});

test('carried on work read under way waits for its own stop', async () => {
  const { hook, transcript } = setup();
  transcript.prompt();
  transcript.reply();
  // The blocking hook returned before this plugin's worker read the transcript.
  transcript.stopBlocked();
  transcript.reply({ messageId: 'msg_2', toolUses: [['tu1', 'Bash', {}]] });
  await hook.run(transcript);
  expect(hook.server.agents()).toHaveLength(1);
  transcript.result('tu1');
  transcript.reply({ messageId: 'msg_3' });
  await hook.run(transcript);
  const agents = hook.server.agents();
  expect(agents).toHaveLength(2);
  expect(hook.server.models()).toHaveLength(3);
  expect(hook.server.byAttr('gen_ai.tool.name', 'Bash')[0]!.attrs['error.type']).toBeUndefined();
  expect(stateOf(hook).sent).toContain(agents[1]!.traceId);
});

test('an interrupted turn is a cancelled trace', async () => {
  const { hook, transcript } = setup();
  transcript.prompt();
  transcript.reply({ toolUses: [['tu1', 'Bash', {}]] });
  transcript.result('tu1', { interrupted: true });
  transcript.interrupt();
  transcript.prompt();
  transcript.reply({ messageId: 'msg_3' });
  await hook.run(transcript);
  const [stopped, fine] = hook.server.agents();
  expect(stopped!.attrs['telmoni.cancelled']).toBe(true);
  expect(fine!.attrs).not.toHaveProperty(['telmoni.cancelled']);
  const tools = hook.server.byAttr('gen_ai.tool.name', 'Bash');
  expect(tools).toHaveLength(1);
  expect(tools[0]!.attrs['telmoni.cancelled']).toBe(true);
  expect(tools[0]!.attrs).not.toHaveProperty(['error.type']);
});

test('a reply the person cut short is a cancelled call', async () => {
  const { hook, transcript } = setup();
  transcript.prompt();
  transcript.reply();
  transcript.interrupt();
  await hook.run(transcript);
  const models = hook.server.models();
  expect(models).toHaveLength(1);
  expect(models[0]!.attrs['telmoni.cancelled']).toBe(true);
});

test("a quiet session's lock is swept, a recent one kept, and the hook's own let go", async () => {
  const { hook, transcript } = setup();
  const week = (Date.now() - waits.sweepAfterMs - 60_000) / 1000;
  const aged = (path: string) => {
    writeFileSync(path, '');
    utimesSync(path, week, week);
  };
  const old = join(hook.stateDir, 'gone.lock');
  aged(old);
  // A lock made long ago whose session saved its state lately is no quiet session's.
  const saved = join(hook.stateDir, 'saved.lock');
  aged(saved);
  writeFileSync(join(hook.stateDir, 'saved.json'), '{}');
  const recent = join(hook.stateDir, 'recent.lock');
  writeFileSync(recent, '');
  transcript.prompt();
  transcript.reply();
  // A lock the hook's own session left a week ago is a dead hook's: taken, then let go.
  const own = join(hook.stateDir, 'session-one.lock');
  aged(own);
  await hook.run(transcript);
  expect(hook.server.agents()).toHaveLength(1);
  expect(existsSync(old)).toBe(false);
  expect(existsSync(saved)).toBe(true);
  expect(existsSync(recent)).toBe(true);
  expect(existsSync(own)).toBe(false);
});

test('a hook lets go of its own lock alone, never one taken after a sweep', async () => {
  const path = join(tempDir(), 's.lock');
  const first = new Lock(path);
  expect(await first.acquire(0)).toBe(true);
  rmSync(path);
  const second = new Lock(path);
  // The first's file is gone: the second takes a new one, which a third then cannot.
  expect(await second.acquire(0)).toBe(true);
  expect(await new Lock(path).acquire(0)).toBe(false);
  first.release();
  expect(await new Lock(path).acquire(0)).toBe(false);
  second.release();
  expect(existsSync(path)).toBe(false);
});

test('a denied tool followed by a reply is not a cancelled trace', async () => {
  const { hook, transcript } = setup();
  transcript.prompt();
  transcript.reply({ toolUses: [['tu1', 'Bash', {}]] });
  transcript.result('tu1', { interrupted: true });
  transcript.interrupt(true);
  transcript.reply({ messageId: 'msg_2' });
  await hook.run(transcript);
  const agents = hook.server.agents();
  expect(agents).toHaveLength(1);
  expect(agents[0]!.attrs).not.toHaveProperty(['telmoni.cancelled']);
});

test('a failed tool fails alone', async () => {
  const { hook, transcript } = setup();
  transcript.prompt();
  transcript.reply({ toolUses: [['tu1', 'Bash', {}]] });
  transcript.result('tu1', { isError: true });
  transcript.reply({ messageId: 'msg_2' });
  await hook.run(transcript);
  const tools = hook.server.byAttr('gen_ai.tool.name', 'Bash');
  expect(tools).toHaveLength(1);
  expect(tools[0]!.attrs['error.type']).toBe('ToolError');
  const agents = hook.server.agents();
  expect(agents).toHaveLength(1);
  expect(agents[0]!.attrs).not.toHaveProperty(['error.type']);
});

test('an api error ends the turn failed', async () => {
  const { hook, transcript } = setup();
  transcript.prompt();
  transcript.reply({ apiError: 'rate_limit' });
  await hook.run(transcript, { event: 'StopFailure', error: 'rate_limit' });
  const agents = hook.server.agents();
  expect(agents).toHaveLength(1);
  expect(agents[0]!.attrs['error.type']).toBe('rate_limit');
  const models = hook.server.models();
  expect(models).toHaveLength(1);
  expect(models[0]!.attrs['error.type']).toBe('rate_limit');
});

test('a stop failure names the error the transcript lacks', async () => {
  const { hook, transcript } = setup();
  transcript.prompt();
  transcript.reply();
  await hook.run(transcript, { event: 'StopFailure', error: 'overloaded' });
  const agents = hook.server.agents();
  expect(agents).toHaveLength(1);
  expect(agents[0]!.attrs['error.type']).toBe('overloaded');
});

function launchBackground(transcript: Transcript, finished = true): void {
  transcript.prompt();
  transcript.reply({
    toolUses: [
      [
        'tu1',
        'Agent',
        {
          subagent_type: 'Explore',
          run_in_background: true,
          prompt: 'SUBAGENT-PROMPT-NEVER-SENT',
        },
      ],
    ],
  });
  transcript.result('tu1', { asyncAgent: 'abc' });
  transcript.subagent('tu1', { agentId: 'abc', agentType: 'Explore', finished });
}

test('a background subagent holds the turn until its notice is answered', async () => {
  const { hook, transcript } = setup();
  launchBackground(transcript);
  await hook.run(transcript);
  expect(hook.server.exports).toEqual([]);
  expect(stateOf(hook).offset).toBe(0);
  expect(hook.log()).toContain('held');
  transcript.notice('tu1');
  transcript.reply({ messageId: 'msg_2' });
  await hook.run(transcript);
  const agents = hook.server.agents();
  expect(agents).toHaveLength(1);
  const steps = hook.server.named('subagent Explore');
  expect(steps).toHaveLength(1);
  expect(steps[0]!.parentSpanId).toBe(agents[0]!.spanId);
  const inner = hook.server.spans().filter((span) => span.parentSpanId === steps[0]!.spanId);
  const kinds = inner.map((span) => ('gen_ai.request.model' in span.attrs ? 'model' : 'tool'));
  expect(kinds.sort()).toEqual(['model', 'model', 'tool']);
  assertMetadataOnly(...hook.server.bodies, hook.kept());
});

test('a report handed back before its notice sends the turn and none of the report', async () => {
  const { hook, transcript } = setup();
  launchBackground(transcript);
  transcript.handback('abc');
  transcript.reply({ messageId: 'msg_2' });
  await hook.run(transcript);
  const agents = hook.server.agents();
  expect(agents).toHaveLength(1);
  const steps = hook.server.named('subagent Explore');
  expect(steps).toHaveLength(1);
  expect(steps[0]!.parentSpanId).toBe(agents[0]!.spanId);
  assertMetadataOnly(...hook.server.bodies, hook.kept(), hook.log());
});

test('a subagent still running holds the turn', async () => {
  const { hook, transcript } = setup();
  launchBackground(transcript, false);
  transcript.notice('tu1');
  transcript.reply({ messageId: 'msg_2' });
  await hook.run(transcript);
  expect(hook.server.exports).toEqual([]);
  const meta = join(transcript.subagents, 'agent-abc.meta.json');
  writeFileSync(
    meta,
    JSON.stringify({ ...JSON.parse(readFileSync(meta, 'utf8')), finished: true }),
  );
  await hook.run(transcript);
  expect(hook.server.agents()).toHaveLength(1);
});

test("the session's end sends what waits", async () => {
  const { hook, transcript } = setup();
  launchBackground(transcript);
  await hook.run(transcript, { event: 'SessionEnd' });
  expect(hook.server.named('subagent Explore')).toHaveLength(1);
});

test('a busy session holds its open turn alone', async () => {
  const { hook, transcript } = setup();
  transcript.prompt();
  transcript.reply();
  await hook.run(transcript, { busy: true });
  expect(hook.server.exports).toEqual([]);
  await hook.run(transcript);
  expect(hook.server.agents()).toHaveLength(1);
});

test('what telmoni could not take goes first next time', async () => {
  const { hook, transcript } = setup();
  transcript.prompt();
  transcript.reply();
  hook.server.answers = [503, 503, 503];
  await hook.run(transcript);
  const state = stateOf(hook);
  expect(state.pending).toHaveLength(1);
  expect(state.sent).toEqual([]);
  expect(hook.log()).toContain('not delivered');
  const firstId = state.pending[0]!.trace_id;
  transcript.prompt();
  transcript.reply({ messageId: 'msg_2' });
  await hook.run(transcript);
  const agents = hook.server.agents();
  expect(traceIds(agents)[0]).toBe(firstId);
  expect(agents).toHaveLength(2);
  expect(stateOf(hook).pending).toEqual([]);
});

test('an unreadable state is left alone and nothing is sent', async () => {
  const { hook, transcript } = setup();
  transcript.prompt();
  transcript.reply();
  const path = join(hook.stateDir, 'session-one.json');
  writeFileSync(path, '{"offset": 0, "sent": [');
  await hook.run(transcript);
  expect(hook.server.exports).toEqual([]);
  expect(readFileSync(path, 'utf8')).toBe('{"offset": 0, "sent": [');
  expect(hook.log()).toContain('state not read (SyntaxError); nothing sent');
});

class RuntimeError extends Error {
  override name = 'RuntimeError';
}

test('traces sent before a fault are remembered', async () => {
  const { hook, transcript } = setup();
  transcript.prompt();
  transcript.reply();
  transcript.prompt();
  transcript.reply({ messageId: 'msg_2' });
  const send = Sender.prototype.send;
  const calls: string[] = [];
  const failing = vi.spyOn(Sender.prototype, 'send').mockImplementation(async function (
    this: Sender,
    record,
    warned,
  ) {
    calls.push(record.trace_id);
    if (calls.length > 1) throw new RuntimeError('the worker died here');
    return send.call(this, record, warned);
  });
  await hook.run(transcript);
  expect(hook.log()).toContain('failed: RuntimeError');
  expect(stateOf(hook).sent).toEqual(calls.slice(0, 1));
  failing.mockRestore();
  await hook.run(transcript);
  expect(traceIds(hook.server.agents())).toEqual(calls);
});

test('a kept trace that will not build is dropped and the rest go', async () => {
  const { hook, transcript } = setup();
  const path = join(hook.stateDir, 'session-one.json');
  writeFileSync(path, JSON.stringify({ pending: [{ trace_id: 'old-shape' }] }));
  transcript.prompt();
  transcript.reply();
  await hook.run(transcript);
  expect(hook.server.agents()).toHaveLength(1);
  expect(hook.log()).toContain('the record did not build: TypeError');
  const state = stateOf(hook);
  expect(state.pending).toEqual([]);
  expect(state.sent).toContain('old-shape');
});

test('a kept trace whose time is no iso time, or a day no calendar has, will not build', async () => {
  const { hook, transcript } = setup();
  const kept = (id: string, start: string) => ({
    trace_id: id,
    agent: 'claude-code',
    start,
    end: '2026-10-25T03:00:02+00:00',
    session_id: 'session-one',
    calls: [],
  });
  const pending = [kept('guessed', 'Oct 25 2026'), kept('no-day', '2026-02-30T03:00:01+00:00')];
  writeFileSync(join(hook.stateDir, 'session-one.json'), JSON.stringify({ pending }));
  transcript.prompt();
  transcript.reply();
  await hook.run(transcript);
  expect(hook.server.agents()).toHaveLength(1);
  expect(hook.log().split('the record did not build: RangeError').length - 1).toBe(2);
  expect(stateOf(hook).sent).toEqual(expect.arrayContaining(['guessed', 'no-day']));
});

test("the state is the owner's alone", async () => {
  const { hook, transcript } = setup();
  transcript.prompt();
  transcript.reply();
  await hook.run(transcript);
  expect(statSync(join(hook.stateDir, 'session-one.json')).mode & 0o777).toBe(0o600);
  expect(statSync(join(hook.stateDir, 'hook.log')).mode & 0o777).toBe(0o600);
  expect(readdirSync(hook.stateDir).filter((name) => name.endsWith('.tmp'))).toEqual([]);
});

test("a trace left at a session's end goes with another session's hook", async () => {
  const { tmp, hook, transcript } = setup();
  transcript.prompt();
  transcript.reply();
  hook.server.answers = [503, 503, 503];
  await hook.run(transcript, { event: 'SessionEnd' });
  const marker = join(hook.stateDir, 'session-one.pending');
  expect(existsSync(marker)).toBe(true);
  const left = stateOf(hook).pending[0]!.trace_id;
  const other = new Transcript(join(tmp, 'projects', 'p', 'session-two.jsonl'), 'session-two');
  other.prompt();
  other.reply();
  await hook.run(other);
  const ids = traceIds(hook.server.agents());
  expect(ids).toHaveLength(2);
  expect(ids.at(-1)).toBe(left);
  expect(stateOf(hook).pending).toEqual([]);
  expect(stateOf(hook).sent).toContain(left);
  expect(existsSync(marker)).toBe(false);
});

test("a left trace goes only where its own session's key sends", async () => {
  const { tmp, hook, transcript } = setup();
  transcript.prompt();
  transcript.reply();
  hook.server.answers = [503, 503, 503];
  await hook.run(transcript, { event: 'SessionEnd' });
  const other = new Transcript(join(tmp, 'projects', 'p', 'session-two.jsonl'), 'session-two');
  other.prompt();
  other.reply();
  // Another endpoint beside the same key: the left trace is that session's own next hook's.
  await hook.run(other, { env: { CLAUDE_PLUGIN_OPTION_TELMONI_ENDPOINT: 'http://127.0.0.1:1' } });
  expect(hook.server.agents()).toHaveLength(1);
  expect(stateOf(hook).pending).toHaveLength(1);
  expect(existsSync(join(hook.stateDir, 'session-one.pending'))).toBe(true);
});

test('a left trace waits while telmoni is away', async () => {
  const { tmp, hook, transcript } = setup();
  transcript.prompt();
  transcript.reply();
  hook.server.answers = [503, 503, 503];
  await hook.run(transcript, { event: 'SessionEnd' });
  const other = new Transcript(join(tmp, 'projects', 'p', 'session-two.jsonl'), 'session-two');
  other.prompt();
  other.reply();
  hook.server.answers = [200, 503, 503, 503];
  await hook.run(other);
  expect(hook.server.agents()).toHaveLength(1);
  expect(stateOf(hook).pending).toHaveLength(1);
  expect(existsSync(join(hook.stateDir, 'session-one.pending'))).toBe(true);
});

test('a refusal is final', async () => {
  const { hook, transcript } = setup();
  transcript.prompt();
  transcript.reply();
  hook.server.answers = [400];
  await hook.run(transcript);
  const state = stateOf(hook);
  expect(state.pending).toEqual([]);
  expect(state.sent).toHaveLength(1);
  expect(hook.log()).toContain('refused, not sent again');
  await hook.run(transcript);
  expect(hook.server.exports).toHaveLength(1);
});

test('a database failure is sent again', async () => {
  const { hook, transcript } = setup();
  transcript.prompt();
  transcript.reply();
  hook.server.answers = [[500, '/errors/internal/database']];
  await hook.run(transcript);
  expect(stateOf(hook).pending).toHaveLength(1);
});

test('without a key nothing is sent and the log says so once', async () => {
  const { hook, transcript } = setup();
  transcript.prompt();
  transcript.reply();
  const keyless = { CLAUDE_PLUGIN_OPTION_TELMONI_API_KEY: '', TELMONI_API_KEY: '' };
  await hook.run(transcript, { env: keyless });
  await hook.run(transcript, { env: keyless });
  expect(hook.server.exports).toEqual([]);
  expect(hook.log().split('no key').length - 1).toBe(1);
});

// Holds a session's lock as a live hook does: the file made only where none is, naming its pid.
const HOLD = `
const { writeFileSync } = require('node:fs');
writeFileSync(process.argv.at(-1), process.pid + ':holder', { flag: 'wx', mode: 0o600 });
process.stdout.write('held\\n');
setTimeout(() => {}, 60_000);
`;

test('a live hook keeps the session and a dead one does not', async () => {
  const { hook, transcript } = setup();
  transcript.prompt();
  transcript.reply();
  const lock = join(hook.stateDir, 'session-one.lock');
  const holder: ChildProcess = spawn(process.execPath, ['-e', HOLD, lock], {
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  try {
    const [said] = (await once(holder.stdout!, 'data')) as [Buffer];
    expect(said.toString()).toBe('held\n');
    await hook.run(transcript);
    expect(hook.server.exports).toEqual([]);
    expect(hook.log()).toContain('another hook holds the session');
  } finally {
    // A holder that dies, however it dies, lets go of the session.
    holder.kill('SIGKILL');
    await once(holder, 'exit');
  }
  await hook.run(transcript, { event: 'SessionEnd' });
  expect(hook.server.agents()).toHaveLength(1);
});

test('history copied from another session is passed over', async () => {
  const { hook, transcript } = setup();
  transcript.otherSession();
  transcript.otherSession();
  transcript.prompt();
  transcript.reply();
  await hook.run(transcript);
  expect(hook.server.agents()).toHaveLength(1);
  assertMetadataOnly(...hook.server.bodies, hook.kept());
});

test('a replaced transcript is read from its start', async () => {
  const { hook, transcript } = setup();
  transcript.prompt();
  transcript.reply();
  transcript.prompt();
  transcript.reply({ messageId: 'msg_2' });
  await hook.run(transcript);
  writeFileSync(transcript.path, '');
  transcript.count = 50;
  transcript.prompt();
  transcript.reply({ messageId: 'msg_9' });
  await hook.run(transcript);
  expect(hook.server.agents()).toHaveLength(3);
});

test('an image alone is a prompt', async () => {
  const { hook, transcript } = setup();
  transcript.prompt();
  transcript.reply();
  transcript.imagePrompt();
  transcript.reply({ messageId: 'msg_2' });
  transcript.imagePrompt({ withOrigin: false, caption: true });
  transcript.reply({ messageId: 'msg_3' });
  await hook.run(transcript);
  expect(hook.server.agents()).toHaveLength(3);
  assertMetadataOnly(...hook.server.bodies, hook.kept());
});

test('a tool the person refused is cancelled not failed', async () => {
  const { hook, transcript } = setup();
  transcript.prompt();
  transcript.reply({ toolUses: [['tu1', 'Bash', { command: 'rm /secret/path' }]] });
  transcript.denied('tu1');
  transcript.prompt();
  transcript.reply({ messageId: 'msg_3' });
  await hook.run(transcript);
  const tools = hook.server.byAttr('gen_ai.tool.name', 'Bash');
  expect(tools).toHaveLength(1);
  expect(tools[0]!.attrs['telmoni.cancelled']).toBe(true);
  expect(tools[0]!.attrs).not.toHaveProperty(['error.type']);
  const agents = hook.server.agents();
  expect(agents).toHaveLength(2);
  expect(agents[0]!.attrs['telmoni.cancelled']).toBe(true);
  assertMetadataOnly(...hook.server.bodies, hook.kept());
});

test('a notice answered in a later turn completes the earlier one', async () => {
  const { hook, transcript } = setup();
  launchBackground(transcript);
  transcript.prompt();
  transcript.reply({ messageId: 'msg_2' });
  await hook.run(transcript);
  expect(hook.server.exports).toEqual([]);
  transcript.notice('tu1');
  transcript.reply({ messageId: 'msg_3' });
  await hook.run(transcript);
  expect(hook.server.agents()).toHaveLength(2);
  expect(hook.server.named('subagent Explore')).toHaveLength(1);
});

test('a trace telmoni took in part is logged and not sent again', async () => {
  const { hook, transcript } = setup();
  transcript.prompt();
  transcript.reply();
  const dropped = 'span 1 dropped gen_ai.usage.input_tokens: not_a_count';
  hook.server.answers = [[200, JSON.stringify({ partialSuccess: { errorMessage: dropped } })]];
  await hook.run(transcript);
  expect(hook.log()).toContain('taken in part');
  const state = stateOf(hook);
  expect(state.pending).toEqual([]);
  expect(state.sent).toHaveLength(1);
});

test('pending traces are bounded to the newest', async () => {
  const { hook, transcript } = setup();
  const pending = limits.pending;
  limits.pending = 3;
  try {
    hook.server.answers = Array<number>(60).fill(503);
    const ids: string[] = [];
    for (let i = 0; i < 5; i++) {
      const prompt = transcript.prompt();
      transcript.reply({ messageId: `msg_${i}` });
      await hook.run(transcript);
      ids.push(traceId('session-one', prompt.uuid as string));
    }
    expect(stateOf(hook).pending.map((made) => made.trace_id)).toEqual(ids.slice(-3));
    expect(hook.log()).toContain('dropped');
    hook.server.answers = [];
    const prompt = transcript.prompt();
    transcript.reply({ messageId: 'msg_9' });
    await hook.run(transcript);
    expect(traceIds(hook.server.agents())).toEqual([
      ...ids.slice(-3),
      traceId('session-one', prompt.uuid as string),
    ]);
    expect(stateOf(hook).pending).toEqual([]);
  } finally {
    limits.pending = pending;
  }
});

test('a compaction opens no turn of its own', async () => {
  const { hook, transcript } = setup();
  transcript.prompt();
  transcript.reply();
  // A manual /compact as Claude Code writes it: boundary, summary, caveat, command, output.
  transcript.tick(0.1);
  transcript.row('system', undefined, {
    subtype: 'compact_boundary',
    isMeta: true,
    content: 'COPIED-HISTORY-NEVER-SENT',
  });
  transcript.prompt(undefined, { isCompactSummary: true, isVisibleInTranscriptOnly: true });
  transcript.meta('<local-command-caveat>PROMPT-TEXT-NEVER-SENT</local-command-caveat>');
  transcript.prompt('<command-name>/compact</command-name>');
  transcript.prompt('<local-command-stdout>PROMPT-TEXT-NEVER-SENT</local-command-stdout>');
  transcript.prompt();
  transcript.reply({ messageId: 'msg_2' });
  await hook.run(transcript);
  expect(hook.server.agents()).toHaveLength(2);
  expect(stateOf(hook).offset).toBe(sizeOf(transcript.path));
  assertMetadataOnly(...hook.server.bodies, hook.kept());
});

/** The spans right under one, in the order they started. */
function under(hook: ReturnType<typeof setup>['hook'], parent: Span): Span[] {
  return hook.server
    .spans()
    .filter((span) => span.parentSpanId === parent.spanId)
    .sort((a, b) => Number(BigInt(a.startTimeUnixNano) - BigInt(b.startTimeUnixNano)));
}

test("a subagent's own subagent and a compaction go as steps and none of what was said", async () => {
  const { hook, transcript } = setup();
  transcript.longTurn();
  hook.server.answers = [503, 503, 503];
  await hook.run(transcript);
  expect(stateOf(hook).pending).toHaveLength(1);
  assertMetadataOnly(hook.kept(), hook.log());
  hook.server.answers = [];
  await hook.run(transcript);
  const agents = hook.server.agents();
  const outer = hook.server.named('subagent Explore');
  const inner = hook.server.named('subagent Plan');
  const compaction = hook.server.named('compaction');
  expect([agents.length, outer.length, inner.length, compaction.length]).toEqual([1, 1, 1, 1]);
  expect(outer[0]!.parentSpanId).toBe(agents[0]!.spanId);
  expect(compaction[0]!.parentSpanId).toBe(agents[0]!.spanId);
  expect(inner[0]!.parentSpanId).toBe(outer[0]!.spanId);
  expect(under(hook, inner[0]!).map((span) => 'gen_ai.request.model' in span.attrs)).toEqual([
    true,
  ]);
  assertMetadataOnly(...hook.server.bodies, hook.kept(), hook.log());
});

test("subagents nested past the sdk's depth are sent and not refused", async () => {
  const { hook, transcript } = setup();
  transcript.prompt();
  transcript.reply({ toolUses: [['tu1', 'Agent', { subagent_type: 'Explore' }]] });
  transcript.nested('tu1', STEP_DEPTH_MAX + 1);
  transcript.result('tu1');
  transcript.reply({ messageId: 'msg_2' });
  expect(await hook.run(transcript)).toBe(0);
  expect(hook.server.agents()).toHaveLength(1);
  expect(hook.log()).not.toContain('refused');
  const steps = hook.server.spans().filter((span) => span.name.startsWith('subagent '));
  expect(steps).toHaveLength(STEP_DEPTH_MAX);
  const agents = hook.server.byAttr('gen_ai.tool.name', 'Agent');
  expect(agents).toHaveLength(1);
  expect(steps.map((step) => step.spanId)).toContain(agents[0]!.parentSpanId);
});

test('a trace the sdk has no room for is refused and logged', async () => {
  const { hook, transcript } = setup();
  vi.spyOn(Telmoni.prototype, 'recordTrace').mockImplementation(() => {
    throw new QueueFullError(1, 0);
  });
  transcript.prompt();
  transcript.reply();
  await hook.run(transcript);
  expect(hook.log()).toContain('refused, not sent again');
  expect(hook.log()).toContain('queue');
  const kept = stateOf(hook);
  expect(kept.pending).toEqual([]);
  expect(kept.sent).toHaveLength(1);
});

const CONTENT_ON = { CLAUDE_PLUGIN_OPTION_TELMONI_CAPTURE_CONTENT: 'true' };

/** A content field's parts, as sent: each of its messages' in turn. */
function parts(span: Span, field: string): Json[] {
  const messages = JSON.parse(span.attrs[field] as string) as Array<{ parts: Json[] }>;
  return messages.flatMap((message) => message.parts);
}

/** A model call's input as sent, its messages whole. */
function given(span: Span): unknown {
  return JSON.parse(span.attrs['gen_ai.input.messages'] as string);
}

function header(headers: Record<string, string>, name: string): string | undefined {
  return Object.entries(headers).find(([key]) => key.toLowerCase() === name.toLowerCase())?.[1];
}

test('content on sends the conversation where the project keeps it', async () => {
  const { hook, transcript } = setup();
  hook.server.contentMode = 'on';
  transcript.conversation();
  expect(await hook.run(transcript, { env: CONTENT_ON })).toBe(0);
  // A hook's client has heard no answer yet, so it asks the mode with an export of no spans.
  expect(hook.server.exports[0]).toEqual({ resourceSpans: [] });
  const agents = hook.server.agents();
  expect(agents).toHaveLength(1);
  const digest = createHash('sha256').update(IMAGE_BYTES).digest('hex');
  const prompt = parts(agents[0]!, 'gen_ai.input.messages');
  expect(prompt).toContainEqual({ type: 'text', content: 'PROMPT-TEXT-NEVER-SENT' });
  expect(prompt).toContainEqual({
    type: 'file',
    modality: 'image',
    mime_type: 'image/png',
    file_id: `telmoni:${digest}`,
  });
  expect(hook.server.uploads).toHaveLength(1);
  const upload = hook.server.uploads[0]!;
  expect(upload.url).toBe(`${ENDPOINT}/v1/media/${digest}`);
  expect(upload.body.equals(IMAGE_BYTES)).toBe(true);
  expect(header(upload.headers, 'Authorization')).toBe(`Bearer ${KEY}`);
  expect(parts(agents[0]!, 'gen_ai.output.messages')).toEqual([
    { type: 'text', content: 'REPLY-TEXT-NEVER-SENT' },
  ]);
  const models = hook.server.byAttr('gen_ai.operation.name', 'chat');
  const said = models.flatMap((model) => parts(model, 'gen_ai.output.messages'));
  expect(said).toContainEqual({ type: 'reasoning', content: 'THINKING-NEVER-SENT' });
  const tools = hook.server.byAttr('gen_ai.tool.name', 'Bash');
  expect(tools).toHaveLength(1);
  expect(JSON.parse(tools[0]!.attrs['gen_ai.tool.call.arguments'] as string)).toEqual({
    command: 'cat /secret/path',
  });
  expect(tools[0]!.attrs['gen_ai.tool.call.result']).toBe('TOOL-OUTPUT-NEVER-SENT');
  const steps = hook.server.named('subagent Explore');
  expect(steps).toHaveLength(1);
  expect(parts(steps[0]!, 'gen_ai.input.messages')).toEqual([
    { type: 'text', content: 'SUBAGENT-PROMPT-NEVER-SENT' },
  ]);
  expect(parts(steps[0]!, 'gen_ai.output.messages')).toContainEqual({
    type: 'text',
    content: 'SUBAGENT-REPLY-NEVER-SENT',
  });
  // The conversation, and never a redacted thought, the working folder or the transcript's path.
  const sent = hook.server.bodies.join('');
  for (const withheld of ['REDACTED-THINKING-NEVER-SENT', '/home/someone/secret-project']) {
    expect(sent).not.toContain(withheld);
  }
  expect(sent).not.toContain(transcript.path);
  assertMetadataOnly(hook.kept());
});

test('content off reads and sends none of it', async () => {
  const { hook, transcript } = setup();
  hook.server.contentMode = 'on';
  transcript.conversation();
  expect(await hook.run(transcript)).toBe(0);
  expect(hook.server.exports).not.toContainEqual({ resourceSpans: [] });
  expect(hook.server.uploads).toEqual([]);
  assertMetadataOnly(...hook.server.bodies, hook.kept());
});

test('content on where the project keeps none sends none of it', async () => {
  const { hook, transcript } = setup();
  hook.server.contentMode = 'off';
  transcript.conversation();
  expect(await hook.run(transcript, { env: CONTENT_ON })).toBe(0);
  expect(hook.server.exports[0]).toEqual({ resourceSpans: [] });
  expect(hook.server.uploads).toEqual([]);
  assertMetadataOnly(...hook.server.bodies, hook.kept());
});

test('content on gives each model call its input and a compaction its summary', async () => {
  const { hook, transcript } = setup();
  hook.server.contentMode = 'on';
  transcript.longTurn();
  expect(await hook.run(transcript, { env: CONTENT_ON })).toBe(0);
  const agents = hook.server.agents();
  expect(agents).toHaveLength(1);
  const children = under(hook, agents[0]!);
  expect(children).toHaveLength(6);
  const [first, , compaction, second, step, last] = children as [
    Span,
    Span,
    Span,
    Span,
    Span,
    Span,
  ];
  const fileId = `telmoni:${createHash('sha256').update(IMAGE_BYTES).digest('hex')}`;
  const image = { type: 'file', modality: 'image', mime_type: 'image/png', file_id: fileId };
  const prompt = { type: 'text', content: 'PROMPT-TEXT-NEVER-SENT' };
  expect(parts(first, 'gen_ai.input.messages')).toEqual([image, prompt]);
  // The image is in the trace's input and the first call's, and put once.
  expect(hook.server.uploads).toHaveLength(1);
  expect(given(second)).toEqual([{ role: 'tool', parts: [toolResponse('tu1')] }]);
  expect(given(last)).toEqual([{ role: 'tool', parts: [toolResponse('tu2')] }]);
  expect(parts(compaction, 'gen_ai.output.messages')).toEqual([
    { type: 'text', content: 'COMPACT-SUMMARY-NEVER-SENT' },
  ]);
  const inside = under(hook, step);
  expect(inside).toHaveLength(3);
  const [launch, inner, answer] = inside as [Span, Span, Span];
  expect(parts(launch, 'gen_ai.input.messages')).toEqual([
    { type: 'text', content: 'SUBAGENT-PROMPT-NEVER-SENT' },
  ]);
  expect(given(answer)).toEqual([{ role: 'tool', parts: [toolResponse('tu2-in')] }]);
  const asked = under(hook, inner);
  expect(asked).toHaveLength(1);
  const nested = { type: 'text', content: 'SUBAGENT-PROMPT-NEVER-SENT at 2' };
  expect(parts(inner, 'gen_ai.input.messages')).toEqual([nested]);
  expect(parts(asked[0]!, 'gen_ai.input.messages')).toEqual([nested]);
  assertMetadataOnly(hook.kept());
});

test('content on where the project keeps none sends none of a long turn', async () => {
  const { hook, transcript } = setup();
  hook.server.contentMode = 'off';
  transcript.longTurn();
  expect(await hook.run(transcript, { env: CONTENT_ON })).toBe(0);
  expect(hook.server.agents()).toHaveLength(1);
  expect(hook.server.named('compaction')).toHaveLength(1);
  expect(hook.server.uploads).toEqual([]);
  assertMetadataOnly(...hook.server.bodies, hook.kept(), hook.log());
});

test('the switch goes with the key it is set beside', async () => {
  const { hook, transcript } = setup();
  hook.server.contentMode = 'on';
  transcript.prompt();
  transcript.reply();
  // The environment's key takes the environment's switch, never the plugin's own.
  const own = { TELMONI_API_KEY: KEY, TELMONI_ENDPOINT: ENDPOINT, ...CONTENT_ON };
  expect(await hook.run(transcript, { env: own })).toBe(0);
  assertMetadataOnly(...hook.server.bodies);
  transcript.prompt();
  transcript.reply({ messageId: 'msg_2' });
  expect(await hook.run(transcript, { env: { ...own, TELMONI_CAPTURE_CONTENT: ' 1\t' } })).toBe(0);
  expect(hook.server.bodies.join('')).toContain('PROMPT-TEXT-NEVER-SENT');
});

test("the scrubbers' switches reach the sdk's config", async () => {
  const { hook, transcript } = setup();
  transcript.prompt();
  transcript.reply();
  const piiOff = { CLAUDE_PLUGIN_OPTION_TELMONI_SCRUB_PII: 'false' };
  expect(await hook.run(transcript, { env: piiOff })).toBe(0);
  transcript.prompt();
  transcript.reply({ messageId: 'msg_2' });
  const secretsOff = { CLAUDE_PLUGIN_OPTION_TELMONI_SCRUB_SECRETS: 'false' };
  expect(await hook.run(transcript, { env: secretsOff })).toBe(0);
  expect(sdk.configs.map((config) => [config.scrubSecrets, config.scrubPii])).toEqual([
    [true, false],
    [false, true],
  ]);
});

test("a turn past the sdk's default queue is sent whole", { timeout: 60_000 }, async () => {
  const { hook, transcript } = setup();
  transcript.prompt();
  const uses = Array.from({ length: 2100 }, (_, i): Use => [`tu${i}`, 'Read', {}]);
  transcript.reply({ toolUses: uses });
  for (const [id] of uses) transcript.result(id);
  transcript.reply({ messageId: 'msg_2' });
  expect(await hook.run(transcript)).toBe(0);
  expect(hook.server.byAttr('gen_ai.tool.name', 'Read')).toHaveLength(2100);
  expect(hook.log()).toContain('sent');
});

test("the flush waits as long as the sdk's own attempts", async () => {
  const { hook, transcript } = setup();
  transcript.prompt();
  transcript.reply();
  expect(await hook.run(transcript)).toBe(0);
  expect(sdk.flushes.length).toBeGreaterThan(0);
  expect(sdk.flushes.every((seconds) => seconds === Number.POSITIVE_INFINITY)).toBe(true);
});

// Trace ids and the destination's digest must never change between versions.
// The bytes a turn's id always had, spelled as a trace id: what ingest stored for it stands.
const PINNED_TRACE_IDS: Array<[string, string, string]> = [
  ['session-one', 'uuid-1', '35ca5dbff0e553dbb6db9c23c9a1e522'],
  ['s1', 'offset:0', '97d3ffce59825f9781537461d304420d'],
  ['abc', 'é-ünïcode-𝄞', '3e57f0d0752055b7887b0ce94b3def4e'],
];

test.each(PINNED_TRACE_IDS)(
  "the trace id of %s's prompt %s is the one it always was",
  (session, prompt, id) => {
    expect(traceId(session, prompt)).toBe(id);
  },
);

test("a key's destination is the digest it always was", () => {
  expect(destination({ apiKey: 'tm_x', endpoint: 'https://api.telmoni.com' })).toBe(
    '52a59390b8977f99',
  );
  expect(destination({ apiKey: undefined, endpoint: 'http://localhost:1' })).toBe(
    'bbf89177b1862cf6',
  );
});

test('a session kept by an older version goes on, its kept trace sent once', async () => {
  const { hook, transcript } = setup();
  transcript.prompt();
  transcript.reply();
  const at = (seconds: number) => `2026-10-25T03:00:0${seconds}+00:00`;
  const kept = {
    trace_id: traceId('session-one', 'uuid-1'),
    agent: 'claude-code',
    start: at(1),
    end: at(2),
    session_id: 'session-one',
    release: '2.1.310',
    tags: { repo: 'telmoni' },
    error_type: null,
    cancelled: false,
    calls: [
      {
        kind: 'model',
        model: 'claude-opus-5-5',
        provider: 'anthropic',
        start: at(1),
        end: at(2),
        usage: { input: 18, output: 20, cache_read: 5, cache_write: 3 },
        error_type: null,
        cancelled: false,
      },
    ],
  };
  const state = {
    offset: 0,
    sent: [],
    pending: [kept],
    warned: { key: true },
    destination: destination({ apiKey: KEY, endpoint: ENDPOINT }),
    tags: { repo: 'telmoni' },
  };
  writeFileSync(join(hook.stateDir, 'session-one.json'), JSON.stringify(state));
  writeFileSync(join(hook.stateDir, 'session-one.pending'), '');
  // An empty stale lock must be taken over so the session goes on.
  writeFileSync(join(hook.stateDir, 'session-one.lock'), '');
  utimesSync(join(hook.stateDir, 'session-one.lock'), 1, 1);
  await hook.run(transcript);
  const agents = hook.server.agents();
  expect(traceIds(agents)).toEqual([kept.trace_id]);
  expect(tagsOf(agents[0]!)).toEqual({ repo: 'telmoni' });
  expect(hook.server.models()[0]!.attrs['gen_ai.usage.input_tokens']).toBe(18);
  const after = stateOf(hook);
  expect(after.pending).toEqual([]);
  expect(after.sent).toEqual([kept.trace_id]);
  expect(after.offset).toBe(sizeOf(transcript.path));
  expect(after.tags).toEqual({ repo: 'telmoni' });
});
