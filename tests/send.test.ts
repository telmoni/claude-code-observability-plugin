import type { Warning } from 'telmoni';
import { expect, test } from 'vitest';

import { type Heard, type Outcome, judge } from '../src/send.js';

test.each<[Warning, Outcome]>([
  [{ kind: 'refused', status: 400, problemType: '/errors/telemetry/invalid-batch' }, 'refused'],
  [{ kind: 'refused', status: 402, problemType: '/errors/plan/limit-reached' }, 'refused'],
  [{ kind: 'refused', status: 413, problemType: '/errors/telemetry/batch-too-large' }, 'refused'],
  [{ kind: 'refused', status: 500, problemType: '/errors/internal/other' }, 'refused'],
  [{ kind: 'refused', status: 500, problemType: '/errors/internal/database' }, 'undelivered'],
  [{ kind: 'refused', status: 401, problemType: '/errors/auth/invalid-key' }, 'undelivered'],
  [{ kind: 'refused', status: 403, problemType: '/errors/auth/forbidden' }, 'undelivered'],
  [{ kind: 'refused', status: 404 }, 'undelivered'],
  [
    { kind: 'failed', status: 503, problemType: '/errors/telemetry/store-unavailable' },
    'undelivered',
  ],
  [{ kind: 'failed' }, 'undelivered'],
  [{ kind: 'export_error' }, 'undelivered'],
  [{ kind: 'queue_full' }, 'undelivered'],
  [{ kind: 'dropped' }, 'partial'],
  [{ kind: 'span_refused' }, 'partial'],
  [{ kind: 'said' }, 'partial'],
  [{ kind: 'too_large' }, 'partial'],
  [{ kind: 'trimmed' }, 'partial'],
  [{ kind: 'upload_failed', status: 413 }, 'partial'],
  [{ kind: 'input' }, 'sent'],
])('what the sdks warnings mean (%j, %s)', (warning, outcome) => {
  expect(judge([[warning, 'telmoni: a warning']], true).outcome).toBe(outcome);
});

test('the kind decides and the words are logged', () => {
  const words =
    'telmoni: export refused with 400 /errors/telemetry/invalid-batch; the batch was dropped';
  const verdict = judge([[{ kind: 'dropped' }, words]], true);
  expect([verdict.outcome, verdict.detail]).toEqual(['partial', words]);
});

test('a flush that timed out is sent again', () => {
  expect(judge([], false).outcome).toBe('undelivered');
  expect(judge([], true).outcome).toBe('sent');
});

test('a refusal outranks a dropped field', () => {
  const both: Heard[] = [
    [{ kind: 'dropped' }, 'telmoni: the server dropped x (y)'],
    [{ kind: 'refused', status: 400, problemType: '/e' }, 'telmoni: export refused with 400 /e'],
  ];
  expect(judge(both, true).outcome).toBe('refused');
});

test('a batch not delivered keeps the trace beside one refused', () => {
  const both: Heard[] = [
    [
      { kind: 'refused', status: 400, problemType: '/errors/telemetry/invalid-batch' },
      'telmoni: export refused with 400 /errors/telemetry/invalid-batch; dropped',
    ],
    [
      { kind: 'failed', status: 503 },
      'telmoni: export failed after 3 attempts (503); the batch was dropped',
    ],
  ];
  expect(judge(both, true).outcome).toBe('undelivered');
  expect(judge(both.toReversed(), true).outcome).toBe('undelivered');
});
