---
name: hmix-github-mac-sync
description: Use when syncing the H/MIX GALLERY site between Windows and Mac through GitHub, including first-time repository setup, safe commit scope, push/pull flow, and deployment handoff checks.
---

# H/MIX GitHub Mac Sync

Use this skill when H/MIX GALLERY changes need to be shared through GitHub so another machine, especially a Mac, can continue the work.

## Rule

Do not stage everything blindly. This workspace may contain FTP secrets, deployment scratch files, generated archives, logs, and large media.

## Preflight

```powershell
git rev-parse --show-toplevel
git status --short --branch
git check-ignore -v .env.ftp music/n/n121.mp3
```

Confirm `.gitignore` excludes:

```gitignore
.env.ftp
node_modules/
*.log
.codegraph/
backups/
_archive_*/
music/
tools/upscaler/
theater/*/assets/audio/
```

## Windows To GitHub

```powershell
cd C:\Users\hiro\projects\hmix
git status --short
git add <changed-files>
git diff --cached --stat
git commit -m "<specific message>"
git push
```

## Mac Pull

```bash
git clone <github-repo-url> hmix
cd hmix
npm install
npm run dev
```

For an existing Mac checkout:

```bash
cd hmix
git pull --ff-only
npm install
npm run dev
```

Verify:

```text
http://127.0.0.1:4173/
http://127.0.0.1:4173/music-library.html
http://127.0.0.1:4173/royalty-free-music.html
```

## Deployment

Keep `.env.ftp` local. If the Mac deploys later, create its own local `.env.ftp`; do not commit secrets.
