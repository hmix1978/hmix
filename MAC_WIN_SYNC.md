# H/MIX Mac / Windows Sync

Last updated: 2026-06-07

This file is the standing communication protocol between the Windows-side Codex worktree and the Mac-side worktree. The goal is that Hiro does not need to mediate routine coordination.

## Source Of Truth

- GitHub is the exchange point once `origin` is configured.
- `main` is the shared branch unless a task explicitly needs a separate branch.
- `HANDOFF.md` is the current project state and next-action memo.
- `MAC_WIN_SYNC.md` is the operating agreement for both machines.
- `.env.ftp`, local logs, backups, large audio files, and local tool binaries stay outside Git.

## Start Of Every Session

Both Mac-side and Windows-side agents must do this first:

```bash
git status --short --branch
git pull --ff-only
```

If `git pull --ff-only` fails, stop and record the conflict in `HANDOFF.md` before editing.

## Before Editing

1. Read `HANDOFF.md`.
2. Read this file.
3. Confirm the task is not marked "hold".
4. Check the target files with `git status --short`.
5. Do not touch unrelated dirty files.

Current holds:

- `popular.html` / popular songs page content remains on hold until Hiro approves a direction.

## After Editing

Run the smallest useful checks:

```bash
npm run build:counts
```

On Windows PowerShell, use this when script execution blocks `npm`:

```powershell
npm.cmd run build:counts
```

Then update `HANDOFF.md` with:

- What changed
- Files touched
- Verification performed
- Known risks or unresolved items
- Whether deployment was done
- What the next machine should do

## Commit Pattern

Use small, descriptive commits:

```bash
git add <intended-files>
git diff --cached --stat
git commit -m "<clear change summary>"
git push
```

Do not use `git add .` unless `.gitignore` has been checked and the staged file list has been reviewed.

## Conflict Protocol

If Mac and Windows both changed the same area:

1. Do not force push.
2. Do not reset or checkout away another side's work.
3. Write the conflict summary into `HANDOFF.md`.
4. Prefer a follow-up merge commit after reviewing both intentions.

## Deployment Protocol

- Production deployment can remain Windows-side unless Mac has its own local FTP credentials.
- Never commit `.env.ftp`.
- After deployment, record the deployed file list and production verification URLs in `HANDOFF.md`.

## Large Assets

The normal GitHub source sync excludes:

```text
music/
tools/upscaler/
theater/*/assets/audio/
*.wav
*.exe
*.zip
```

If Mac needs local audio playback, copy those assets outside Git or make an explicit Git LFS plan.

## Handoff Template

Append or replace the current status block in `HANDOFF.md` with:

```markdown
## Current Handoff - YYYY-MM-DD - Mac/Windows

Owner side: Windows or Mac
Branch: main
Latest commit: <hash> <message>

### Done
- ...

### Verification
- ...

### Deployment
- Done / Not done
- URLs checked:

### Next
- ...

### Risks / Holds
- ...
```
