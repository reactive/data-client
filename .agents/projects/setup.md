# Set up a Data Client project

Run once, when a new Claude project or Cursor Project starts working on `reactive/data-client`. The
coordinator follows these steps. Workers never read this file; they read `PROJECTS.md`.

## 1. Learn the project

Ask the person for anything you cannot find in the project's settings:

- Goal, in one line (it becomes the post-push review `goals`).
- Repos: data-client plus any integration app (e.g. a React Native app, an SSR app). For each app: how
  to install, run and test it, and which data-client packages it uses.
- Scope: what is in the goal. Library, core or CI work outside it goes to Linear (`PROJECTS.md`,
  "Follow-ups").

## 2. Point every agent at PROJECTS.md

Add this line to the project instructions. Claude: give the person the text to paste in Project
settings, Instructions. Cursor: save it in the project's shared files.

> Every agent working on reactive/data-client, at the start of its task: read
> `https://raw.githubusercontent.com/reactive/data-client/master/PROJECTS.md` (`curl -sL`), or in a
> data-client checkout `git fetch origin master && git show FETCH_HEAD:PROJECTS.md`, and follow it.
> This project's instructions win where they differ. Project goal: <goal>.

Also put this line in every worker brief you write: whether Cursor agents read the shared files is
unverified, and briefs reach workers in both hosts.

Do not copy `PROJECTS.md` into instructions or memory: read from master, it stays current.

## 3. Seed project memory

One file per subject, only what `PROJECTS.md` and the repos don't say:

- `integration-<app>`: the app's repo, how to install the packed packages (`PROJECTS.md`, "Testing
  against another app"), run, test, and what "working" looks like on that platform.
- `project-scope`: the goal, what's in and out of scope, and where follow-ups go.
- Add a fact the turn you learn it; keep history and "why" in memory, not in `PROJECTS.md`.

## 4. Optional setup

- A work queue in the project files (JSON, one item per follow-up, with what it waits on), and a cap on
  how many workers run at once. Ask the person for the cap.
- Remote Control (Claude) or a local agent (Cursor) on the person's machine, if the integration needs a
  device, simulator or GPU.

## 5. Check it

Start one small worker task. Confirm it read `PROJECTS.md` (ask it to name the post-push review step)
before giving it real work.

## Improving the shared process

`PROJECTS.md`, "Keeping this file current", says how every project feeds rules back. Follow it as
coordinator: batch the rules workers send you into small PRs.
