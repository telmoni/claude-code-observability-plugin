---
name: tag
description: >-
  Tags this Claude Code session's turns in Telmoni with key=value labels, such as repo=telmoni or branch=main, or takes one back with key=. Use when the developer asks to tag the session, this repository, a branch or the work in Telmoni.
argument-hint: key=value … (key= takes one back)
---

The developer asked to tag this session's turns in Telmoni: `$ARGUMENTS`.

Telmoni's hook reads the tags from this call as the turn ends, so there is nothing to run. Reply in one line naming the tags set and the keys taken back.

Each tag is `key=value`, its key 1 to 64 letters, digits, `_`, `.` or `-`, its value up to 256 characters with no space; `key=` takes back a tag set this way. A tag holds from this turn to the session's end, or until it is changed or taken back. Tags are sent in every content mode and seen by everyone on the project, so a secret or a personal detail never belongs in one.
