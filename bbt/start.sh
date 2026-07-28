#!/bin/bash
# Run this in a terminal (./start.sh) to check your changes in the browser
# instantly, with no build and no deploy step. On macOS, double-click
# start.command instead — Finder won't run .sh files directly.
#
# It starts Vite's dev server, which watches every file you edit and
# hot-reloads the browser automatically — this is the loop to use while
# working, saving Vercel for when you actually want a shareable public link.

cd "$(dirname "$0")"

if ! command -v npm >/dev/null 2>&1; then
  echo ""
  echo "ERROR: npm was not found on this computer."
  echo "Install Node.js from https://nodejs.org (it includes npm), then try again."
  echo ""
  read -p "Press Enter to close this window..."
  exit 1
fi

if [ ! -d "node_modules" ]; then
  echo "First run — installing dependencies (only happens once)..."
  if ! npm install; then
    echo ""
    echo "ERROR: npm install failed — see the messages above for why."
    echo ""
    read -p "Press Enter to close this window..."
    exit 1
  fi
fi

# Open the browser once the server is likely ready (Vite is fast, ~1s)
( sleep 1.5 && (open http://localhost:3000 2>/dev/null || xdg-open http://localhost:3000 2>/dev/null) ) &

npm run dev
echo ""
echo "The dev server stopped. If that's unexpected, scroll up to see why."
read -p "Press Enter to close this window..."
