/**
 * What a record may call a model, a tool, a skill or a subagent's kind: a plain name within
 * ingest's caps, never a path, nor text a model wrote in a name's place.
 */

import { cut } from './text.js';

const MODEL_MAX = 128;
const TOOL_MAX = 145;
const PLAIN_TOOL = /^[\w.:@+-]+$/;
const PLAIN_KIND = /^[\w.:-]{1,64}$/;
const CONTROL = /[\x00-\x1f\x7f-\x9f]/;
const PATH = /^(?:[/\\]|~(?:[/\\]|$)|\.{1,2}[/\\]|[A-Za-z]:[/\\]|file:)/i;
const WEIGHTS = /[/\\]([^/\\]+\.(?:gguf|ggml|bin|safetensors|llamafile))$/i;

/** A model's name cut to ingest's cap; a model file's own name for its path, else `unknown`. */
export function model(value: string): string {
  const name = value.trim();
  if (!name || CONTROL.test(name)) return 'unknown';
  const weights = WEIGHTS.exec(name);
  if (weights) return cut(weights[1]!, MODEL_MAX);
  if (PATH.test(name)) return 'unknown';
  return cut(name, MODEL_MAX);
}

/** A tool's name as every provider's tools are named, cut to ingest's cap; the model writes it, so anything else is `unknown`. */
export function tool(value: string): string {
  return PLAIN_TOOL.test(value) ? value.slice(0, TOOL_MAX) : 'unknown';
}

/** A skill's name or a subagent's kind, where it is a plain one. */
export function kind(value: unknown): string | undefined {
  return typeof value === 'string' && PLAIN_KIND.test(value) ? value : undefined;
}
