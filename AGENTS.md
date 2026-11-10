# Claude Code Plugin — Agent Guidelines

The Claude Code plugin for Telmoni: a hook that records each turn of a person's Claude Code sessions as a trace, metadata only unless content is on, through the platform's TypeScript SDK, bundled into `dist/worker.mjs`. The repository is the plugin and its own marketplace: Claude Code clones it and runs the hook from the clone, so every file here is published as written.

## Ground Rules
- **Metadata only, unless content is on.** The hook reads of a transcript its kinds, ids, times, counts and flags, the first characters of a user row for Claude Code's markers, the tool-use id a task's notice names, what the plugin's own `tag` skill was asked (its `args`, or a typed command's `<command-args>`), and a turn's `cwd` only to find `.telmoni-tags.json`, read for its tags alone. Never keep, log or send the working folder or a path as a field of its own; nor, with content off, a prompt, a reply, thinking, a compaction's summary, or a tool's input or output beyond a skill's name, a subagent's kind and whether it was started in the background. With content on, the conversation `ARCHITECTURE.md` names (the prompt, each model call's input and reply, each tool's input and output, each subagent's task and answer, a compaction's summary), with any path written in it, which the SDK sends only where the project's content mode is `on`. A change that reads more of the transcript needs the owner's word, and a test that it is never sent (`assertMetadataOnly` in `tests/helpers.ts`).
- **Never read, print or copy a `.env`, Claude Code's credentials (`~/.claude/.credentials.json`) or a key.** A test, a fixture or a commit never holds a real key.
- **Ask first:** any dependency change (`package.json`, `package-lock.json`) and any external-state change (a listing in a directory, a call to a live Telmoni with a real key).
- **Quality gate:** never weaken a test or leave the tree broken.
- **Build only what is asked:** the smallest change that does the task, in the files that already hold it. No feature, option, abstraction, layer, helper or file for a need that is not here yet, and no refactor beyond the task (a split, a rename, a rewrite for style): propose it with what it costs, and wait. A new repository, package, service or workflow is the owner's to make.
- **The hook never fails the session**: every fault is a log line and exit code 0.

## Where Things Live
| Path | What |
|---|---|
| `.claude-plugin/plugin.json` | The manifest: name `telmoni-observability`, the version, the three settings (`TELMONI_API_KEY`, sensitive; `TELMONI_ENDPOINT`; `TELMONI_CAPTURE_CONTENT`). |
| `.claude-plugin/marketplace.json` | The marketplace, `telmoni-plugins`, naming this repository (`./`) as the plugin. |
| `hooks/hooks.json` | `Stop`, `StopFailure` and `SessionEnd`, each running `node "${CLAUDE_PLUGIN_ROOT}/dist/hook.mjs" \|\| true`. |
| `src/bin/hook.ts` | The command Claude Code runs, its event on stdin: `src/hook.ts` starts the worker and returns, loading no SDK. |
| `src/bin/worker.ts` | The worker's entry point, its payload on stdin and the SDK in its bundle. |
| `src/*.ts` | The modules: `payload` (the hook's input), `settings`, `transcript` (rows and what is read of them), `turns` (how turns are cut, what each model call is given, compactions, and when turns are complete), `record` (a turn as a trace, a subagent's own subagents nested in its step to the SDK's depth), `send` (the SDK, and what its warnings mean), `names` (what a record may call a model, a tool, a skill or a subagent's kind), `tags` (those the `tag` skill is asked for and `.telmoni-tags.json` holds), `state` (the session's file and lock), `hook`, `worker`, `log`, `text` (cuts and lengths in characters). |
| `dist/`, `tsup.config.ts` | The committed bundles, `hook.mjs` and `worker.mjs`: tsup builds them from `src/`, the SDK bundled into the worker, for Node 22 or later. Claude Code builds and installs nothing. |
| `skills/tag/SKILL.md` | The `tag` skill, which Claude Code names `telmoni-observability:tag`: it runs nothing; the hook reads what it was asked. |
| `tests/` | Vitest: `helpers.ts` writes transcripts as Claude Code does and stands in for Telmoni; `worker.test.ts` runs the hook end to end, the SDK included. |
| `package.json`, `package-lock.json`, `tsconfig.json`, `.prettierrc.json` | The npm commands and locked development dependencies, TypeScript's checks and Prettier's style; the SDK is bundled, with nothing to install at runtime. |
| `.github/workflows/` | `ci.yml`: tests on Node 22 and 26; Prettier and TypeScript checks; the rebuilt bundles checked against `dist/`; smoke runs of both bundles; the manifests validated by Claude Code; and the workflows under actionlint. `release.yml`: on `main`, checks the versions agree and CI passed, tags a version bump once the owner approves the `release` environment, and cuts the release. |
| `ARCHITECTURE.md` | How it loads and runs, what it reads, how turns are cut, what it sends, tags, configuration, state and the log, delivery, testing, the release, decisions, known gaps. |
| [`telmoni/telmoni`](https://github.com/telmoni/telmoni) | Sibling repo, checked out as `../telmoni`: the SDK (`sdk/typescript`, `recordTrace`), and the book, whose `web/content/docs/api/coding-agents.mdx` is this plugin's page. |

## Commands
- **After every change** (no permission needed; report failures verbatim): `npm run verify && npm run validate` — prettier's check, tsc, the bundles rebuilt and the suite, then `claude plugin validate --strict` on the plugin and the marketplace.
- `npm run format` formats; `npm run format:check`, `npm run typecheck`, `npm run build`, `npm test` and `npm run validate` run prettier's check, tsc, the bundles, the suite or the manifests' check alone. The suite runs the SDK against a fake Telmoni and needs no network once `npm ci` has run.
- **Until the SDK's next release** (a model call's and a run's messages, steps inside steps, the scrubbers), the SDK is a development dependency on the core's checkout beside this one (`file:../telmoni/sdk/typescript`), built there first (`npm ci && npm run build` in `../telmoni/sdk/typescript`); CI checks out the core at `TELMONI_REF` in `ci.yml`, the commit whose SDK the committed `dist/` bundles, bumped with it.
- **Only when asked:** a run against a live Telmoni, a dependency upgrade with npm, a version bump.

## Code Rules
- Node 22 or later, as `package.json`'s `engines` sets; no runtime dependency but the SDK, bundled into the worker.
- A transcript row is read through `transcript.ts`'s functions alone; a new field read is named there, with its test.
- Timestamps carry their zone; every record the SDK takes is built in `send.ts` from the plain record `record.ts` makes, which is what the state file keeps.
- Comments are for a person reading the code, and short: they say *why*, never *what* — a doc comment in a line or two, an inline comment in one, a test's name saying what it proves. The reasoning behind a change (a race worked through, the designs turned down, its history) goes in `ARCHITECTURE.md` or the commit message, never above a function, and editing a comment means shortening its whole block.
- No AI signatures anywhere.

## Agent Hygiene
- **This repo only:** change nothing in another repository unless the user says so for this task; that binds subagents too. Reading is fine.
- Edit `AGENTS.md` only when the user asks outright; otherwise propose a diff.
- No scripted bulk edits. One-off scripts and logs go in `/tmp/telmoni/`. A fixture is synthetic, written as Claude Code writes a transcript (`tests/helpers.ts`), never a recorded session.

## Git Rules
- Commit only when asked: never `git add` or `git commit` unprompted.
- Conventional commits (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`) of 1–5 lines and the sign-off: a subject, then optionally a blank line and up to 3 lines on *why*. No file lists, test output, AI signatures or `Co-authored-by` trailers.
- Every commit is signed off by the developer it is made for, certifying the [Developer Certificate of Origin](https://developercertificate.org/): `git commit -s` adds `Signed-off-by: Name <email>` from git's `user.name` and `user.email`, which name a person, never an agent. A merge commit too: a branch is merged in a clone, `git merge --no-ff --signoff`, and pushed, never from GitHub's merge button, whose commit carries none.
- A release is the version bumped in `.claude-plugin/plugin.json` and `package.json` in one commit on `main`, made when the owner says, which CI tags and releases on the owner's approval; never a tag by hand.
- No branches, worktrees, pushes or pull requests.

## Definition of Done
- [ ] `npm run verify && npm run validate` pass, or the failure is reported verbatim.
- [ ] Nothing of a session reaches an export, the state, the log, a test fixture or a commit, but the conversation an export and the state carry where content is on.
- [ ] `ARCHITECTURE.md` and the README say what changed; the book's `web/content/docs/api/coding-agents.mdx` (`../telmoni`) is fixed or named.
- [ ] Nothing that needs asking happened unasked.
