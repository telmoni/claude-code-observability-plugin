/**
 * A session's rows gathered into turns: a prompt, the replies, the tool calls and their results,
 * up to the next prompt. What a trace is made of, and nothing said unless the developer turned
 * content on.
 */

import * as t from './transcript.js';
import type { Part, Row, Subagent, ToolResult, Usage } from './transcript.js';

export interface Message {
  role: string;
  parts: Part[];
}

export interface ModelCall {
  model: string;
  start: Date;
  end: Date;
  usage: Usage | undefined;
  errorType: string | undefined;
  cancelled: boolean;
  // Read only with content on: the messages it was given, and its reply's parts in order.
  input: Message[] | undefined;
  output: Part[] | undefined;
}

export interface Compaction {
  start: Date;
  end: Date;
  // The summary it left, read only with content on.
  summary: Part[] | undefined;
}

export interface ToolCall {
  toolUseId: string;
  name: string;
  start: Date;
  end: Date | undefined;
  errorType: string | undefined;
  cancelled: boolean;
  skill: string | undefined;
  subagentType: string | undefined;
  // Started in the background: its notice or its report handed back, and the reply to it,
  // close the turn.
  background: boolean;
  agentId: string | undefined;
  notified: boolean;
  replied: boolean;
  // Its input and what came back, as recorded, read only with content on.
  arguments: unknown;
  result: unknown;
}

function later(a: Date, b: Date): Date {
  return b > a ? b : a;
}

export class Turn {
  modelCalls: ModelCall[] = [];
  toolCalls: ToolCall[] = [];
  compactions: Compaction[] = [];
  endedByInterruption = false;
  // Begun by a `Stop` hook that blocked, not by a prompt.
  continued = false;
  // Whether the last reply ended the model's turn.
  repliedLast = false;
  open = true;
  nextOffset = 0;
  // Whether the conversation is read, the developer's switch, and the prompt as it was.
  content = false;
  prompt: Part[] | undefined;
  // The tags asked for in the turn, each command's `key=value` words in order, and the folder
  // it started in, whose tags file is read for its tags alone.
  asked: string[] = [];
  folder: string | undefined;
  readonly toolsById = new Map<string, ToolCall>();
  readonly #modelsById = new Map<string, ModelCall>();
  // The calls the last result row answered: a refusal's marker right after names them.
  #answered: ToolCall[] = [];
  // Whether the last row taken was a reply: an interruption right after cuts it short.
  #replied = false;
  // The tool results since the last model call, the next one's input.
  #given: Part[] = [];
  // Kept once a model call follows: at the turn's end, one would depend on when the hook ran.
  #compacting: Compaction[] = [];

  constructor(
    readonly offset: number,
    readonly promptUuid: string,
    readonly start: Date,
    public end: Date,
    readonly version?: string,
  ) {}

  /** Take one row of the turn; gives the time the next row follows from. */
  feed(row: Row, last: Date): Date {
    const when = row.timestamp ?? last;
    if (row.type === 'assistant' && row.role === 'assistant') {
      this.#reply(row, last, when);
      return when;
    }
    if (row.type === 'user') {
      const results = t.toolResults(row);
      if (results.length > 0) {
        this.#results(row, results, when);
        return when;
      }
      const kind = t.interruption(row);
      if (kind !== undefined) {
        if (kind === 'tool') {
          for (const tool of this.#answered) {
            tool.cancelled = true;
            tool.errorType = undefined;
          }
        } else if (this.#replied && this.modelCalls.length > 0) {
          this.modelCalls.at(-1)!.cancelled = true;
        }
        this.#replied = false;
        this.endedByInterruption = true;
        this.#later(when);
        return when;
      }
    }
    return last;
  }

  #reply(row: Row, last: Date, when: Date): void {
    const key = t.messageId(row) ?? `row:${row.offset}`;
    let call = this.#modelsById.get(key);
    if (call === undefined) {
      call = {
        model: t.model(row) ?? 'unknown',
        start: last,
        end: when,
        usage: t.usage(row),
        errorType: undefined,
        cancelled: false,
        input: this.#input(),
        output: undefined,
      };
      this.#modelsById.set(key, call);
      this.modelCalls.push(call);
      this.compactions.push(...this.#compacting);
      this.#compacting = [];
    } else {
      call.end = later(call.end, when);
      call.usage = t.usage(row) ?? call.usage;
    }
    const kind = t.apiError(row);
    if (kind !== undefined) call.errorType = kind;
    const said = this.content ? t.replyParts(row) : [];
    if (said.length > 0) call.output = [...(call.output ?? []), ...said];
    const inputs = new Map<unknown, unknown>();
    for (const part of said) if (part.type === 'tool_call') inputs.set(part.id, part.arguments);
    for (const use of t.toolUses(row)) {
      if (use.tags !== undefined) this.asked.push(use.tags);
      const tool: ToolCall = {
        toolUseId: use.toolUseId,
        name: use.name,
        start: when,
        end: undefined,
        errorType: undefined,
        cancelled: false,
        skill: use.skill,
        subagentType: use.subagentType,
        background: use.background,
        agentId: undefined,
        notified: false,
        replied: false,
        arguments: inputs.get(use.toolUseId),
        result: undefined,
      };
      this.toolsById.set(use.toolUseId, tool);
      this.toolCalls.push(tool);
    }
    this.#answered = [];
    this.#replied = true;
    this.repliedLast = t.endedTurn(row);
    this.endedByInterruption = false;
    this.#later(when);
  }

  #results(row: Row, results: ToolResult[], when: Date): void {
    const agent = t.asyncAgent(row);
    const outputs = this.content ? t.toolOutputs(row) : new Map<string, unknown>();
    const answered: ToolCall[] = [];
    for (const result of results) {
      const tool = this.toolsById.get(result.toolUseId);
      if (tool === undefined) continue;
      tool.end = when;
      tool.cancelled = result.interrupted;
      tool.errorType = result.isError && !result.interrupted ? 'ToolError' : undefined;
      tool.result = outputs.get(result.toolUseId);
      if (tool.result !== undefined) {
        this.#given.push({ type: 'tool_call_response', id: tool.toolUseId, response: tool.result });
      }
      if (agent !== undefined) {
        tool.background = true;
        tool.agentId = agent;
      }
      answered.push(tool);
    }
    this.#answered = answered;
    this.#replied = false;
    this.#later(when);
  }

  /** What a new model call was given: the prompt to the turn's first, and to each after the tool results since the one before. */
  #input(): Message[] | undefined {
    const given = this.#given;
    this.#given = [];
    if (this.modelCalls.length === 0) {
      return this.prompt?.length ? [{ role: 'user', parts: this.prompt }] : undefined;
    }
    return given.length > 0 ? [{ role: 'tool', parts: given }] : undefined;
  }

  /**
   * Take a compaction's summary row: a step from the event before it, once a model call follows;
   * the turn's end waits on that call.
   */
  compacted(row: Row, last: Date): Date {
    const when = row.timestamp ?? last;
    const summary = this.content ? t.summaryParts(row) : undefined;
    this.#compacting.push({ start: last, end: when, summary });
    return when;
  }

  #later(when: Date): void {
    if (when > this.end) this.end = when;
  }
}

/**
 * The turns these rows hold, the last left open; a fork's rows copied from another session are
 * passed over, that session having recorded them.
 */
export function assemble(rows: Row[], sessionId: string, end: number, content = false): Turn[] {
  const turns: Turn[] = [];
  let current: Turn | undefined;
  let last = new Date();
  // Every tool call so far: a background task's notice can land in a later turn than its call.
  const tools = new Map<string, ToolCall>();
  for (const row of rows) {
    if (row.sessionId !== undefined && row.sessionId !== sessionId) continue;
    // A `Stop` hook that blocked carries the turn on with no prompt: a trace of its own.
    const continued = t.stopBlocked(row);
    if (continued || t.isPrompt(row)) {
      if (current !== undefined) {
        current.open = false;
        current.nextOffset = row.offset;
        turns.push(current);
      }
      const when = row.timestamp ?? last;
      current = new Turn(row.offset, row.uuid ?? `offset:${row.offset}`, when, when, row.version);
      current.continued = continued;
      current.content = content;
      current.prompt = content ? t.promptParts(row) : undefined;
      current.folder = row.cwd;
      const command = t.tagCommand(row);
      if (command !== undefined) current.asked.push(command);
      last = when;
      continue;
    }
    if (current !== undefined) {
      // The session's own compactions alone: a subagent's rows are read as they were.
      last = t.isCompactSummary(row) ? current.compacted(row, last) : current.feed(row, last);
      for (const [id, tool] of current.toolsById) tools.set(id, tool);
    }
    notice(row, tools);
  }
  if (current !== undefined) {
    current.nextOffset = end;
    turns.push(current);
  }
  return turns;
}

/**
 * A task's notice, or its subagent's report handed back, marks the background call it answers,
 * whichever lands first; the reply after it, in whatever turn, says the session went on.
 */
function notice(row: Row, tools: Map<string, ToolCall>): void {
  if (row.type === 'assistant') {
    for (const tool of tools.values()) {
      if (tool.notified) tool.replied = true;
    }
    return;
  }
  let named = t.notificationToolUseId(row);
  const agentId = named === undefined ? t.handbackAgent(row) : undefined;
  if (agentId !== undefined) {
    named = [...tools].find(([, tool]) => tool.agentId === agentId)?.[0];
  }
  const tool = named ? tools.get(named) : undefined;
  if (tool !== undefined && !tool.notified) {
    tool.notified = true;
    tool.replied = false;
  }
}

/** A subagent's whole transcript as one span of work, its first call given its task: its calls and when it ended. */
export function collect(
  rows: Row[],
  content = false,
  task?: Part[],
): { models: ModelCall[]; tools: ToolCall[]; ended: Date | undefined } {
  const first = rows.find((row) => row.timestamp !== undefined)?.timestamp;
  if (first === undefined) return { models: [], tools: [], ended: undefined };
  const work = new Turn(0, '', first, first);
  work.content = content;
  work.prompt = task;
  let last = first;
  for (const row of rows) last = work.feed(row, last);
  return { models: work.modelCalls, tools: work.toolCalls, ended: work.end };
}

/**
 * Whether the turn can still change: a background subagent not yet answered and replied to, or
 * not yet finished, keeps it waiting; the session's end sends it as is.
 */
export function isComplete(
  turn: Turn,
  event: string,
  busy: boolean,
  subagents: ReadonlyMap<string, Subagent>,
): boolean {
  if (event === 'SessionEnd') return true;
  for (const tool of turn.toolCalls) {
    if (tool.background && !(tool.notified && tool.replied)) return false;
    if (subagents.get(tool.toolUseId)?.finished === false) return false;
  }
  // The hook that blocked can return inside the worker's wait, so the run it began is read under
  // way at the very Stop it followed.
  const ended = turn.repliedLast || turn.endedByInterruption;
  if (event === 'Stop' && turn.open && turn.continued && !ended) return false;
  return !(turn.open && busy);
}

/** What ended the turn in error: the last reply's API error, or the failure the hook names. */
export function errorType(
  turn: Turn,
  event: string,
  payloadError: string | undefined,
): string | undefined {
  const lastCall = turn.modelCalls.at(-1);
  if (lastCall?.errorType) return lastCall.errorType;
  if (turn.open && event === 'StopFailure') return payloadError || 'unknown';
  return undefined;
}
