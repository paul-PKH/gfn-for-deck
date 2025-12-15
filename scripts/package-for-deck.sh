#!/bin/bash
# Package the plugin for manual installation on Steam Deck

echo "Packaging GFN for Deck plugin..."
echo "================================"

# Build the plugin
echo "Building plugin..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

# Bundle Python dependencies
echo "Bundling Python dependencies..."
bash scripts/bundle-python-deps.sh

# Create package directory
PACKAGE_DIR="gfn-for-deck-package"
rm -rf "$PACKAGE_DIR"
mkdir -p "$PACKAGE_DIR"

# Copy necessary files
echo "Copying files..."
cp -r dist "$PACKAGE_DIR/"
cp plugin.json "$PACKAGE_DIR/"
cp main.py "$PACKAGE_DIR/"
cp -r defaults "$PACKAGE_DIR/"
cp -r py_modules "$PACKAGE_DIR/"

# Create installation instructions
cat > "$PACKAGE_DIR/INSTALL.txt" << 'EOF'
GFN for Deck - Manual Installation Instructions
================================================

1. Copy this entire folder to your Steam Deck (via USB or any method)

2. On Steam Deck, switch to Desktop Mode

3. Open Konsole (terminal) and run these commands:

   # Navigate to where you copied this folder
   cd ~/Desktop/gfn-for-deck-package  # adjust path if needed

   # Create plugin directory
   mkdir -p ~/homebrew/plugins/gfn-for-deck

   # Copy files
   sudo cp -r dist plugin.json main.py defaults py_modules ~/homebrew/plugins/gfn-for-deck/

4. Switch back to Gaming Mode

5. Open Quick Access Menu (...) → Decky Loader (plug icon)

6. Go to Settings → "Reload Plugins"

7. You should now see "GFN for Deck" in your plugins!

Troubleshooting:
- If plugin doesn't appear, check: ~/homebrew/logs/decky.log
- Make sure Decky Loader is installed: https://decky.xyz/
- Check files are in: ~/homebrew/plugins/gfn-for-deck/

Enjoy!
EOF

# Create zip file
echo "Creating zip file..."
zip -r gfn-for-deck-package.zip "$PACKAGE_DIR"

echo ""
echo "✅ Package created successfully!"
echo ""
echo "📦 Files ready in: $PACKAGE_DIR/"
echo "📦 Zip file: gfn-for-deck-package.zip"
echo ""
echo "Next steps:"
echo "1. Copy 'gfn-for-deck-package.zip' to your Steam Deck via USB"
echo "2. On Deck: Unzip and follow the INSTALL.txt instructions"
echo ""
