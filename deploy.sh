#!/bin/bash
# Deploy GFN for Deck to Steam Deck over SSH
# Usage: ./deploy.sh <deck-ip>
# Example: ./deploy.sh 192.168.1.42

set -e

DECK_IP="${1}"
DECK_USER="deck"
PLUGIN_NAME="gfn-for-deck"
DEST="$DECK_USER@$DECK_IP:~/homebrew/plugins/$PLUGIN_NAME"

if [ -z "$DECK_IP" ]; then
  echo "Usage: ./deploy.sh <deck-ip>"
  echo "Example: ./deploy.sh 192.168.1.42"
  exit 1
fi

echo "Building plugin..."
npm run build

echo ""
echo "Syncing package folder..."
cp main.py gfn-for-deck-package/main.py
cp dist/index.js gfn-for-deck-package/dist/index.js
cp plugin.json gfn-for-deck-package/plugin.json
cp defaults/gfn_games.json gfn-for-deck-package/defaults/gfn_games.json

echo ""
echo "Deploying to $DECK_USER@$DECK_IP..."
# Use sudo rsync on the remote side so we can write to the root-owned plugin folder
# Exclude macOS-compiled .so files (won't load on Linux, pure Python fallback is used)
rsync -avz --delete \
  --rsync-path="sudo rsync" \
  --exclude='*.darwin*.so' \
  --exclude='.DS_Store' \
  gfn-for-deck-package/ \
  "$DEST/"

echo ""
echo "Restarting Decky plugin loader..."
ssh "$DECK_USER@$DECK_IP" "sudo systemctl restart plugin_loader"

echo ""
echo "Done! Plugin deployed to Steam Deck."
