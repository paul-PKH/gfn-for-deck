# GeForce NOW for Deck

A Decky Loader plugin that shows GeForce NOW game availability directly on your Steam Deck game pages with a visual indicator.

## Features

- **Visual Indicator**: Shows a green GFN logo when a game is available on GeForce NOW, greyed out when it's not
- **Hide Unavailable**: Option to only show the badge when a game *is* on GFN — no clutter for unsupported games
- **Customizable Display**: Adjust logo size, glow intensity, and position on the screen
- **Smart Caching**: Results are cached for 2 hours to reduce lookups and improve performance
- **Auto-Refresh**: Database automatically refreshes in the background on startup if empty or older than 7 days
- **Database Refresh**: Manually update the game list directly from your Steam Deck without reinstalling
- **Comprehensive Database**: 2,100+ games sourced from Steam curator pages
- **Lightweight**: Minimal impact on system resources

## Installation

### Prerequisites

- Steam Deck with Decky Loader installed
- Internet connection for database refreshes

### Installing via Decky Loader

1. Open Decky Loader on your Steam Deck (press ... button > Plugin icon)
2. Go to the Plugin Store
3. Search for "GeForce NOW for Deck"
4. Click Install

### Manual Installation

1. Download the latest release from the [Releases](https://github.com/paul-PKH/gfn-for-deck/releases) page
2. Extract the zip file to your Steam Deck
3. Copy the plugin folder to `~/homebrew/plugins/`
4. Restart Decky Loader

## Usage

1. Navigate to any game page in your Steam library
2. Look for the GFN logo indicator in the corner (default: top-right)
3. **Green logo** = Game is available on GeForce NOW
4. **Greyed out logo** = Game is not available on GeForce NOW
5. Enable **Hide Unavailable Games** in settings to only show the badge for supported games

### Settings

Access settings via the Decky Loader Quick Access Menu:

- **Enable GFN Indicator**: Toggle the indicator on/off
- **Hide Unavailable Games**: Only show the badge when a game is on GeForce NOW
- **Logo Size**: Adjust from 32px to 128px (default: 64px)
- **Glow Intensity**: Control the green glow effect from 0% to 100% (default: 50%)
- **Position**: Choose from 9 positions including corners, centers, and custom X/Y coordinates
  - Top Left, Top Right, Top Center
  - Bottom Left, Bottom Right, Bottom Center
  - Center Left, Center Right
  - Custom (X/Y) — set exact pixel position with sliders
- **Refresh Database**: Update the game list from Steam curators (takes 30–60 seconds)
- **Clear Cache**: Clear cached game availability data

## How It Works

The plugin checks game availability against a local database of 2,100+ GeForce NOW games:

1. **Data Source**: Game list is sourced from Steam curator pages:
   - [Geforce Now Friendly](https://store.steampowered.com/curator/38115929-Geforce-Now-Friendly/) (curator ID: 38115929)
   - [Geforce Now Friendly Part 2](https://store.steampowered.com/curator/45481916-Geforce-Now-Friendly-Part-2/) (curator ID: 45481916)

2. **Local Database**: Games are stored locally in `defaults/gfn_games.json` for instant lookups

3. **Auto-Refresh**: On startup the plugin checks if the database is missing or older than 7 days and refreshes it automatically in the background

4. **Smart Caching**: Results are cached for 2 hours to improve performance

5. **Manual Updates**: Use the "Refresh Database" button in settings to fetch the latest game list at any time

## Development

### Setup

```bash
# Clone the repository
git clone https://github.com/paul-PKH/gfn-for-deck.git
cd gfn-for-deck

# Install dependencies
pnpm install

# Build the plugin
pnpm run build

# Watch mode for development
pnpm run watch
```

### Project Structure

```
gfn-for-deck/
├── src/
│   ├── components/
│   │   ├── GFNLogo.tsx          # Logo overlay component
│   │   └── SettingsPanel.tsx    # Settings UI
│   ├── patches/
│   │   └── GamePagePatch.tsx    # Game page injection
│   ├── types.ts                 # TypeScript interfaces
│   └── index.tsx                # Main plugin entry
├── scripts/
│   └── update_games_db.py       # Standalone DB update script
├── main.py                      # Python backend
├── plugin.json                  # Plugin metadata
├── package.json                 # Node dependencies
└── README.md
```

### Backend API

The Python backend (`main.py`) exposes these methods to the frontend:

| Method | Description |
|---|---|
| `check_gfn_availability(appid)` | Check if a game is on GFN (uses cache) |
| `refresh_database()` | Fetch fresh game list from Steam curators |
| `get_settings()` | Retrieve current settings |
| `save_settings(settings)` | Persist settings to disk |
| `get_cache_stats()` | Get cache hit/miss statistics |
| `get_db_info()` | Get DB size, path, and last-updated timestamp |
| `clear_cache()` | Clear the in-memory availability cache |

### Testing

1. Build the plugin with `pnpm run build`
2. Copy to your Steam Deck's plugin directory (`~/homebrew/plugins/`)
3. Restart Decky Loader
4. Check logs at `~/homebrew/logs/`

## Data Sources

NVIDIA does not provide a public API for GeForce NOW game availability. This plugin relies on:

- **Steam Curator Data**: Community-maintained game lists from "Geforce Now Friendly" and "Geforce Now Friendly Part 2" curator pages
- **Local Storage**: Games stored in `defaults/gfn_games.json` for instant offline lookups
- **Auto + Manual Updates**: Database refreshes automatically on startup when stale, or manually via the settings panel

**Note**: Game availability data is maintained by the Steam curator community and may not be 100% up-to-date. Always verify on the [official GeForce NOW website](https://www.nvidia.com/en-us/geforce-now/games/).

## Privacy

- All game availability checks run against the local database — no external calls during normal use
- The "Refresh Database" feature fetches from public Steam curator pages only
- No personal data is collected or transmitted
- Cache is stored locally on your device only

## Troubleshooting

### Logo not appearing

1. Check that the plugin is enabled in settings
2. If "Hide Unavailable Games" is on, the badge won't show for unsupported games — that's expected
3. Try clearing the cache and navigating back to the game page
4. Check Decky Loader logs for errors

### Incorrect availability shown

1. Use "Refresh Database" in settings to pull the latest game list
2. Clear the cache so the next lookup reads from the fresh database
3. Verify on the [official GeForce NOW website](https://www.nvidia.com/en-us/geforce-now/games/)

### Database refresh fails

1. Check your internet connection
2. Wait a few minutes and try again (Steam may rate-limit requests)
3. Check Decky Loader logs for specific error messages

### Performance issues

1. Try disabling the glow effect (set intensity to 0%)
2. Reduce the logo size
3. Clear the cache if it has grown large

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request on [GitHub](https://github.com/paul-PKH/gfn-for-deck)

## License

This project is licensed under the BSD 3-Clause License — see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by the [HLTB for Deck](https://github.com/hulkrelax/hltb-for-deck) plugin
- Built with [Decky Loader](https://github.com/SteamDeckHomebrew/decky-loader)
- Game data from the community-maintained [Geforce Now Friendly](https://store.steampowered.com/curator/38115929) Steam curator pages

## Disclaimer

This plugin is not affiliated with, endorsed by, or sponsored by NVIDIA Corporation or Valve Corporation. GeForce NOW is a trademark of NVIDIA Corporation. Steam and Steam Deck are trademarks of Valve Corporation.
