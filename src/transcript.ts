/**
 * Reading a session's transcript: its rows from a byte offset, and of each row only its kind,
 * ids, times, counts and flags. A prompt's first characters are read for the markers Claude Code
 * writes there, and never kept; its folder only to find the tags file above it, and the plugin's
 * own tag command and skill for the tags asked for. The conversation itself is read only where
 * the developer turned content on.
 */

import {
  closeSync,
  existsSync,
  openSync,
  readFileSync,
  readSync,
  readdirSync,
  statSync,
} from 'node:fs';
import { join, parse, sep } from 'node:path';

import * as names from './names.js';
import { cut, within } from './text.js';

export const INTERRUPTED = '[Request interrupted by user';
export const INTERRUPTED_TOOL = '[Request interrupted by user for tool use]';
export const NOTIFICATION = '<task-notification>';
const NOT_A_PROMPT = ['<local-command-stdout>', '<local-command-caveat>', '<system-reminder>'];
// The plugin's own skill, typed as `/telmoni-observability:tag repo=x` or called by the agent.
export const TAG_SKILL = 'telmoni-observability:tag';
const TAG_COMMAND = `<command-name>/${TAG_SKILL}</command-name>`;
const HEAD = 64;
// The room a typed command's markers take at a row's head, in either order.
const TAG_LOOK = 256;
// Rows Claude Code writes in the person's place: injected context, a compaction's summary,
// its own nudges, a subagent's side of the conversation.
const NOT_A_PERSONS = ['isMeta', 'isCompactSummary', 'turnCompanion', 'isSidechain'];

export type Json = Record<string, unknown>;
/** A part of a message, as the GenAI conventions carry it: read only with content on. */
export type Part = Record<string, unknown>;

export function isObject(value: unknown): value is Json {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function nonEmpty(value: unknown): string | undefined {
  return typeof value === 'string' && value !== '' ? value : undefined;
}

/** Whether a value says anything: a string with more than whitespace. */
function says(value: unknown): value is string {
  return typeof value === 'string' && /\S/.test(value);
}

/** A flag as a writer of any kind may set it: an empty string, list or object sets nothing. */
export function truthy(value: unknown): boolean {
  if (Array.isArray(value)) return value.length > 0;
  if (isObject(value)) return Object.keys(value).length > 0;
  return Boolean(value);
}

// Bad bytes are no row, rather than a row of replacement characters; a byte-order mark stays, so
// JSON refuses it.
const UTF8 = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true });

export class Row {
  constructor(
    readonly offset: number,
    readonly data: Json,
  ) {}

  get type(): string | undefined {
    return typeof this.data.type === 'string' ? this.data.type : undefined;
  }

  get message(): Json | undefined {
    return isObject(this.data.message) ? this.data.message : undefined;
  }

  get role(): string | undefined {
    const role = this.message?.role;
    return typeof role === 'string' ? role : undefined;
  }

  get timestamp(): Date | undefined {
    return parseTimestamp(this.data.timestamp);
  }

  get uuid(): string | undefined {
    return nonEmpty(this.data.uuid);
  }

  get sessionId(): string | undefined {
    return nonEmpty(this.data.sessionId);
  }

  get version(): string | undefined {
    return nonEmpty(this.data.version);
  }

  /** The folder Claude Code wrote the row in: its tags file's, never kept or sent. */
  get cwd(): string | undefined {
    return nonEmpty(this.data.cwd);
  }
}

export interface Read {
  rows: Row[];
  end: number;
  restarted: boolean;
}

/**
 * The whole rows from byte `start`, each with its offset, and where the next read begins; a file
 * shorter than `start` was replaced, and is read from its beginning.
 */
export function readRows(path: string, start: number): Read {
  const restarted = statSync(path).size < start;
  if (restarted) start = 0;
  const chunk = readFrom(path, start);
  const rows: Row[] = [];
  let position = start;
  for (let from = 0; ;) {
    const newline = chunk.indexOf(10, from);
    // What follows the last newline is a row still being written.
    if (newline < 0) break;
    const line = chunk.subarray(from, newline);
    const offset = position;
    position += line.length + 1;
    from = newline + 1;
    let data: unknown;
    try {
      data = JSON.parse(UTF8.decode(line));
    } catch {
      continue;
    }
    if (isObject(data)) rows.push(new Row(offset, data));
  }
  return { rows, end: position, restarted };
}

function readFrom(path: string, start: number): Buffer {
  const fd = openSync(path, 'r');
  try {
    const chunks: Buffer[] = [];
    for (let position = start; ;) {
      const buffer = Buffer.allocUnsafe(1 << 20);
      const read = readSync(fd, buffer, 0, buffer.length, position);
      if (read === 0) break;
      chunks.push(buffer.subarray(0, read));
      position += read;
    }
    return Buffer.concat(chunks);
  } finally {
    closeSync(fd);
  }
}

const ISO =
  /^(\d{4})-(\d{2})-(\d{2})(?:[Tt ](\d{2})(?::(\d{2})(?::(\d{2})(?:[.,](\d{1,9}))?)?)?)?(?:[Zz]|([+-])(\d{2})(?::?(\d{2}))?)?$/;
const DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/** An ISO 8601 time, read as UTC where it names no zone; anything else, or a day no calendar has, is none. */
export function parseTimestamp(value: unknown): Date | undefined {
  if (typeof value !== 'string') return undefined;
  const found = ISO.exec(value);
  if (found === null) return undefined;
  const [year, month, day, hour, minute, second, , , zoneHour, zoneMinute] = found
    .slice(1)
    .map((part) => Number(part ?? 0));
  const leap = year! % 4 === 0 && (year! % 100 !== 0 || year! % 400 === 0);
  const days = month === 2 && leap ? 29 : DAYS[month! - 1];
  if (year! < 1 || days === undefined || day! < 1 || day! > days) return undefined;
  if (hour! > 23 || minute! > 59 || second! > 59 || zoneHour! > 23 || zoneMinute! > 59) {
    return undefined;
  }
  // Not `Date.UTC`, which reads a year below 100 as one of the 1900s.
  const when = new Date(0);
  when.setUTCFullYear(year!, month! - 1, day!);
  when.setUTCHours(hour!, minute!, second!, Number((found[7] ?? '').padEnd(3, '0').slice(0, 3)));
  const offset = (found[8] === '-' ? -1 : 1) * (zoneHour! * 60 + zoneMinute!);
  return new Date(when.getTime() - offset * 60_000);
}

function content(row: Row): unknown {
  return row.message?.content;
}

function textOf(row: Row): string {
  const given = content(row);
  if (typeof given === 'string') return given;
  if (Array.isArray(given)) {
    // The first text block that says anything: an image comes behind an empty one.
    for (const block of given) {
      if (isObject(block) && block.type === 'text' && says(block.text)) return block.text;
    }
  }
  return '';
}

function blockTypes(row: Row): Set<string> {
  const given = content(row);
  if (!Array.isArray(given)) return new Set();
  return new Set(
    given.flatMap((block) =>
      isObject(block) && typeof block.type === 'string' ? [block.type] : [],
    ),
  );
}

/** Where Claude Code says a user row came from: the person, a task's notice, a peer. */
export function originKind(row: Row): string | undefined {
  const origin = row.data.origin;
  return isObject(origin) && typeof origin.kind === 'string' ? origin.kind : undefined;
}

/** A row's first characters past its leading whitespace, cut before the rest is ever copied. */
function opening(text: string, max: number): string {
  const start = text.search(/\S/);
  return start < 0 ? '' : cut(text.slice(start, start + 2 * max), max);
}

/** The first characters of what a user row says, for its markers alone. */
export function head(row: Row): string {
  return opening(textOf(row), HEAD);
}

export interface ToolResult {
  toolUseId: string;
  isError: boolean;
  interrupted: boolean;
}

export function toolResults(row: Row): ToolResult[] {
  const given = content(row);
  if (!Array.isArray(given)) return [];
  const toolUse = row.data.toolUseResult;
  const interrupted = isObject(toolUse) && toolUse.interrupted === true;
  const results: ToolResult[] = [];
  for (const block of given) {
    if (isObject(block) && block.type === 'tool_result') {
      const toolUseId = nonEmpty(block.tool_use_id);
      if (toolUseId !== undefined) {
        results.push({ toolUseId, isError: block.is_error === true, interrupted });
      }
    }
  }
  return results;
}

/**
 * A prompt the person gave: not Claude Code's own rows, its injected context, a compaction's
 * summary, a tool's result, a task's notice or an interruption. An image alone is one, known by
 * the row's origin or by the image.
 */
export function isPrompt(row: Row): boolean {
  if (row.type !== 'user' || row.role !== 'user') return false;
  if (NOT_A_PERSONS.some((flag) => truthy(row.data[flag]))) return false;
  if (toolResults(row).length > 0) return false;
  const first = head(row);
  if ([INTERRUPTED, NOTIFICATION, ...NOT_A_PROMPT].some((marker) => first.startsWith(marker))) {
    return false;
  }
  return first !== '' || originKind(row) === 'human' || blockTypes(row).has('image');
}

/**
 * What the developer typed after the plugin's tag command, read off its markers; a prompt that
 * is not that command is read no further than the markers' room at its head.
 */
export function tagCommand(row: Row): string | undefined {
  if (row.type !== 'user') return undefined;
  const text = textOf(row);
  const markers = opening(text, TAG_LOOK);
  if (!markers.startsWith('<command-name>') && !markers.startsWith('<command-message>')) {
    return undefined;
  }
  if (!markers.includes(TAG_COMMAND)) return undefined;
  const start = text.indexOf('<command-args>');
  const end = start < 0 ? -1 : text.indexOf('</command-args>', start);
  return start >= 0 && start < end ? text.slice(start + '<command-args>'.length, end) : '';
}

/** `tool` for a denied tool call, `turn` for a stopped turn, else none. */
export function interruption(row: Row): 'tool' | 'turn' | undefined {
  if (row.type !== 'user' || row.role !== 'user') return undefined;
  const first = head(row);
  if (first.startsWith(INTERRUPTED_TOOL)) return 'tool';
  if (first.startsWith(INTERRUPTED)) return 'turn';
  return undefined;
}

/** The tool call a background task's notice answers, read off its tags. */
export function notificationToolUseId(row: Row): string | undefined {
  if (row.type !== 'user') return undefined;
  if (originKind(row) !== 'task-notification' && !head(row).startsWith(NOTIFICATION)) {
    return undefined;
  }
  const text = textOf(row);
  const start = text.indexOf('<tool-use-id>');
  const end = start >= 0 ? text.indexOf('</tool-use-id>', start + 13) : -1;
  if (start < 0 || end < 0) return undefined;
  return text.slice(start + 13, end).trim() || undefined;
}

/** The subagent whose final report a row hands back, read off its origin, never the report. */
export function handbackAgent(row: Row): string | undefined {
  const origin = row.data.origin;
  if (row.type !== 'user' || !isObject(origin) || origin.kind !== 'peer') return undefined;
  return origin.handback === true ? nonEmpty(origin.from) : undefined;
}

/** The id of a subagent a tool result says runs in the background (empty where it names none), else none. */
export function asyncAgent(row: Row): string | undefined {
  const toolUse = row.data.toolUseResult;
  if (!isObject(toolUse)) return undefined;
  const launched = toolUse.status === 'async_launched' || toolUse.status === 'teammate_spawned';
  if (!launched && toolUse.isAsync !== true) return undefined;
  return typeof toolUse.agentId === 'string' ? toolUse.agentId : '';
}

/** The summary a compaction leaves, which Claude Code writes as a user row of its own. */
export function isCompactSummary(row: Row): boolean {
  return row.type === 'user' && row.data.isCompactSummary === true;
}

/** Claude Code's mark that a `Stop` hook blocked, so the turn goes on with no prompt. */
export function stopBlocked(row: Row): boolean {
  const attachment = row.type === 'attachment' ? row.data.attachment : undefined;
  return (
    isObject(attachment) &&
    attachment.type === 'hook_blocking_error' &&
    attachment.hookEvent === 'Stop'
  );
}

/** Whether a reply is the model's last of its turn, not one that waits on a tool. */
export function endedTurn(row: Row): boolean {
  const reason = row.message?.stop_reason;
  return typeof reason === 'string' && reason !== 'tool_use' && reason !== 'pause_turn';
}

export function messageId(row: Row): string | undefined {
  return nonEmpty(row.message?.id);
}

export function model(row: Row): string | undefined {
  const value = nonEmpty(row.message?.model);
  return value === undefined ? undefined : names.model(value);
}

export interface Usage {
  input: number | undefined;
  output: number | undefined;
  cacheRead: number | undefined;
  cacheWrite: number | undefined;
}

export function usage(row: Row): Usage | undefined {
  const raw = row.message?.usage;
  if (!isObject(raw)) return undefined;
  let write: number | undefined;
  if (isObject(raw.cache_creation)) {
    const parts = Object.values(raw.cache_creation).flatMap((value) => count(value) ?? []);
    write = parts.length > 0 ? parts.reduce((sum, value) => sum + value, 0) : undefined;
  }
  write ??= count(raw.cache_creation_input_tokens);
  // Anthropic leaves the cache out of `input_tokens`; the conventions' input holds it.
  const uncached = count(raw.input_tokens);
  const read = count(raw.cache_read_input_tokens);
  const counted = [uncached, read, write].filter((n) => n !== undefined);
  return {
    input: counted.length > 0 ? counted.reduce((sum, value) => sum + value, 0) : undefined,
    output: count(raw.output_tokens),
    cacheRead: read,
    cacheWrite: write,
  };
}

function count(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : undefined;
}

/** An error's kind (`rate_limit`): a short word, never a message. */
export function errorKind(value: unknown): string | undefined {
  return typeof value === 'string' && value !== '' && within(value, 64) && !value.includes(' ')
    ? value
    : undefined;
}

/** The kind of API error a reply row carries (`rate_limit`), never its message. */
export function apiError(row: Row): string | undefined {
  if (row.data.isApiErrorMessage !== true) return undefined;
  return errorKind(row.data.error) ?? 'ApiError';
}

export interface ToolUse {
  toolUseId: string;
  name: string;
  skill: string | undefined;
  subagentType: string | undefined;
  background: boolean;
  /** What the agent asked the plugin's tag skill to set: its one input read beyond a name. */
  tags: string | undefined;
}

/**
 * Each tool call a reply row makes: its id and name, a skill's name, a subagent's kind, and the
 * tags the plugin's own skill was asked for.
 */
export function toolUses(row: Row): ToolUse[] {
  const given = content(row);
  if (!Array.isArray(given)) return [];
  const uses: ToolUse[] = [];
  for (const block of given) {
    if (!isObject(block) || block.type !== 'tool_use') continue;
    const toolUseId = nonEmpty(block.id);
    const name = block.name;
    if (toolUseId === undefined || typeof name !== 'string') continue;
    const input = isObject(block.input) ? block.input : {};
    const agent = name === 'Agent' || name === 'Task';
    const tagged = name === 'Skill' && input.skill === TAG_SKILL;
    uses.push({
      toolUseId,
      name: names.tool(name),
      skill: name === 'Skill' ? names.kind(input.skill) : undefined,
      subagentType: agent ? names.kind(input.subagent_type) : undefined,
      background: agent && input.run_in_background === true,
      tags: tagged && typeof input.args === 'string' ? input.args : undefined,
    });
  }
  return uses;
}

export interface Subagent {
  toolUseId: string;
  agentType: string | undefined;
  finished: boolean | undefined;
  path: string;
}

export function subagentsDir(transcriptPath: string): string {
  const { dir, name } = parse(transcriptPath);
  return join(dir, name, 'subagents');
}

/** The session's subagent transcripts by the tool call that started each. */
export function discoverSubagents(transcriptPath: string): Map<string, Subagent> {
  const folder = subagentsDir(transcriptPath);
  const found = new Map<string, Subagent>();
  let listed: string[];
  try {
    if (!statSync(folder).isDirectory()) return found;
    listed = readdirSync(folder, { recursive: true, encoding: 'utf8' });
  } catch {
    return found;
  }
  // By their path's parts in order, so a meta file naming the same call twice ends the same way.
  const metas = listed.filter((name) => name.endsWith('.meta.json')).sort(byParts);
  for (const name of metas) {
    const metaPath = join(folder, name);
    let meta: unknown;
    try {
      meta = JSON.parse(UTF8.decode(readFileSync(metaPath)));
    } catch {
      continue;
    }
    const toolUseId = isObject(meta) ? nonEmpty(meta.toolUseId) : undefined;
    if (!isObject(meta) || toolUseId === undefined) continue;
    const rowsPath = `${metaPath.slice(0, -'.meta.json'.length)}.jsonl`;
    if (!existsSync(rowsPath)) continue;
    found.set(toolUseId, {
      toolUseId,
      agentType: names.kind(meta.agentType),
      finished: typeof meta.finished === 'boolean' ? meta.finished : undefined,
      path: rowsPath,
    });
  }
  return found;
}

function byParts(a: string, b: string): number {
  const left = a.split(sep);
  const right = b.split(sep);
  for (let i = 0; i < Math.min(left.length, right.length); i++) {
    if (left[i] !== right[i]) return left[i]! < right[i]! ? -1 : 1;
  }
  return left.length - right.length;
}

// The conversation itself, as the GenAI conventions' parts: read only with content on.

/** What the person's prompt says: its text, and each image as a blob of its bytes. */
export function promptParts(row: Row): Part[] {
  let given = content(row);
  if (typeof given === 'string') given = [{ type: 'text', text: given }];
  const parts: Part[] = [];
  for (const block of Array.isArray(given) ? given : []) {
    if (!isObject(block)) continue;
    const source = block.source;
    if (block.type === 'text' && says(block.text)) {
      parts.push({ type: 'text', content: block.text });
    } else if (
      block.type === 'image' &&
      isObject(source) &&
      source.type === 'base64' &&
      says(source.data)
    ) {
      const image: Part = { type: 'blob', modality: 'image', content: source.data };
      if (says(source.media_type)) image.mime_type = source.media_type;
      parts.push(image);
    }
  }
  return parts;
}

/** What a compaction's summary says: its text, read as a prompt's is. */
export function summaryParts(row: Row): Part[] {
  return promptParts(row).filter((part) => part.type === 'text');
}

/** What a reply row says: thinking written in plain text, never a redacted block, its text, and each tool call with its input. */
export function replyParts(row: Row): Part[] {
  const given = content(row);
  const parts: Part[] = [];
  for (const block of Array.isArray(given) ? given : []) {
    if (!isObject(block)) continue;
    if (block.type === 'thinking' && says(block.thinking)) {
      parts.push({ type: 'reasoning', content: block.thinking });
    } else if (block.type === 'text' && says(block.text)) {
      parts.push({ type: 'text', content: block.text });
    } else if (block.type === 'tool_use' && says(block.id) && typeof block.name === 'string') {
      const call: Part = { type: 'tool_call', id: block.id, name: block.name };
      if (Object.hasOwn(block, 'input')) call.arguments = block.input;
      parts.push(call);
    }
  }
  return parts;
}

/**
 * What each tool result in a row says, by its call: its text, or the blocks it was; never Claude
 * Code's own record of the result, `toolUseResult`, which names files.
 */
export function toolOutputs(row: Row): Map<string, unknown> {
  const given = content(row);
  const outputs = new Map<string, unknown>();
  for (const block of Array.isArray(given) ? given : []) {
    if (isObject(block) && block.type === 'tool_result') {
      const output = block.content;
      if (says(block.tool_use_id) && (typeof output === 'string' || Array.isArray(output))) {
        outputs.set(block.tool_use_id, output);
      }
    }
  }
  return outputs;
}

/** A subagent's task: the prompt its launching call gave it. */
export function subagentTask(input: unknown): string | undefined {
  const task = isObject(input) ? input.prompt : undefined;
  return says(task) ? task : undefined;
}
