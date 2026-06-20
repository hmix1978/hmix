# H/MIX GitHub Mac Sync

This repository syncs the editable H/MIX GALLERY site source through GitHub.

## Windows

```powershell
cd C:\Users\hiro\projects\hmix
git status
git add <changed-files>
git commit -m "<specific message>"
git push
```

## Mac

First checkout:

```bash
git clone <github-repo-url> hmix
cd hmix
npm install
npm run dev
```

Existing checkout:

```bash
cd hmix
git pull --ff-only
npm install
npm run dev
```

Open:

```text
http://127.0.0.1:4173/
http://127.0.0.1:4173/music-library.html
http://127.0.0.1:4173/royalty-free-music.html
```

## Notes

- `.env.ftp` is local-only and must not be committed.
- The full `music/` directory and large local tools are excluded from the normal GitHub source sync.
- If the Mac needs local audio playback, copy the audio assets separately or decide on a Git LFS setup.
- Deployment can remain on Windows unless the Mac has its own local FTP credentials.
