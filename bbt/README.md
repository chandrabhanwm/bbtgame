<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/7a50fc05-8958-40d7-a656-237966beafde

## Run Locally

**Prerequisites:**  Node.js

**Fastest way — no build, no deploy, just check the browser:**
- **Mac:** double-click `start.command` (macOS only treats `.command` files as double-clickable — `.sh` files open in a text editor instead)
- **Windows:** double-click `start.bat`
- **Linux / prefer a terminal:** run `./start.sh`

The first time macOS runs it you may see "cannot be opened because it is from an unidentified developer" — right-click `start.command` → Open once to approve it, then double-clicking works normally after that.

Any of these installs dependencies on first run, starts the dev server, and opens your browser automatically. Every file you save hot-reloads instantly — this is the loop to use while iterating. Save deploying to Vercel for when you actually want a shareable public URL, not for checking every small change.

**Manual steps (same thing, if you'd rather run it yourself):**
1. Install dependencies:
   `npm install`
2. Run the app:
   `npm run dev`
3. Open the URL it prints (usually `http://localhost:3000`)
