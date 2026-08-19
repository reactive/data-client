---
name: pr
description: Create a GitHub pull request from current working changes. Handles all git states - uncommitted changes, no branch, unpushed commits, etc. Analyzes diffs and changesets to generate a PR with filled-in template. Opens the PR in the browser when done. Use when the user asks to create a PR, open a PR, submit changes, or push for review.
disable-model-invocation: true
---

# Create Pull Request

## Overview

Analyze the current git state, prepare changes for a PR, create it on GitHub with a well-crafted description, and open it in the browser.

## Step 1: Assess Git State

Run these commands in parallel to understand the current state:

```bash
git status --porcelain
git branch --show-current
git log --oneline master..HEAD 2>/dev/null
git diff --stat master...HEAD 2>/dev/null
git stash list
```

Also check for existing PR on the current branch:

```bash
gh pr view --json url,state 2>/dev/null
```

## Step 2: Handle Git States

Based on the assessment, follow the appropriate path:

### No changes anywhere
If working tree is clean AND no commits ahead of master → inform user there's nothing to PR.

### On `master` with uncommitted changes only
1. Ask the user for a branch name, or infer one from the changes (lowercase, hyphenated, concise)
2. Create and switch to branch: `git checkout -b <branch-name>`
3. Stage all changes: `git add -A`
4. Analyze the diff and write a commit message following the project's conventional commit style (see Commit Style below)
5. Commit the changes

### On `master` with commits ahead (not yet on a branch)
1. Ask the user for a branch name, or infer one
2. Create branch at current position: `git checkout -b <branch-name>`
3. (The commits come along automatically)

### On feature branch with uncommitted changes
1. Stage all changes: `git add -A`
2. Analyze the diff and write a commit message
3. Commit the changes

### On feature branch, all committed, not pushed
Continue to Step 3.

### PR already exists
Inform the user and provide the existing PR URL. Ask if they want to update it instead.

## Step 3: Validate Changesets and Blog (before committing)

For user-facing changes (`feat:`, `fix:`, `enhance:`), check that changesets and blog updates exist:

```bash
ls .changeset/*.md 2>/dev/null | grep -v README
git diff --name-only master...HEAD 2>/dev/null
git status --porcelain
```

If changesets are missing or the draft blog post is unmodified, invoke the skill "changeset" to create them before proceeding. Skip this step for `docs:`, `pkg:`, `internal:`, `demo:` changes.

## Step 4: Push to Remote

```bash
git push -u origin HEAD
```

## Step 5: Analyze Changes for PR Description

Gather information for the PR body:

```bash
# Full diff against master
git diff master...HEAD

# Commit messages
git log --format='%s%n%n%b' master..HEAD

# Check for changesets
ls .changeset/*.md 2>/dev/null | grep -v README
```

Read any changeset files (`.changeset/*.md`, excluding README.md) — these contain curated descriptions of what changed and why. Use them as primary source material for the PR description.

Examine the diff to understand:
- Which packages are affected
- Whether there are test changes
- Whether there are doc changes
- The nature of the change (feature, fix, refactor, docs, internal, pkg)

## Step 6: Create the PR

Use `gh pr create` with the project's PR template structure. Base branch is always `master`.

### PR Title

Follow commit convention style:
- `feat: <description>` — new feature
- `fix: <description>` — bug fix
- `enhance: <description>` - improvements
- `docs: <description>` — documentation only
- `pkg: <description>` — dependency updates
- `internal: <description>` — internal tooling/infra
- `demo: <description>` — example app changes

Scope is optional, used for specificity (e.g., `feat(rest):`, `fix(core):`). Use imperative mood, under 72 chars. If the PR spans multiple types, use the most significant one. Commit messages follow the same convention.

### PR Body Template

Fill in the template based on the analyzed changes. Remove HTML comments. Leave sections empty with "N/A" if not applicable. The `Fixes #` line should be omitted if there's no linked issue.

```markdown
Fixes #<issue number if known, otherwise remove this line>

### Motivation

<Why this change exists. Pull from changeset descriptions, commit messages, and diff analysis.
Be specific: does it solve a bug? Enable a new use-case? Improve DX?>

### Solution

<High-level description of what was done. Key technical decisions and their rationale.
Mention affected packages, architectural choices, trade-offs.>

### Open questions

<Any unresolved design questions, or "N/A" if none>
```

### Create Command

```bash
gh pr create --base master --title "<title>" --body "$(cat <<'EOF'
<body content>
EOF
)"
```

Capture the PR URL from the output.

## Step 7: Open in Browser

```bash
gh pr view --web
```
