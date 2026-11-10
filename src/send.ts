/**
 * Sending a trace to Telmoni through the SDK, and reading from its warnings whether the trace
 * arrived, was refused for good, or should be sent again.
 */

import {
  type CallRecord,
  QueueFullError,
  type StepRecord,
  Telmoni,
  type TraceRecord,
  type Transport,
  type Warning,
} from 'telmoni';

import type { Log } from './log.js';
import type { PlainCall, PlainTrace } from './record.js';
import type { Settings } from './settings.js';
import { isObject, parseTimestamp, truthy } from './transcript.js';

// What became of the spans a warning is about, by the SDK's kind: not delivered, so the trace is
// kept, or taken without something it held.
const UNDELIVERED: ReadonlySet<string> = new Set(['failed', 'export_error', 'queue_full']);
const PARTIAL: ReadonlySet<string> = new Set([
  'dropped',
  'span_refused',
  'said',
  'too_large',
  'trimmed',
  'upload_failed',
]);
// Refused for what the trace holds, for the organization's standing, or for a fault of Telmoni's
// own that a second try would meet again.
const FINAL_STATUSES: ReadonlySet<number> = new Set([400, 402, 413, 500]);
const DATABASE_FAILED = '/errors/internal/database';

export type Outcome = 'sent' | 'partial' | 'refused' | 'undelivered';

export interface Verdict {
  outcome: Outcome;
  detail: string;
}

/** A warning the SDK gave, as data, and its words. */
export type Heard = [warning: Warning, text: string];

/**
 * What the SDK's warnings say happened to the trace: the kind, status and problem type deciding,
 * the words logged.
 */
export function judge(warnings: readonly Heard[], flushed: boolean): Verdict {
  // Anything not delivered keeps the trace, whatever else was refused beside it.
  for (const [warning, text] of warnings) {
    if (UNDELIVERED.has(warning.kind) || keptRefusal(warning)) {
      return { outcome: 'undelivered', detail: text };
    }
  }
  if (!flushed) return { outcome: 'undelivered', detail: 'the flush timed out' };
  const refused = warnings.find(([warning]) => warning.kind === 'refused');
  if (refused) return { outcome: 'refused', detail: refused[1] };
  const partial = warnings.find(([warning]) => PARTIAL.has(warning.kind));
  if (partial) return { outcome: 'partial', detail: partial[1] };
  return { outcome: 'sent', detail: '' };
}

/** A refusal a second try may get past: not one of the final statuses, or Telmoni's database. */
function keptRefusal({ kind, status, problemType }: Warning): boolean {
  return (
    kind === 'refused' &&
    status !== undefined &&
    (!FINAL_STATUSES.has(status) || (status === 500 && problemType === DATABASE_FAILED))
  );
}

/** What a test stands in for: the SDK's transport, and its wait between attempts. */
export interface SendHooks {
  transport?: Transport | undefined;
  sleep?: ((seconds: number, signal: AbortSignal) => Promise<void>) | undefined;
}

/** One SDK client a trace, so each trace's warnings are its own. */
export class Sender {
  constructor(
    readonly settings: Settings,
    readonly log: Log,
    readonly session: string,
    readonly event: string,
    readonly hooks: SendHooks = {},
  ) {}

  async send(record: PlainTrace, warned: Record<string, boolean>): Promise<Verdict> {
    let built: TraceRecord;
    try {
      built = toSdk(record);
    } catch (fault) {
      // A kept record of another shape: dropped and named, so the session's later traces go.
      return { outcome: 'refused', detail: `the record did not build: ${nameOf(fault)}` };
    }
    const heard: Heard[] = [];
    let client: Telmoni;
    try {
      client = new Telmoni(
        {
          endpoint: this.settings.endpoint,
          apiKey: this.settings.apiKey,
          captureContent: this.settings.captureContent,
          scrubSecrets: this.settings.scrubSecrets,
          scrubPii: this.settings.scrubPii,
          release: typeof record.release === 'string' ? record.release : undefined,
        },
        {
          transport: this.hooks.transport,
          sleep: this.hooks.sleep,
          warn: (text, warning) => void heard.push([warning, text]),
          // The trace's own client: its queue takes the trace whole, however long the turn.
          processor: { maxQueueSize: Number.POSITIVE_INFINITY },
        },
      );
    } catch (refusal) {
      if (!(refusal instanceof TypeError)) throw refusal;
      // The SDK's own words name at most the host, never the key.
      if (!warned.endpoint) {
        warned.endpoint = true;
        this.log.line(this.session, this.event, `endpoint refused: ${refusal.message}`);
      }
      return { outcome: 'undelivered', detail: 'endpoint refused' };
    }
    let flushed: boolean;
    try {
      try {
        client.recordTrace(built);
      } catch (fault) {
        if (fault instanceof QueueFullError) {
          return { outcome: 'refused', detail: "more spans than the SDK's queue holds" };
        }
        if (fault instanceof TypeError || fault instanceof RangeError) {
          return { outcome: 'refused', detail: `the SDK refused the trace: ${fault.message}` };
        }
        throw fault;
      }
      // As long as the SDK's own attempts take, however many batches the trace makes.
      flushed = await client.flush(Number.POSITIVE_INFINITY);
    } finally {
      // Whatever happened, the client's exporter ends with it, so the worker can exit.
      await client.shutdown();
    }
    return judge(heard, flushed);
  }
}

function nameOf(fault: unknown): string {
  return fault instanceof Error ? fault.name : typeof fault;
}

function need(given: unknown, field: string): unknown {
  if (!isObject(given) || given[field] === undefined || given[field] === null) {
    throw new TypeError(`no ${field}`);
  }
  return given[field];
}

function needString(given: unknown, field: string): string {
  const value = need(given, field);
  if (typeof value !== 'string') throw new TypeError(`${field} is not a string`);
  return value;
}

/** A kept time as ISO 8601 alone: `Date` would take a day no calendar has, or any text it can guess at. */
function when(given: unknown, field: string): Date {
  const value = parseTimestamp(needString(given, field));
  if (value === undefined) throw new RangeError(`${field} is not a time`);
  return value;
}

function optional<T>(value: T | null | undefined): T | undefined {
  return value ?? undefined;
}

function toSdk(record: PlainTrace): TraceRecord {
  const calls = need(record, 'calls');
  if (!Array.isArray(calls)) throw new TypeError('calls is not a list');
  const tags =
    isObject(record.tags) && Object.keys(record.tags).length > 0 ? record.tags : undefined;
  return {
    traceId: needString(record, 'trace_id'),
    agent: needString(record, 'agent'),
    start: when(record, 'start'),
    end: when(record, 'end'),
    sessionId: optional(record.session_id),
    tags,
    inputMessages: optional(record.input_messages),
    outputMessages: optional(record.output_messages),
    inside: calls.map(toCall),
    errorType: optional(record.error_type),
    cancelled: truthy(record.cancelled),
  };
}

function toCall(call: PlainCall): StepRecord | CallRecord {
  need(call, 'kind');
  if (call.kind === 'model') {
    const usage = call.usage;
    if (usage !== null && usage !== undefined && !isObject(usage)) {
      throw new TypeError('usage is not an object');
    }
    return {
      type: 'model_call',
      model: needString(call, 'model'),
      start: when(call, 'start'),
      end: when(call, 'end'),
      // A trace kept by an older version names none: Anthropic's own was all it sent.
      provider: call.provider ?? 'anthropic',
      usage:
        usage === null || usage === undefined
          ? undefined
          : {
              inputTokens: optional(usage.input),
              outputTokens: optional(usage.output),
              cacheReadInputTokens: optional(usage.cache_read),
              cacheWriteInputTokens: optional(usage.cache_write),
            },
      inputMessages: optional(call.input_messages),
      outputMessages: optional(call.output_messages),
      errorType: optional(call.error_type),
      cancelled: truthy(call.cancelled),
    };
  }
  if (call.kind === 'step') {
    const inner = call.calls ?? [];
    if (!Array.isArray(inner)) throw new TypeError('calls is not a list');
    return {
      type: 'step',
      name: needString(call, 'name'),
      start: when(call, 'start'),
      end: when(call, 'end'),
      inputMessages: optional(call.input_messages),
      outputMessages: optional(call.output_messages),
      calls: inner.map(toCall),
      errorType: optional(call.error_type),
      cancelled: truthy(call.cancelled),
    };
  }
  // Any other kind is a tool's, as a kept trace of another version may name it.
  return {
    type: 'tool_call',
    name: needString(call, 'name'),
    start: when(call, 'start'),
    end: when(call, 'end'),
    arguments: optional(call.arguments),
    result: optional(call.result),
    errorType: optional(call.error_type),
    cancelled: truthy(call.cancelled),
  };
}
