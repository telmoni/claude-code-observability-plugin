// The command Claude Code runs: `node dist/hook.mjs`, the event on its stdin.
import { main } from '../hook.js';

let raw = '';
try {
  process.stdin.setEncoding('utf8');
  for await (const chunk of process.stdin) raw += chunk;
} catch {
  // Nothing to read is no turn to record.
}
process.exitCode = await main(raw, process.env);
