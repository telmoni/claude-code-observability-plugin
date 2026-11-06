/** A turn as the run it is recorded as, in plain values that keep in a file. */

import { createHash } from 'node:crypto';

import { TAGS_MAX, type Tags } from './tags.js';
import { type Part, type Row, type Subagent, subagentTask } from './transcript.js';
import {
  type Compaction,
  type Message,
  type ModelCall,
  type ToolCall,
  type Turn,
  collect,
  errorType,
} from './turns.js';

export const AGENT = 'claude-code';
const NAMESPACE_URL = '6ba7b811-9dad-11d1-80b4-00c04fd430c8';
export const NAMESPACE = uuid5(NAMESPACE_URL, 'https://telmoni.com/claude-observability-plugin');
export const TAG_MAX = 256;
// How deep the SDK nests steps, the run's own at 1: a record past it would be refused whole.
export const STEP_DEPTH_MAX = 16;

// The state file's own shape, its keys as it has always written them.
export interface PlainRun {
  run_id: string;
  agent: string;
  start: string;
  end: string;
  session_id: string;
  release: string | null;
  tags: Record<string, string>;
  error_type: string | null;
  cancelled: boolean;
  calls: PlainCall[];
  input_messages?: Message[];
  output_messages?: Message[];
}

export type PlainCall = PlainModel | PlainStep | PlainTool;

export interface PlainModel {
  kind: 'model';
  model: string;
  provider: string;
  start: string;
  end: string;
  usage: {
    input: number | null;
    output: number | null;
    cache_read: number | null;
    cache_write: number | null;
  } | null;
  error_type: string | null;
  cancelled: boolean;
  input_messages?: Message[];
  output_messages?: Message[];
}

export interface PlainStep {
  kind: 'step';
  name: string;
  start: string;
  end: string;
  error_type: string | null;
  cancelled: boolean;
  calls?: PlainCall[];
  input_messages?: Message[];
  output_messages?: Message[];
}

export interface PlainTool {
  kind: 'tool';
  name: string;
  start: string;
  end: string;
  error_type: string | null;
  cancelled: boolean;
  arguments?: unknown;
  result?: unknown;
}

function uuid5(namespace: string, name: string): string {
  const bytes = createHash('sha1')
    .update(Buffer.from(namespace.replaceAll('-', ''), 'hex'))
    .update(name, 'utf8')
    .digest()
    .subarray(0, 16);
  bytes[6] = (bytes[6]! & 0x0f) | 0x50;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** One id for a turn however often it is sent, from the session and the prompt. */
export function runId(sessionId: string, promptUuid: string): string {
  return uuid5(NAMESPACE, `${sessionId}:${promptUuid}`);
}

export interface BuildOptions {
  sessionId: string;
  event: string;
  payloadError?: string | undefined;
  subagents?: ReadonlyMap<string, Subagent>;
  read?: (known: Subagent) => Row[];
  provider?: string;
  tags?: Tags;
  note?: (text: string) => void;
}

type Expand = (tool: ToolCall, end: Date, depth: number) => PlainCall;

export function build(turn: Turn, options: BuildOptions): PlainRun {
  const { sessionId, event, payloadError, subagents = new Map(), read = () => [] } = options;
  const { provider = 'anthropic', tags = new Map(), note = () => {} } = options;
  const calls: PlainCall[] = turn.modelCalls.map((call) => model(call, provider));
  calls.push(...turn.compactions.map(compaction));
  const skills: string[] = [];
  // A subagent is expanded once a run, so a meta naming a call of its own transcript ends.
  const expanded = new Set<string>();

  /** A call as the step of the subagent it started, as deep as the SDK nests steps. */
  const expand: Expand = (tool, end, depth) => {
    const known = subagents.get(tool.toolUseId);
    if (known === undefined || depth > STEP_DEPTH_MAX || expanded.has(tool.toolUseId)) {
      return plainTool(tool, end);
    }
    expanded.add(tool.toolUseId);
    return step(tool, known, read(known), provider, turn.content, expand, depth);
  };

  for (const tool of turn.toolCalls) {
    if (tool.skill && !skills.includes(tool.skill)) skills.push(tool.skill);
    calls.push(expand(tool, turn.end, 1));
  }
  byStart(calls);
  const made: PlainRun = {
    run_id: runId(sessionId, turn.promptUuid),
    agent: AGENT,
    start: iso(turn.start),
    end: iso(turn.end),
    session_id: sessionId,
    release: turn.version ?? null,
    tags: runTags(skills, tags, note),
    error_type: errorType(turn, event, payloadError) ?? null,
    cancelled: turn.endedByInterruption,
    calls,
  };
  if (turn.prompt?.length) made.input_messages = message('user', turn.prompt);
  const last = turn.modelCalls.at(-1)?.output;
  if (last?.length) made.output_messages = message('assistant', last);
  return made;
}

/** Parts as the one message the conventions carry them in. */
function message(role: string, parts: Part[]): Message[] {
  return [{ role, parts }];
}

/** The run's tags: the skills it ran, then the developer's, as many as ingest keeps. */
function runTags(
  skills: string[],
  given: Tags,
  note: (text: string) => void,
): Record<string, string> {
  const tags = new Map<string, string>();
  if (skills.length > 0) tags.set('skills', joinSkills(skills));
  for (const [key, value] of given) {
    if (tags.size === TAGS_MAX) {
      note('tags past 32 dropped');
      break;
    }
    tags.set(key, value);
  }
  // From its entries, so a key such as `__proto__` is a tag like any other.
  return Object.fromEntries(tags);
}

function joinSkills(names: string[]): string {
  let joined = names.join(',');
  while (joined.length > TAG_MAX && joined.includes(',')) {
    joined = joined.slice(0, joined.lastIndexOf(','));
  }
  return joined.slice(0, TAG_MAX);
}

/** Ordered by start, ties as they came. */
function byStart(calls: PlainCall[]): void {
  calls.sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0));
}

function model(call: ModelCall, provider: string): PlainModel {
  const usage = call.usage;
  const made: PlainModel = {
    kind: 'model',
    model: call.model,
    provider,
    start: iso(call.start),
    end: iso(latest(call.end, call.start)),
    usage:
      usage === undefined
        ? null
        : {
            input: usage.input ?? null,
            output: usage.output ?? null,
            cache_read: usage.cacheRead ?? null,
            cache_write: usage.cacheWrite ?? null,
          },
    error_type: call.errorType ?? null,
    cancelled: call.cancelled,
  };
  if (call.input?.length) made.input_messages = call.input;
  if (call.output?.length) made.output_messages = message('assistant', call.output);
  return made;
}

function compaction(compacted: Compaction): PlainStep {
  const made: PlainStep = {
    kind: 'step',
    name: 'compaction',
    start: iso(compacted.start),
    end: iso(latest(compacted.end, compacted.start)),
    error_type: null,
    cancelled: false,
  };
  if (compacted.summary?.length) made.output_messages = message('assistant', compacted.summary);
  return made;
}

function plainTool(tool: ToolCall, turnEnd: Date): PlainTool {
  const end = tool.end ?? turnEnd;
  const made: PlainTool = {
    kind: 'tool',
    name: tool.name,
    start: iso(tool.start),
    end: iso(latest(end, tool.start)),
    error_type: tool.errorType ?? null,
    // A call never answered was stopped with the turn.
    cancelled: tool.cancelled || tool.end === undefined,
  };
  if (tool.arguments != null) made.arguments = tool.arguments;
  if (tool.result != null) made.result = tool.result;
  return made;
}

function step(
  tool: ToolCall,
  known: Subagent,
  rows: Row[],
  provider: string,
  content: boolean,
  expand: Expand,
  depth: number,
): PlainStep {
  const task = subagentTask(tool.arguments);
  const asked: Part[] | undefined = task ? [{ type: 'text', content: task }] : undefined;
  const { models, tools, ended } = collect(rows, content, asked);
  const end = [tool.end, ended].reduce<Date>(
    (latestSoFar, when) => (when !== undefined ? latest(latestSoFar, when) : latestSoFar),
    tool.start,
  );
  const inner: PlainCall[] = models.map((call) => model(call, provider));
  inner.push(...tools.map((call) => expand(call, end, depth + 1)));
  byStart(inner);
  const kind = tool.subagentType ?? known.agentType;
  const made: PlainStep = {
    kind: 'step',
    name: kind ? `subagent ${kind}` : 'subagent',
    start: iso(tool.start),
    end: iso(latest(end, tool.start)),
    error_type: tool.errorType ?? null,
    cancelled: tool.cancelled || tool.end === undefined,
    calls: inner,
  };
  if (asked) made.input_messages = message('user', asked);
  // Its answer is its own last reply, whether it ran in the foreground or the background.
  const answer = models.at(-1)?.output;
  if (answer?.length) made.output_messages = message('assistant', answer);
  return made;
}

function latest(a: Date, b: Date): Date {
  return b > a ? b : a;
}

function iso(when: Date): string {
  return when.toISOString();
}
