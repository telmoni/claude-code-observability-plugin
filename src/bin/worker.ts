// The worker a hook starts detached, its payload on stdin and the SDK in its bundle.
import { main } from '../worker.js';

let raw = '';
try {
  process.stdin.setEncoding('utf8');
  for await (const chunk of process.stdin) raw += chunk;
} catch {
  // An unreadable payload is no work.
}
await main(raw, process.env);
// The state is saved and the log written: nothing a socket or a timer holds is the session's.
process.exit(0);
