# Scripts

Utility scripts for maintaining the GFN for Deck plugin.

## update_games_db.py

Automatically updates the local games database with the latest GeForce NOW supported games.

### Usage

```bash
# From the project root
python3 scripts/update_games_db.py

# Or make it executable and run directly
chmod +x scripts/update_games_db.py
./scripts/update_games_db.py
```

### What It Does

1. Fetches the current list of GFN-supported games from NVIDIA's public API
2. Extracts Steam App IDs and game names
3. Updates `defaults/gfn_games.json` with the latest data
4. Timestamps the update

### Data Sources

The script tries multiple sources in order:

1. **NVIDIA's public JSON list** (Primary)
   - URL: `https://static.nvidiagrid.net/supported-public-game-list/gfnpc.json`
   - Most reliable and up-to-date

2. **Cloudbase.gg API** (Fallback)
   - Community-maintained alternative
   - Used if NVIDIA's list is unavailable

### Requirements

```bash
pip install requests
```

### Output

```
GFN Games Database Updater
==================================================
Fetching from NVIDIA...
Found 1523 games from NVIDIA

✓ Database updated: defaults/gfn_games.json
✓ Total games: 1523

✓ Update complete!
```

### Scheduling Updates

To keep the database current, schedule regular updates:

```bash
# Add to crontab (weekly updates on Sundays at 3 AM)
0 3 * * 0 cd /path/to/gfn-decky && python3 scripts/update_games_db.py

# Or run manually before building/deploying
make update-db  # (if you add this to Makefile)
```

### Troubleshooting

**No games fetched:**
- Check your internet connection
- Verify the API URLs are still valid
- Try visiting the URLs in a browser
- Manually populate the database as fallback

**Wrong data format:**
- NVIDIA may change their API structure
- Update the parsing logic in the script
- Open an issue on GitHub

### Manual Alternative

If the script doesn't work, you can manually populate the database:

1. Visit: https://www.nvidia.com/en-us/geforce-now/games/
2. Or check: https://cloudbase.gg/geforce-now-games/
3. Find Steam App IDs from Steam store URLs
4. Add to `defaults/gfn_games.json`:

```json
{
  "games": {
    "APPID": {
      "name": "Game Name",
      "available": true
    }
  }
}
```
