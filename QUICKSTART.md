# Quick Start Guide

Get your GeForce NOW for Deck plugin up and running in minutes!

## Prerequisites

Before you begin, make sure you have:
- A Steam Deck
- Decky Loader installed ([Installation Guide](https://github.com/SteamDeckHomebrew/decky-loader))
- Internet connection

## Installation Steps

### 1. Install Dependencies

```bash
# On your development machine
cd /path/to/gfn-decky
pnpm install
```

### 2. Build the Plugin

```bash
# Build the plugin
pnpm run build

# Or use make
make build
```

This will create a `dist/` directory with the compiled frontend code.

### 3. Deploy to Steam Deck

You have two options:

#### Option A: Using Make (requires SSH setup)

```bash
# Set your Steam Deck's IP address and deploy
make deploy DECK_IP=192.168.1.100
```

#### Option B: Manual Deployment

1. Copy the plugin files to your Steam Deck:
   ```bash
   scp -r dist plugin.json main.py requirements.txt defaults deck@YOUR_DECK_IP:~/homebrew/plugins/gfn-for-deck/
   ```

2. SSH into your Steam Deck:
   ```bash
   ssh deck@YOUR_DECK_IP
   ```

3. Install Python dependencies:
   ```bash
   cd ~/homebrew/plugins/gfn-for-deck
   pip install -r requirements.txt
   ```

4. Restart Decky Loader:
   - Press the ... button on your Steam Deck
   - Go to Decky settings
   - Click "Reload Plugins" or restart Decky Loader

## First Use

1. **Open Decky Loader**
   - Press the ... button on your Steam Deck
   - Click the plug icon to open Decky Loader

2. **Find GFN for Deck**
   - Scroll to find "GFN for Deck" in the plugin list
   - Click it to open settings

3. **Configure Settings** (Optional)
   - Enable/disable the indicator
   - Adjust logo size (32-128px)
   - Set glow intensity (0-100%)
   - Choose corner position

4. **Test It Out**
   - Navigate to any game page in your Steam library
   - Look for the GFN logo in the corner you selected
   - Green = Available on GeForce NOW
   - Grey = Not available

## Development Workflow

### Watch Mode

For active development, use watch mode to automatically rebuild on changes:

```bash
pnpm run watch
```

Then manually copy files to your Steam Deck after each change, or use a sync tool.

### Testing

1. Make changes to the code
2. Build: `pnpm run build`
3. Deploy to Steam Deck
4. Check logs: `ssh deck@YOUR_DECK_IP "tail -f ~/homebrew/logs/gfn-for-deck.log"`

## Updating the Games Database

To add games to the local fallback database:

1. Edit `defaults/gfn_games.json`
2. Add Steam App IDs with their availability status:
   ```json
   {
     "games": {
       "271590": {
         "name": "Grand Theft Auto V",
         "available": true
       }
     }
   }
   ```
3. Rebuild and redeploy

## Finding Steam App IDs

To find a game's Steam App ID:

1. Visit the game's Steam store page
2. Look at the URL: `https://store.steampowered.com/app/APPID/GameName`
3. The number after `/app/` is the App ID

Example: GTA V = https://store.steampowered.com/app/271590/ = `271590`

## Troubleshooting

### Plugin not showing up
- Check Decky Loader is installed and running
- Verify files are in `~/homebrew/plugins/gfn-for-deck/`
- Check logs: `~/homebrew/logs/`

### Logo not appearing on game pages
- Open plugin settings and ensure it's enabled
- Try clearing the cache
- Check the position setting matches where you're looking

### Build errors
- Delete `node_modules` and run `pnpm install` again
- Make sure you have the latest version of Node.js (18+)
- Check for TypeScript errors in your IDE

### Network errors
- The plugin needs internet to check game availability
- Check your Steam Deck's network connection
- The local database will be used as fallback if network fails

## Next Steps

- Customize the appearance in settings
- Add more games to the local database
- Check out the [README](README.md) for detailed documentation
- Report issues on GitHub

## Need Help?

- Check the [README](README.md) for detailed information
- Review Decky Loader documentation
- Open an issue on GitHub

Happy gaming with GeForce NOW!
