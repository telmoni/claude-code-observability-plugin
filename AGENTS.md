# Claude Code Plugin — Agent Guidelines

The Claude Code plugin for Telmoni: a hook that records each turn of a person's Claude Code sessions as a run, metadata only unless content is on, through the platform's Python SDK. The repository is the plugin and its own marketplace: Claude Code clones it and runs the hook from the clone, so every file here is published as written.

## Ground Rules
- **Metadata only, unless content is on.** The hook reads of a transcript its kinds, ids, times, counts and flags, the first characters of a user row for Claude Code's markers, the tool-use id a task's notice names, what the plugin's own `tag` skill was asked (its `args`, or a typed command's `<command-args>`), and a turn's `cwd` only to find `.telmoni-tags.json`, read for its tags alone. Never keep, log or send the working folder or a path as a field of its own; nor, with content off, a prompt, a reply, thinking, a compaction's summary, or a tool's input or output beyond a skill's name, a subagent's kind and whether it was started in the background. With content on, the conversation `ARCHITECTURE.md` names (the prompt, each model call's input and reply, each tool's input and output, each subagent's task and answer, a compaction's summary), with any path written in it, which the SDK sends only where the project's content mode is `on`. A change that reads more of the transcript needs the owner's word, and a test that it is never sent (`assert_metadata_only` in `tests/conftest.py`).
- **Never read, print or copy a `.env`, Claude Code's credentials (`~/.claude/.credentials.json`) or a key.** A test, a fixture or a commit never holds a real key.
- **Ask first:** any dependency change (the scripts' headers, `pyproject.toml`, `uv.lock`) and any external-state change (a listing in a directory, a call to a live Telmoni with a real key).
- **Quality gate:** never weaken a test or leave the tree broken.
- **Build only what is asked:** the smallest change that does the task, in the files that already hold it. No feature, option, abstraction, layer, helper or file for a need that is not here yet, and no refactor beyond the task (a split, a rename, a rewrite for style): propose it with what it costs, and wait. A new repository, package, service or workflow is the owner's to make.
- **The hook never fails the session**: every fault is a log line and exit code 0.

## Where Things Live
| Path | What |
|---|---|
| `.claude-plugin/plugin.json` | The manifest: name `telmoni-observability`, the version, the three settings (`TELMONI_API_KEY`, sensitive; `TELMONI_ENDPOINT`; `TELMONI_CAPTURE_CONTENT`). |
| `.claude-plugin/marketplace.json` | The marketplace, `telmoni-plugins`, naming this repository (`./`) as the plugin. |
| `hooks/hooks.json` | `Stop`, `StopFailure` and `SessionEnd`, each running the script through uv or `python3`. |
| `hooks/telmoni_hook.py` | The script Claude Code runs, with no dependency: it starts the worker and returns. |
| `hooks/telmoni_worker.py` | The worker it starts detached, with the SDK in its header. |
| `hooks/telmoni_claude/` | The package: `payload` (the hook's input), `settings`, `transcript` (rows and what is read of them), `turns` (how turns are cut, what each model call is given, compactions, and when turns are complete), `record` (a turn as a run, a subagent's own subagents nested in its step to the SDK's depth), `send` (the SDK, and what its warnings mean), `names` (what a record may call a model, a tool, a skill or a subagent's kind), `tags` (those the `tag` skill is asked for and `.telmoni-tags.json` holds), `state` (the session's file and lock), `worker`, `log`. |
| `skills/tag/SKILL.md` | The `tag` skill, which Claude Code names `telmoni-observability:tag`: it runs nothing; the hook reads what it was asked. |
| `tests/` | pytest: `conftest.py` writes transcripts as Claude Code does and stands in for Telmoni; `test_worker.py` runs the hook end to end, the SDK included. |
| `pyproject.toml`, `uv.lock` | The development group alone (ruff, pytest and the SDK the suite runs), locked; the hook's one dependency is the worker's header. |
| `.github/workflows/` | `ci.yml`: the suite on Python 3.10 and 3.14, ruff, a smoke run of the hook, the manifests, and the workflows themselves under actionlint. `release.yml`: on `main`, tags a version bump and cuts the release once the owner approves the `release` environment. |
| `ARCHITECTURE.md` | How it loads and runs, what it reads, how turns are cut, what it sends, tags, configuration, state and the log, delivery, testing, the release, decisions, known gaps. |
| [`telmoni/telmoni`](https://github.com/telmoni/telmoni) | Sibling repo, checked out as `../telmoni`: the SDK (`sdk/python`, `record_run`), and the book, whose `web/content/docs/api/coding-agents.mdx` is this plugin's page. |

## Commands
- **After every change** (no permission needed; report failures verbatim): `npm run verify && npm run validate` — prettier's check, tsc, the bundles rebuilt and the suite, then `claude plugin validate --strict` on the plugin and the marketplace.
- `npm run format` formats; `npm run format:check`, `npm run typecheck`, `npm run build`, `npm test` and `npm run validate` run prettier's check, tsc, the bundles, the suite or the manifests' check alone. The suite runs the SDK against a fake Telmoni and needs no network once `npm ci` has run.
- **Until the SDK's next release** (a model call's and a run's messages, steps inside steps, the scrubbers), the lock's 0.2.0 builds no record: after each `npm ci`, run `npm run sdk-checkout`, which installs `../telmoni/sdk/typescript`, packed to `/tmp/telmoni`, over the registry's, unsaved; then the gate.
- **Only when asked:** a run against a live Telmoni, `uv lock --upgrade`, a version bump.

## Code Rules
- Python 3.10 or later, the floor the SDK sets; no dependency but the SDK in the worker's header, and none in the package.
- A transcript row is read through `transcript.py`'s functions alone; a new field read is named there, with its test.
- Timestamps carry their zone; every record the SDK takes is built in `send.py` from the plain record `record.py` makes, which is what the state file keeps.
- Comments are for a person reading the code, and short: they say *why*, never *what* — a doc comment in a line or two, an inline comment in one, a test's name saying what it proves. The reasoning behind a change (a race worked through, the designs turned down, its history) goes in `ARCHITECTURE.md` or the commit message, never above a function, and editing a comment means shortening its whole block.
- No AI signatures anywhere.

## Agent Hygiene
- **This repo only:** change nothing in another repository unless the user says so for this task; that binds subagents too. Reading is fine.
- Edit `AGENTS.md` only when the user asks outright; otherwise propose a diff.
- No scripted bulk edits. One-off scripts and logs go in `/tmp/telmoni/`. A fixture is synthetic, written as Claude Code writes a transcript (`tests/conftest.py`), never a recorded session.

## Git Rules
- Commit only when asked: never `git add` or `git commit` unprompted.
- Conventional commits (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`) of 1–5 lines and the sign-off: a subject, then optionally a blank line and up to 3 lines on *why*. No file lists, test output, AI signatures or `Co-authored-by` trailers.
- Every commit is signed off by the developer it is made for, certifying the [Developer Certificate of Origin](https://developercertificate.org/): `git commit -s` adds `Signed-off-by: Name <email>` from git's `user.name` and `user.email`, which name a person, never an agent. A merge commit too: a branch is merged in a clone, `git merge --no-ff --signoff`, and pushed, never from GitHub's merge button, whose commit carries none.
- A release is the version bumped in `.claude-plugin/plugin.json`, `pyproject.toml` and `hooks/telmoni_claude/__init__.py` in one commit on `main`, made when the owner says, which CI tags and releases on the owner's approval; never a tag by hand.
- No branches, worktrees, pushes or pull requests.

## Definition of Done
- [ ] `npm run verify && npm run validate` pass, or the failure is reported verbatim.
- [ ] Nothing of a session reaches an export, the state, the log, a test fixture or a commit, but the conversation an export and the state carry where content is on.
- [ ] `ARCHITECTURE.md` and the README say what changed; the book's `web/content/docs/api/coding-agents.mdx` (`../telmoni`) is fixed or named.
- [ ] Nothing that needs asking happened unasked.
