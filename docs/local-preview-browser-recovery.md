# Local Preview / Browser Recovery Memo

Date: 2026-06-10

## What Happened

Recent Codex-side checks failed in two different ways:

- The in-app Browser skill instructions pointed at an old bundled Browser plugin path.
- Local server checks failed or lost CSS when pages were opened as `file://` or when Node was started as a hidden background process.

## Findings

- `file:///C:/Users/hiro/projects/hmix/music-library.html` is not a valid visual QA route for the current site. Root-relative assets such as `/assets/css/...` do not resolve correctly there.
- The Browser plugin cache had moved from an older version path to a newer folder under:
  `C:/Users/hiro/.codex/plugins/cache/openai-bundled/browser/`
- Dynamically discovering the newest Browser folder and importing its `scripts/browser-client.mjs` successfully restored Browser control.
- Opening a new in-app browser tab worked better than navigating an existing Chrome error `data:` page, which can be blocked by Browser URL policy.
- `node_repl` can host a stable lightweight static server for Codex verification. In this session, `http://127.0.0.1:4214/music-library.html` worked and loaded CSS.
- Windows process environment had both `Path` and `PATH`; some PowerShell env and `Start-Process` flows can fail or behave inconsistently.
- Hidden Node background processes were unreliable when stdout logging was involved. `scripts/dev-static-server.js --quiet` was added to suppress startup logging.
- Hidden Python `http.server` processes launched from Codex can appear to start but fail to respond. Do not give Hiro a localhost URL until a shell `Invoke-WebRequest` returns HTTP 200.

## Practical Recovery Steps

1. Do not inspect H/MIX pages through `file://` when CSS/JS matters.
2. Serve the repo through HTTP and open `http://127.0.0.1:<port>/...`.
3. If a normal background server is flaky, start a small static server in the persistent `node_repl` kernel.
4. Reconnect Browser by discovering the latest Browser plugin folder instead of using a fixed version path.
5. Open a fresh in-app Browser tab for localhost URLs.

## Current Preferred Route

For quick H/MIX TOP checks, use the persistent `node_repl` server route first:

1. Start a static server in `node_repl` on `127.0.0.1:4214`, serving `C:/Users/hiro/projects/hmix`.
2. Confirm with:

```powershell
Invoke-WebRequest -Uri 'http://127.0.0.1:4214/' -UseBasicParsing -TimeoutSec 5
```

3. Dynamically load the newest Browser plugin client from:

```text
C:/Users/hiro/.codex/plugins/cache/openai-bundled/browser/<latest>/scripts/browser-client.mjs
```

4. Open a fresh in-app Browser tab to:

```text
http://127.0.0.1:4214/
```

Do not fall back to `Start-Process` + hidden Python `http.server` unless the `node_repl` route is unavailable.

## Verification From This Session

- Shell request to `http://127.0.0.1:4214/music-library.html` returned HTTP 200.
- In-app Browser opened `http://127.0.0.1:4214/music-library.html`.
- Browser-side checks reported:
  - `h1`: `フリーBGM一覧`
  - `stylesheetCount`: `14`
  - JS-rendered grid children: `24`
  - static fallback cards after JS: `0`

## Related Repo Change

## Verification Update 2026-06-20

- `Start-Process` with hidden Python `http.server` failed because of a Windows `Path` / `PATH` duplicate-key issue, and a later Python process on `8021` did not respond.
- Persistent `node_repl` static server on `http://127.0.0.1:4214/` returned HTTP 200.
- In-app Browser opened `http://127.0.0.1:4214/` successfully after loading the latest Browser plugin client dynamically.
- DOM check on the TOP theater entrance confirmed:
  - `video.poster`: `/assets/images/hero/theater-entrance-journey-poster.jpg`
  - `source`: `/assets/video/theater-entrance-journey.mp4?v=20260617b`
  - `#theaterHeroBg` fallback image: `/assets/images/hero/theater-entrance-journey-poster.jpg`

`scripts/dev-static-server.js` now supports:

```powershell
node scripts/dev-static-server.js 4173 --quiet
```

The package script is:

```powershell
npm run dev:quiet
```
