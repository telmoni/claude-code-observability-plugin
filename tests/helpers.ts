/** Transcripts written as Claude Code writes them, a Telmoni that answers as told, and the worker run in this process. */

import {
  appendFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, parse } from 'node:path';

import type { Transport } from 'telmoni';
import { expect, onTestFinished } from 'vitest';

import * as worker from '../src/worker.js';

export const T0 = new Date(Date.UTC(2026, 9, 25, 3, 0));
export const IMAGE_BYTES = Buffer.from('IMAGE-BYTES-NEVER-SENT');
export const IMAGE = IMAGE_BYTES.toString('base64');
// Words that never leave the transcript with content off: a test fails on any of them in what is
// sent or kept.
export const SECRETS = [
  'PROMPT-TEXT-NEVER-SENT',
  'REPLY-TEXT-NEVER-SENT',
  'TOOL-OUTPUT-NEVER-SENT',
  '/home/someone/secret-project',
  '/secret/path',
  'SUBAGENT-PROMPT-NEVER-SENT',
  'SUBAGENT-REPLY-NEVER-SENT',
  'SUBAGENT-DESCRIPTION-NEVER-SENT',
  'COPIED-HISTORY-NEVER-SENT',
  'tm_test_key_never_sent',
  '/data/models/NAME-PATH-NEVER-SENT',
  'NAME-TEXT-NEVER-SENT',
  'THINKING-NEVER-SENT',
  'REDACTED-THINKING-NEVER-SENT',
  'COMPACT-SUMMARY-NEVER-SENT',
  IMAGE,
];
export const KEY = 'tm_test_key_never_sent';
export const ENDPOINT = 'http://localhost:1';

export type Json = Record<string, unknown>;
/** A tool call a reply makes: its id, its tool's name, its input. */
export type Use = [id: string, name: string, input: Json];

/** A folder of the test's own, removed as the test ends. */
export function tempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'telmoni-test-'));
  onTestFinished(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

export interface ReplyOptions {
  messageId?: string;
  model?: string;
  toolUses?: Use[];
  usage?: Json;
  apiError?: string;
  text?: string;
  thinking?: string;
  redacted?: string;
}

/** One session's transcript, a row a call, timestamps a second apart. */
export class Transcript {
  clock = T0;
  count = 0;
  // Where its subagents go, and how deep it was started: a subagent's own go beside it.
  subagents: string;
  spawnDepth = 0;

  constructor(
    readonly path: string,
    readonly sessionId: string,
    readonly version = '2.1.310',
  ) {
    const { dir, name } = parse(path);
    this.subagents = join(dir, name, 'subagents');
    mkdirSync(dir, { recursive: true });
    writeFileSync(path, '');
  }

  tick(seconds = 1): Date {
    this.clock = new Date(this.clock.getTime() + seconds * 1000);
    return this.clock;
  }

  row(kind: string, message?: Json, extra: Json = {}): Json {
    this.count += 1;
    const data: Json = {
      type: kind,
      uuid: `uuid-${this.count}`,
      sessionId: this.sessionId,
      timestamp: this.clock.toISOString(),
      version: this.version,
      isSidechain: false,
      cwd: '/home/someone/secret-project',
    };
    if (message !== undefined) data.message = message;
    Object.assign(data, extra);
    appendFileSync(this.path, `${JSON.stringify(data)}\n`);
    return data;
  }

  prompt(text = 'PROMPT-TEXT-NEVER-SENT', extra: Json = {}): Json {
    this.tick();
    return this.row('user', { role: 'user', content: text }, extra);
  }

  meta(text = '<command-name>/compact</command-name>'): Json {
    this.tick(0.1);
    return this.row('user', { role: 'user', content: text }, { isMeta: true });
  }

  reply(options: ReplyOptions = {}): Json {
    const { messageId = 'msg_1', model = 'claude-opus-5-5', toolUses = [] } = options;
    const content: Json[] = [];
    if (options.thinking !== undefined) {
      content.push({ type: 'thinking', thinking: options.thinking, signature: 'c2lnbmVk' });
    }
    if (options.redacted !== undefined) {
      content.push({ type: 'redacted_thinking', data: options.redacted });
    }
    content.push({ type: 'text', text: options.text ?? 'REPLY-TEXT-NEVER-SENT' });
    for (const [id, name, input] of toolUses) content.push({ type: 'tool_use', id, name, input });
    const message = {
      id: messageId,
      role: 'assistant',
      model,
      content,
      stop_reason: toolUses.length > 0 ? 'tool_use' : 'end_turn',
      usage: options.usage ?? {
        input_tokens: 10,
        output_tokens: 20,
        cache_read_input_tokens: 5,
        cache_creation: { ephemeral_5m_input_tokens: 3, ephemeral_1h_input_tokens: 0 },
      },
    };
    const extra: Json = { requestId: `req_${messageId}` };
    if (options.apiError) {
      Object.assign(extra, {
        isApiErrorMessage: true,
        error: options.apiError,
        apiErrorStatus: 429,
      });
    }
    this.tick();
    return this.row('assistant', message, extra);
  }

  result(
    toolUseId: string,
    options: { isError?: boolean; interrupted?: boolean; asyncAgent?: string } = {},
  ): Json {
    const block: Json = {
      type: 'tool_result',
      tool_use_id: toolUseId,
      content: 'TOOL-OUTPUT-NEVER-SENT',
    };
    if (options.isError) block.is_error = true;
    let toolUseResult: Json = { stdout: 'TOOL-OUTPUT-NEVER-SENT' };
    if (options.interrupted) toolUseResult = { interrupted: true };
    if (options.asyncAgent) {
      toolUseResult = { status: 'async_launched', isAsync: true, agentId: options.asyncAgent };
    }
    this.tick();
    return this.row('user', { role: 'user', content: [block] }, { toolUseResult });
  }

  interrupt(tool = false): Json {
    const text = tool
      ? '[Request interrupted by user for tool use]'
      : '[Request interrupted by user]';
    this.tick();
    return this.row('user', { role: 'user', content: text });
  }

  /** A prompt that is an image: Claude Code writes an empty text block first, and marks the row as the person's by its origin. */
  imagePrompt(options: { withOrigin?: boolean; caption?: boolean } = {}): Json {
    const { withOrigin = true, caption = false } = options;
    this.tick();
    const source = { type: 'base64', media_type: 'image/png', data: IMAGE };
    const content: Json[] = [
      { type: 'text', text: '' },
      { type: 'image', source },
    ];
    if (caption) content.push({ type: 'text', text: 'PROMPT-TEXT-NEVER-SENT' });
    const extra = withOrigin ? { origin: { kind: 'human' } } : {};
    return this.row('user', { role: 'user', content }, extra);
  }

  /** A tool call the person refused, as Claude Code writes it: an error result whose reason is text, then the marker. */
  denied(toolUseId: string): Json {
    const block = {
      type: 'tool_result',
      tool_use_id: toolUseId,
      content: 'TOOL-OUTPUT-NEVER-SENT',
      is_error: true,
    };
    this.tick();
    this.row(
      'user',
      { role: 'user', content: [block] },
      { toolUseResult: 'TOOL-OUTPUT-NEVER-SENT' },
    );
    return this.interrupt(true);
  }

  notice(toolUseId: string): Json {
    const text =
      '<task-notification>\n' +
      `<tool-use-id>${toolUseId}</tool-use-id>\n<status>completed</status>\n` +
      '<summary>TOOL-OUTPUT-NEVER-SENT</summary>\n</task-notification>';
    this.tick();
    return this.row('user', { role: 'user', content: text });
  }

  /** A background subagent's report handed back, as Claude Code 2.1.314 writes one. */
  handback(agentId: string): Json {
    this.tick();
    const report = 'TOOL-OUTPUT-NEVER-SENT';
    const origin = { kind: 'peer', from: agentId, handback: true, handbackReportText: report };
    const text = `Another Claude session sent a message: <agent-message from="${agentId}"> ${report}`;
    return this.row('user', { role: 'user', content: text }, { isMeta: true, origin });
  }

  companion(): Json {
    this.tick(0.1);
    return this.row(
      'user',
      { role: 'user', content: 'go on' },
      { turnCompanion: true, isMeta: true },
    );
  }

  /**
   * A `Stop` hook that blocked, as Claude Code 2.1.312 wrote it: its reason as a meta row, the
   * block as an attachment, then the hooks' summary; the turn then goes on.
   */
  stopBlocked(): Json {
    const reason = 'PROMPT-TEXT-NEVER-SENT';
    this.tick(0.1);
    this.row('user', { role: 'user', content: `Stop hook feedback:\n${reason}` }, { isMeta: true });
    const block = this.row('attachment', undefined, {
      attachment: {
        type: 'hook_blocking_error',
        hookName: 'Stop',
        toolUseID: 'hook-1',
        hookEvent: 'Stop',
        blockingError: { blockingError: reason, command: '/secret/path' },
      },
      renderedRole: 'system',
    });
    this.row('system', undefined, {
      subtype: 'stop_hook_summary',
      hookCount: 1,
      hookInfos: [{ command: '/secret/path' }],
      hookErrors: [reason],
      preventedContinuation: false,
      stopReason: '',
      level: 'suggestion',
    });
    return block;
  }

  otherSession(): Json {
    this.tick();
    return this.row(
      'user',
      { role: 'user', content: 'COPIED-HISTORY-NEVER-SENT' },
      { sessionId: 'other-session' },
    );
  }

  subagent(
    toolUseId: string,
    options: {
      agentId?: string;
      agentType?: string;
      finished?: boolean | null;
      replies?: number;
    } = {},
  ): Transcript {
    const { agentId = 'abc', agentType = 'Explore', finished = true, replies = 2 } = options;
    const folder = this.subagents;
    mkdirSync(folder, { recursive: true });
    const meta: Json = {
      agentType,
      toolUseId,
      spawnDepth: this.spawnDepth + 1,
      description: 'SUBAGENT-DESCRIPTION-NEVER-SENT',
    };
    if (finished !== null) meta.finished = finished;
    writeFileSync(join(folder, `agent-${agentId}.meta.json`), JSON.stringify(meta));
    const sub = new Transcript(join(folder, `agent-${agentId}.jsonl`), this.sessionId);
    sub.subagents = folder;
    sub.spawnDepth = this.spawnDepth + 1;
    sub.clock = this.clock;
    sub.prompt('SUBAGENT-PROMPT-NEVER-SENT', { isSidechain: true, agentId });
    for (let i = 0; i < replies; i++) {
      const uses: Use[] =
        i === 0 ? [[`${toolUseId}-sub-${i}`, 'Read', { file_path: '/secret/path' }]] : [];
      sub.reply({
        messageId: `${agentId}-m${i}`,
        toolUses: uses,
        text: 'SUBAGENT-REPLY-NEVER-SENT',
      });
      for (const [id] of uses) sub.result(id);
    }
    this.clock = sub.clock;
    return sub;
  }

  /**
   * A turn holding all that content carries: a prompt with an image, plain and redacted thinking,
   * a tool's input and result, a subagent's task and answer, a last reply.
   */
  conversation(): void {
    this.imagePrompt({ caption: true });
    this.reply({
      thinking: 'THINKING-NEVER-SENT',
      redacted: 'REDACTED-THINKING-NEVER-SENT',
      toolUses: [['tu1', 'Bash', { command: 'cat /secret/path' }]],
    });
    this.result('tu1');
    const task = { subagent_type: 'Explore', prompt: 'SUBAGENT-PROMPT-NEVER-SENT' };
    this.reply({ messageId: 'msg_2', toolUses: [['tu2', 'Agent', task]] });
    this.subagent('tu2');
    this.result('tu2');
    this.reply({ messageId: 'msg_3' });
  }

  /**
   * A subagent whose own subagents go `depth` deep, each started by an `Agent` call of the one
   * above, their metas side by side with their `spawnDepth`.
   */
  nested(toolUseId: string, depth = 2, agentId = 'abc'): void {
    const sub = this.subagent(toolUseId, { agentId, replies: 0 });
    const level = sub.spawnDepth;
    if (level < depth) {
      const inner = `${toolUseId}-in`;
      const task = { subagent_type: 'Plan', prompt: `SUBAGENT-PROMPT-NEVER-SENT at ${level + 1}` };
      sub.reply({ messageId: `${agentId}-m0`, toolUses: [[inner, 'Agent', task]] });
      sub.nested(inner, depth, `${agentId}-in`);
      sub.result(inner);
    }
    sub.reply({ messageId: `${agentId}-m1`, text: `SUBAGENT-REPLY-NEVER-SENT at ${level}` });
    this.clock = sub.clock;
  }

  /** Claude Code compacting the context on its own: its boundary, then the summary as a user row of its own. */
  compaction(): Json {
    this.tick(0.5);
    this.row('system', undefined, {
      subtype: 'compact_boundary',
      content: 'Conversation compacted',
      compactMetadata: { trigger: 'auto', preTokens: 167000 },
      level: 'info',
    });
    this.tick(0.1);
    const message = { role: 'user', content: 'COMPACT-SUMMARY-NEVER-SENT' };
    return this.row('user', message, { isCompactSummary: true, isVisibleInTranscriptOnly: true });
  }

  /**
   * A turn compacted as it goes, whose subagent starts one of its own: an image prompt, a tool,
   * the compaction, the subagents, a last reply.
   */
  longTurn(): void {
    this.imagePrompt({ caption: true });
    this.reply({ toolUses: [['tu1', 'Bash', { command: 'cat /secret/path' }]] });
    this.result('tu1');
    this.compaction();
    const task = { subagent_type: 'Explore', prompt: 'SUBAGENT-PROMPT-NEVER-SENT' };
    this.reply({ messageId: 'msg_2', toolUses: [['tu2', 'Agent', task]] });
    this.nested('tu2');
    this.result('tu2');
    this.reply({ messageId: 'msg_3' });
  }
}

/** A span as the server took it: its own fields, its attributes and its resource's decoded. */
export type Span = Json & {
  name: string;
  spanId: string;
  parentSpanId?: string;
  startTimeUnixNano: string;
  attrs: Json;
  resource: Json;
};

/** An answer to an export: a status, or a status and the problem type or partial success it names. */
export type Answer = number | [number, string];

/**
 * Stands in for Telmoni: answers each export as told, 200 once the list runs out, naming the
 * project's content mode where the test gives one, and keeps every span it was sent and every
 * file put.
 */
export class Server {
  answers: Answer[] = [];
  contentMode: string | undefined;
  // Every export as sent, and the ones answered 2xx, which is what Telmoni holds.
  exports: Json[] = [];
  accepted: Json[] = [];
  bodies: string[] = [];
  // Each image a message carried, put apart from the exports: its URL, headers and bytes.
  uploads: Array<{ url: string; headers: Record<string, string>; body: Buffer }> = [];

  readonly transport: Transport = async (url, init) => {
    if (init.method === 'PUT') {
      this.uploads.push({ url, headers: init.headers, body: Buffer.from(init.body) });
      return answer(204, {}, '');
    }
    this.bodies.push(init.body);
    this.exports.push(JSON.parse(init.body) as Json);
    const given = this.answers.shift() ?? 200;
    const [status, text] = typeof given === 'number' ? [given, undefined] : given;
    if (status < 300) {
      // A success may carry a partial success, which the SDK reads line by line.
      this.accepted.push(this.exports.at(-1)!);
      const named: Record<string, string> = this.contentMode
        ? { 'Telmoni-Content-Mode': this.contentMode }
        : {};
      return answer(status, named, text ?? '{}');
    }
    // A refusal is problem details; the SDK reads the type off the message.
    return answer(status, {}, JSON.stringify({ message: `${text ?? '/errors/test'}: refused` }));
  };

  spans(): Span[] {
    const found: Span[] = [];
    for (const exported of this.accepted) {
      for (const resource of (exported.resourceSpans as Json[] | undefined) ?? []) {
        const resourceAttrs = attributes(
          ((resource.resource as Json | undefined)?.attributes as Json[] | undefined) ?? [],
        );
        for (const scope of (resource.scopeSpans as Json[] | undefined) ?? []) {
          for (const span of (scope.spans as Json[] | undefined) ?? []) {
            found.push({
              ...span,
              attrs: attributes((span.attributes as Json[] | undefined) ?? []),
              resource: resourceAttrs,
            } as Span);
          }
        }
      }
    }
    return found;
  }

  /** The run spans, in the order they were sent. */
  runs(): Span[] {
    return this.byAttr('gen_ai.operation.name', 'invoke_agent');
  }

  named(name: string): Span[] {
    return this.spans().filter((span) => span.name === name);
  }

  byAttr(key: string, value: unknown): Span[] {
    return this.spans().filter((span) => span.attrs[key] === value);
  }

  /** The model calls' spans, in the order they were sent. */
  models(): Span[] {
    return this.spans().filter((span) => 'gen_ai.request.model' in span.attrs);
  }
}

function answer(status: number, headers: Record<string, string>, body: string) {
  return {
    status,
    headers: {
      get: (name: string) =>
        Object.entries(headers).find(([key]) => key.toLowerCase() === name.toLowerCase())?.[1] ??
        null,
    },
    text: async () => body,
  };
}

export function attributes(raw: Json[]): Json {
  const out: Json = {};
  for (const item of raw) {
    const value = (item.value ?? {}) as Json;
    const key = item.key as string;
    if ('stringValue' in value) out[key] = value.stringValue;
    else if ('intValue' in value) out[key] = Number(value.intValue);
    else if ('boolValue' in value) out[key] = value.boolValue;
    else if ('doubleValue' in value) out[key] = value.doubleValue;
    else out[key] = value;
  }
  return out;
}

export interface RunOptions {
  event?: string;
  error?: string;
  busy?: boolean;
  env?: Record<string, string>;
}

/** Runs the worker as a hook would, against a state folder and a server of the test's. */
export class Hook {
  readonly stateDir: string;
  readonly env: Record<string, string>;
  readonly server = new Server();

  constructor(tmp: string) {
    this.stateDir = join(tmp, 'data');
    mkdirSync(this.stateDir);
    this.env = {
      CLAUDE_PLUGIN_DATA: this.stateDir,
      CLAUDE_PLUGIN_OPTION_TELMONI_API_KEY: KEY,
      CLAUDE_PLUGIN_OPTION_TELMONI_ENDPOINT: ENDPOINT,
    };
    const waits = { ...worker.waits };
    Object.assign(worker.waits, {
      settleQuietMs: 20,
      settleLimitMs: 100,
      settlePollMs: 10,
      stopMs: 300,
    });
    onTestFinished(() => void Object.assign(worker.waits, waits));
  }

  run(transcript: Transcript, options: RunOptions = {}): Promise<number> {
    const { event = 'Stop', error, busy = false, env = {} } = options;
    const payload = {
      sessionId: transcript.sessionId,
      transcriptPath: transcript.path,
      event,
      error,
      busy,
    };
    return worker.run(
      payload,
      { ...this.env, ...env },
      {
        transport: this.server.transport,
        sleep: async () => {},
      },
    );
  }

  state(sessionId: string): Json {
    const path = join(this.stateDir, `${sessionId}.json`);
    return existsSync(path) ? (JSON.parse(readFileSync(path, 'utf8')) as Json) : {};
  }

  log(): string {
    const path = join(this.stateDir, 'hook.log');
    return existsSync(path) ? readFileSync(path, 'utf8') : '';
  }

  /** Everything the plugin wrote to disk, for the secrets check. */
  kept(): string {
    return readdirSync(this.stateDir)
      .map((name) => join(this.stateDir, name))
      .filter((path) => statSync(path).isFile())
      .map((path) => readFileSync(path, 'utf8'))
      .join('');
  }
}

/** A hook and a transcript of the test's own, in a folder removed as it ends. */
export function setup(): { tmp: string; hook: Hook; transcript: Transcript } {
  const tmp = tempDir();
  return {
    tmp,
    hook: new Hook(tmp),
    transcript: new Transcript(join(tmp, 'projects', 'p', 'session-one.jsonl'), 'session-one'),
  };
}

/** A tool's result as the model call after it is given it. */
export function toolResponse(toolUseId: string): Json {
  return { type: 'tool_call_response', id: toolUseId, response: 'TOOL-OUTPUT-NEVER-SENT' };
}

export function assertMetadataOnly(...texts: string[]): void {
  for (const text of texts) {
    for (const secret of SECRETS) {
      expect(text.includes(secret), `${secret} left the transcript`).toBe(false);
    }
  }
}

type Tuple<T, N extends number, Got extends T[] = []> = Got['length'] extends N
  ? Got
  : Tuple<T, N, [...Got, T]>;

/** The items, which must be exactly `count`, typed for destructuring. */
export function unpack<T, N extends number>(items: readonly T[], count: N): Tuple<T, N> {
  expect(items).toHaveLength(count);
  return items as unknown as Tuple<T, N>;
}
