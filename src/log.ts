/** The plugin's log: one line a failure, naming the session by the start of its id and never anything said in it. */

import { appendFileSync, renameSync, statSync } from 'node:fs';

const LIMIT = 1 << 20;

export class Log {
  constructor(readonly path: string) {}

  line(session: string, event: string, text: string): void {
    const stamp = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
    try {
      if (size(this.path) > LIMIT) renameSync(this.path, `${this.path}.1`);
      appendFileSync(this.path, `${stamp} ${session.slice(0, 8)} ${event} ${text}\n`, {
        mode: 0o600,
      });
    } catch {
      // Nowhere left to say so.
    }
  }
}

function size(path: string): number {
  try {
    return statSync(path).size;
  } catch {
    return 0;
  }
}
