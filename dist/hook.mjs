// src/hook.ts
import { spawn } from "child_process";
import { closeSync as closeSync2, openSync as openSync2 } from "fs";
import { dirname as dirname2, join as join4 } from "path";
import { fileURLToPath } from "url";

// src/payload.ts
import { homedir } from "os";
import { join as join2 } from "path";

// src/transcript.ts
import {
  closeSync,
  existsSync,
  openSync,
  readFileSync,
  readSync,
  readdirSync,
  statSync
} from "fs";
import { join, parse, sep } from "path";

// src/text.ts
function pairAt(text, index) {
  const high = text.charCodeAt(index);
  const low = text.charCodeAt(index + 1);
  return high >= 55296 && high <= 56319 && low >= 56320 && low <= 57343;
}
function cut(text, max) {
  let end = 0;
  for (let count = 0; count < max && end < text.length; count++) {
    end += pairAt(text, end) ? 2 : 1;
  }
  return text.slice(0, end);
}
function within(text, max) {
  return text.length <= max || cut(text, max).length === text.length;
}

// src/transcript.ts
var TAG_SKILL = "telmoni-observability:tag";
var TAG_COMMAND = `<command-name>/${TAG_SKILL}</command-name>`;
function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
var UTF8 = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });
function errorKind(value) {
  return typeof value === "string" && value !== "" && within(value, 64) && !value.includes(" ") ? value : void 0;
}

// src/payload.ts
var EVENTS = ["Stop", "StopFailure", "SessionEnd"];
var ID = /^[A-Za-z0-9._-]{1,128}$/;
var BUSY_KINDS = ["subagent", "workflow", "teammate"];
function parse2(raw2, env) {
  if (env.CURSOR_VERSION || env.CURSOR_PROJECT_DIR) return void 0;
  let data;
  try {
    data = raw2.trim() ? JSON.parse(raw2) : void 0;
  } catch {
    return void 0;
  }
  if (!isObject(data)) return void 0;
  if (["conversation_id", "generation_id", "cursor_version"].some((key) => Object.hasOwn(data, key))) {
    return void 0;
  }
  const event = data.hook_event_name;
  const session = data.session_id;
  const path = data.transcript_path;
  if (typeof event !== "string" || !EVENTS.includes(event)) return void 0;
  if (typeof session !== "string" || !ID.test(session)) return void 0;
  if (typeof path !== "string" || !path) return void 0;
  const tasks = data.background_tasks;
  const busy = Array.isArray(tasks) && tasks.some((task) => isObject(task) && BUSY_KINDS.includes(task.type));
  return {
    sessionId: session,
    transcriptPath: expandUser(path),
    event,
    error: event === "StopFailure" ? errorKind(data.error) ?? "unknown" : void 0,
    busy
  };
}
function expandUser(path) {
  if (path === "~") return homedir();
  return path.startsWith("~/") ? join2(homedir(), path.slice(2)) : path;
}

// src/settings.ts
import { createHash } from "crypto";
import { accessSync, chmodSync, constants, mkdirSync, statSync as statSync2 } from "fs";
import { homedir as homedir2 } from "os";
import { dirname, isAbsolute, join as join3 } from "path";
var WHITE_SPACE = "[\\t\\n\\v\\f\\r \\x85\\xa0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]";
var ENDS = new RegExp(`^${WHITE_SPACE}+|${WHITE_SPACE}+$`, "g");
function stateDir(env) {
  const data = env.CLAUDE_PLUGIN_DATA;
  if (data && isAbsolute(data)) {
    const made2 = usable(data);
    if (made2 !== void 0) return made2;
  }
  const given = env.CLAUDE_CONFIG_DIR;
  const home = given && isAbsolute(given) ? given : join3(homedir2(), ".claude");
  const made = usable(join3(home, "telmoni"));
  if (made === void 0) throw new Error("no writable state folder");
  return made;
}
function usable(path) {
  try {
    mkdirSync(dirname(path), { recursive: true });
    mkdirSync(path, { mode: 448 });
  } catch (fault) {
    if (fault.code !== "EEXIST") return void 0;
  }
  try {
    if (!statSync2(path).isDirectory()) return void 0;
    chmodSync(path, 448);
  } catch {
  }
  try {
    accessSync(path, constants.W_OK | constants.X_OK);
    return path;
  } catch {
    return void 0;
  }
}

// src/hook.ts
async function main(raw2, env) {
  try {
    const given = parse2(raw2, env);
    if (given !== void 0) start(given, env);
  } catch {
  }
  return 0;
}
function workerPath() {
  return join4(dirname2(fileURLToPath(import.meta.url)), "worker.mjs");
}
function start(payload, env) {
  const log = openSync2(join4(stateDir(env), "hook.log"), "a", 384);
  try {
    const child = spawn(process.execPath, [workerPath()], {
      detached: true,
      env: { ...env },
      stdio: ["pipe", "ignore", log],
      windowsHide: true
    });
    const stdin = child.stdin;
    child.on("error", () => {
    });
    stdin.on("error", () => {
    });
    stdin.end(JSON.stringify(payload));
    child.unref();
  } finally {
    closeSync2(log);
  }
}

// src/bin/hook.ts
var raw = "";
try {
  process.stdin.setEncoding("utf8");
  for await (const chunk of process.stdin) raw += chunk;
} catch {
}
process.exitCode = await main(raw, process.env);
