# GeForce NOW for Deck

A Decky Loader plugin that shows GeForce NOW game availability directly on your Steam Deck game pages with a visual indicator.

## Features

- **Visual Indicator**: Shows a green GFN logo when a game is available on GeForce NOW, greyed out when it's not
- **Customizable Display**: Adjust logo size, glow intensity, and position on the screen
- **Smart Caching**: Results are cached for 2 hours to reduce API calls and improve performance
- **Database Refresh**: Update game list directly from Steam Deck without reinstalling the plugin
- **Comprehensive Database**: 2,100+ games sourced from Steam curator pages
- **Lightweight**: Minimal impact on system resources

## Installation

### Prerequisites

- Steam Deck with Decky Loader installed
- Internet connection for checking game availability

### Installing via Decky Loader

1. Open Decky Loader on your Steam Deck (press ... button > Plugin icon)
2. Go to the Plugin Store
3. Search for "GeForce NOW for Deck"
4. Click Install

### Manual Installation

1. Download the latest release from the [Releases](https://github.com/yourusername/gfn-decky/releases) page
2. Extract the zip file to your Steam Deck
3. Copy the plugin folder to `~/homebrew/plugins/`
4. Restart Decky Loader

## Usage

1. Navigate to any game page in your Steam library
2. Look for the GFN logo indicator in the corner (default: top-right)
3. **Green logo** = Game is available on GeForce NOW
4. **Greyed out logo** = Game is not available on GeForce NOW

### Settings

Access settings via the Decky Loader Quick Access Menu:

- **Enable GFN Indicator**: Toggle the indicator on/off
- **Logo Size**: Adjust from 32px to 128px (default: 64px)
- **Glow Intensity**: Control the green glow effect from 0% to 100% (default: 50%)
- **Position**: Choose from 9 positions including corners, centers, and custom X/Y coordinates
  - Top Left, Top Right, Top Center
  - Bottom Left, Bottom Right, Bottom Center
  - Center Left, Center Right
  - Custom (X/Y) - Set exact pixel position with sliders
- **Refresh Database**: Update the game list from Steam curators (takes 30-60 seconds)
- **Clear Cache**: Clear cached game availability data

## How It Works

The plugin checks game availability against a local database of 2,100+ GeForce NOW games:

1. **Data Source**: Game list is sourced from Steam curator pages:
   - [Geforce Now Friendly](https://store.steampowered.com/curator/38115929-Geforce-Now-Friendly/) (curator ID: 38115929)
   - [Geforce Now Friendly Part 2](https://store.steampowered.com/curator/45481916-Geforce-Now-Friendly-Part-2/) (curator ID: 45481916)

2. **Local Database**: Games are stored locally in `defaults/gfn_games.json` for instant lookups

3. **Smart Caching**: Results are cached for 2 hours to improve performance

4. **Updates**: Use the "Refresh Database" button to fetch the latest games from Steam curators without reinstalling the plugin

## Development

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/gfn-decky.git
cd gfn-decky

# Install dependencies
pnpm install

# Build the plugin
pnpm run build

# Watch mode for development
pnpm run watch
```

### Project Structure

```
gfn-decky/
├── src/
│   ├── components/
│   │   ├── GFNLogo.tsx          # Logo overlay component
│   │   └── SettingsPanel.tsx    # Settings UI
│   ├── patches/
│   │   └── GamePagePatch.tsx    # Game page injection
│   ├── types.ts                 # TypeScript interfaces
│   └── index.tsx                # Main plugin entry
├── main.py                      # Python backend
├── plugin.json                  # Plugin metadata
├── package.json                 # Node dependencies
└── README.md
```

### Backend API

The Python backend (`main.py`) provides these methods:

- `check_gfn_availability(appid)`: Check if a game is on GFN
- `refresh_database()`: Fetch fresh game list from Steam curators
- `get_settings()`: Retrieve current settings
- `save_settings(settings)`: Persist settings
- `get_cache_stats()`: Get cache statistics
- `get_db_info()`: Get database information (size, keys)
- `clear_cache()`: Clear the cache

### Testing

To test the plugin locally:

1. Build the plugin with `pnpm run build`
2. Copy to your Steam Deck's plugin directory
3. Restart Decky Loader
4. Check the logs at `~/homebrew/logs/`

## Data Sources

This plugin uses a local database sourced from Steam curator pages. Since NVIDIA doesn't provide a public API for checking GFN game availability, the plugin relies on:

- **Steam Curator Data**: Game lists from "Geforce Now Friendly" and "Geforce Now Friendly Part 2" curator pages
- **Local Storage**: Games stored in `defaults/gfn_games.json` for instant lookups
- **Manual Updates**: Use the "Refresh Database" button to get the latest games

### Updating the Game Database

The database can be updated in two ways:

1. **From Steam Deck**: Use the "Refresh Database" button in plugin settings
2. **Manual Script**: Run `python3 scripts/fetch_curator_games.py` on your development machine

**Note**: Game availability data is maintained by the Steam curator community and may not be 100% up-to-date. Always verify on the official GeForce NOW website.

## Privacy

- All game checks are done against the local database - no external API calls during normal operation
- The "Refresh Database" feature fetches data from Steam curator pages (public data only)
- No personal data is collected or transmitted
- Cache is stored locally on your device

## Troubleshooting

### Logo not appearing

1. Check that the plugin is enabled in settings
2. Try clearing the cache
3. Check Decky Loader logs for errors

### Incorrect availability shown

1. Try refreshing the database using the "Refresh Database" button in settings
2. Clear the cache to refresh lookups
3. Wait a few seconds and navigate back to the game page
4. Verify on the official GeForce NOW website

### Database refresh fails

1. Check your internet connection
2. Wait a few minutes and try again (Steam may be rate-limiting)
3. Check Decky Loader logs for specific error messages

### Performance issues

1. Try disabling the glow effect (set intensity to 0%)
2. Reduce the logo size
3. Clear the cache if it's grown too large

## Known Issues

### Icon/Logo Not Displaying

**Status**: Currently working on this issue

The NVIDIA GeForce NOW logo may not appear on game pages in some cases. This is being investigated and will be fixed in an upcoming release.

**Workaround**:
- Ensure the plugin is enabled in settings
- Try refreshing the page or navigating to a different game and back
- Check Decky Loader logs at `~/homebrew/logs/` for any error messages

If you encounter this issue, please report it with details on the [Issues page](https://github.com/paul-PKH/gfn-for-deck/issues).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the BSD 3-Clause License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by the [HLTB for Deck](https://github.com/hulkrelax/hltb-for-deck) plugin
- Built with [Decky Loader](https://github.com/SteamDeckHomebrew/decky-loader)
- Game data from community-maintained sources

## Disclaimer

This plugin is not affiliated with, endorsed by, or sponsored by NVIDIA Corporation or Valve Corporation. GeForce NOW is a trademark of NVIDIA Corporation. Steam and Steam Deck are trademarks of Valve Corporation.
