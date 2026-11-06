# Telmoni for Claude Code

Records each turn of your [Claude Code](https://code.claude.com) sessions in [Telmoni](https://telmoni.com) as a run: the models it called and their tokens, the tools it used and the subagents it started, each with its times and whether it failed. Nothing you or Claude said, except the tags you set, unless you turn on **Capture content** and the project keeps content: then each turn's conversation too.

[Telmoni](https://github.com/telmoni/telmoni) is open-source monitoring for AI agents: with your sessions recorded, its [alerts](https://telmoni.com/docs/monitoring/alerts) tell you when a turn fails, loops on one tool or costs more than you set, and show you the turn that did it. Prompts stay in your process unless you turn content on.

## Install

You need Claude Code, git, and [Node.js](https://nodejs.org) 22 or later on your `PATH`. Claude Code adds the marketplace and fetches the plugin with your git; the hook runs with Node from the plugin's own bundled JavaScript, which carries the [Telmoni TypeScript SDK](https://www.npmjs.com/package/telmoni), so nothing is installed or fetched when it first runs.

```sh
claude plugin marketplace add telmoni/claude-code-observability-plugin
claude plugin install telmoni-observability@telmoni-plugins
```

This repository is the marketplace, and the plugin is the repository itself: an install copies it at its head, and `claude plugin update telmoni-observability@telmoni-plugins` takes the next release, Claude Code keeping the copy it has until the plugin's version changes. Installed so, the plugin loads in every Claude Code you start: the terminal's, an editor's, the Agent SDK's. Plugins load as a session starts, so start a new one once it is installed and configured.

### From a checkout

```sh
git clone https://github.com/telmoni/claude-code-observability-plugin.git
TELMONI_API_KEY=tm_… claude --plugin-dir ./claude-code-observability-plugin
```

That one session runs the plugin as cloned; its bundles are built and committed in `dist/`, so there is nothing to build.

## Configure

The plugin asks for a [project API key](https://telmoni.com/docs/api/api-keys) holding the **ingest** scope as it is installed. Set or change it in a session with `/plugin configure telmoni-observability@telmoni-plugins`, or from your shell:

```sh
echo '{"TELMONI_API_KEY": "tm_…"}' | claude plugin configure telmoni-observability@telmoni-plugins --values-stdin
```

Claude Code keeps the key with its own credentials: in the Keychain on macOS, and in its credentials file elsewhere. The endpoint is `https://api.telmoni.com` unless you set one; a self-hosted Telmoni gives its machine host. A `TELMONI_API_KEY` in the environment Claude Code starts in — your shell's, or a repository's `.claude/settings.json` `env` block — comes before the plugin's own settings, so one checkout can report to another project, and goes with the `TELMONI_ENDPOINT` beside it there, or the default: a key is never sent to an endpoint named somewhere else, so a repository that names its own endpoint gets no one's machine-wide key.

**Capture content**, off unless you turn it on, sits beside the key: `/plugin configure` sets it, or `{"TELMONI_CAPTURE_CONTENT": true}` through `--values-stdin`. On, each turn carries its conversation too, as Claude Code recorded it: your prompt and its images, each reply with its thinking where Claude wrote it in plain text, what each model call was given (your prompt to the turn's first, a subagent's task to its first, and to each after the tool results since the call before), each tool's input and output, each subagent's task and answer, and each compaction's summary. Telmoni keeps it only in a project whose content mode is on, set in the project's settings; for any other, the SDK sends none of it. A key from the environment takes its switch from there too, `TELMONI_CAPTURE_CONTENT=1` beside it, never the plugin's own.

**Scrub secrets** and **Scrub personal data**, on unless you turn them off, sit beside it: `/plugin configure` sets them, or `{"TELMONI_SCRUB_PII": false}` through `--values-stdin`. Before content leaves, secrets, and personal data — emails, phone numbers, card numbers, IP addresses, home folders' paths — are replaced with markers such as `[secret: aws_key]` or `[pii: email]`, counted on the run's page; no pattern finds a name or a street address. A key from the environment takes its switches from there too, `TELMONI_SCRUB_SECRETS=0` or `TELMONI_SCRUB_PII=0` beside it, never the plugin's own.

## What a turn records

A turn, from your prompt to the agent's last reply or to your interruption, is one run of the agent `claude-code`, in your session. Inside it: a model call per reply, with its model and its token counts, the cache's reads and writes among them; each tool call by its name, with its time, failed where the tool failed and cancelled where you stopped or refused it; each subagent as a step named by its kind, holding the subagent's own model and tool calls, and the steps of the subagents it started in turn, 16 deep at most, past which a subagent is recorded as the call that started it; each compaction Claude Code makes as the turn goes on, as a step named `compaction`; and the skills the turn ran, by name, as the tag `skills`, beside the tags you set. An interrupted turn is a cancelled run; a turn an API error ended is a failed one, named by the error's kind (`rate_limit`), never its message. A turn that started a subagent in the background is sent once the subagent's notice has been answered.

With content off, of what Claude Code writes down, the plugin reads only kinds, ids, times, counts and flags, and the first characters of a user row for the markers Claude Code puts there: an interruption, a task's notice, a command's output. It never keeps or sends a prompt or a reply, the model's thinking, a compaction's summary, a tool's input or output beyond a skill's name and the tags you asked for, a command, a file's path or contents, the folder you work in, a session's title or anyone's email: the folder a turn started in is read only to find the tags file above it. With content on, it also reads and sends the conversation above, a redacted thought never, and still never the folder you work in, the transcript's path, a session's title or anyone's email; a turn waiting to be sent keeps its conversation in the plugin's data folder until it goes.

## Tags

Tags label a session's turns, so one session's runs can say which repository or branch each was about as the work moves between them. Ask for one, `/telmoni-observability:tag repo=telmoni`, or in plain words ("tag this repo telmoni"), and Claude calls the plugin's `tag` skill: several go at once (`repo=telmoni branch=main`), and `repo=` takes one back. A tag you ask for holds from that turn to the session's end, or until you change it or take it back; a turn already recorded keeps what it was sent with.

A `.telmoni-tags.json` holds tags for a folder, `{"repo": "telmoni"}`, and its tags go on every turn started in that folder or below it, the nearest file winning. The file is read for its tags alone, never through a link, and its path is never sent; a tag you asked for wins over the file's for its key, and taking it back lets the file's apply again.

A key is 1 to 64 letters, digits, `_`, `.` or `-`, and a value up to 256 characters; a turn carries 32 tags at most, `skills` among them, which is the plugin's own. A tag that breaks a rule is dropped with a line in `hook.log`, and the turn is sent without it. Tags are metadata: they are sent in every content mode and seen by everyone on the project, so a secret or a personal detail never belongs in one. `repo` and `branch` are the keys to start with.

## When nothing shows up

The hook runs when a turn stops, when an API error ends one, and when the session ends, and hands the work to a process of its own, so no turn waits on Telmoni. Its log is `hook.log` in the plugin's data folder: `~/.claude/plugins/data/telmoni-observability-telmoni-plugins/` for an install from the marketplace, `~/.claude/plugins/data/telmoni-observability-inline/` under `--plugin-dir`, or `~/.claude/telmoni/` where Claude Code gives the plugin no data folder. One line names each failure by the start of the session's id: no key, an endpoint the SDK refused, a turn Telmoni could not take, which is kept, the newest 200 of them, and sent again as the next turn of any session ends, or one it refused for good, which is not; and a turn held because it is not over yet, a subagent it started in the background not yet answered or the session still busy. The hook itself never fails a turn, and never waits on Telmoni. Without Node 22 or later on your `PATH` the hook does nothing at all, and the log stays empty: `node --version` in the shell Claude Code starts in says which you have. The plugin records Claude Code's own sessions alone: where another editor runs Claude Code's hooks, it does nothing.

## Developing

The plugin is TypeScript in `src/`, bundled by tsup with the SDK into `dist/hook.mjs` and `dist/worker.mjs`, which are what Claude Code runs and are committed with the source that built them.

```sh
npm ci        # the development tools and the SDK, as package-lock.json pins them
npm run verify     # prettier's check, tsc, the bundles rebuilt, vitest
npm run validate   # the manifests as Claude Code validates them
npm run format     # prettier, as the check wants it
```

Until the SDK's next release, the plugin builds against the core's checkout beside this one: `npm run sdk-checkout` installs `../telmoni/sdk/typescript` over the registry's, and `npm ci` puts the registry's back.

A release is the version bumped in `.claude-plugin/plugin.json` and `package.json` (`npm version --no-git-tag-version X.Y.Z` keeps `package-lock.json` in step) in one commit on `main`; CI tags it and cuts the GitHub release once the owner approves. At `0.0.0` nothing is released.

## License

Apache-2.0.
