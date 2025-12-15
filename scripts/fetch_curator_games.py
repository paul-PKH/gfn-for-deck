#!/usr/bin/env python3
"""
Fetch GeForce NOW supported games from Steam curator pages.
Creates a comprehensive database from:
- Geforce Now Friendly (curator ID: 38115929) - Games 1-2000
- Geforce Now Friendly Part 2 (curator ID: 45481916) - Games 2001+
"""

import requests
import re
import json
import time
from pathlib import Path

# Curator IDs
CURATOR_IDS = [
    38115929,  # Geforce Now Friendly (original)
    45481916,  # Geforce Now Friendly Part 2
]

def fetch_curator_games(curator_id, batch_size=100):
    """Fetch all games from a Steam curator."""
    games = {}
    start = 0

    print(f"Fetching games from curator {curator_id}...")

    while True:
        url = f"https://store.steampowered.com/curator/{curator_id}/ajaxgetfilteredrecommendations/render/?query=&start={start}&count={batch_size}"

        try:
            response = requests.get(url, timeout=10)
            data = response.json()

            html = data.get('results_html', '')
            total_count = int(data.get('total_count', 0))

            # Extract app IDs from HTML
            appids = list(set(re.findall(r'data-ds-appid="(\d+)"', html)))

            if not appids:
                break

            print(f"  Fetched {len(appids)} games (offset {start}/{total_count})")

            # Add to games dict
            for appid in appids:
                games[appid] = {
                    "available": True,
                    "curator_id": curator_id
                }

            start += batch_size

            # Stop if we've fetched everything
            if start >= total_count:
                break

            # Be nice to Steam's servers
            time.sleep(0.5)

        except Exception as e:
            print(f"  Error: {e}")
            break

    return games

def main():
    """Main function to fetch and save all curator games."""
    all_games = {}

    # Fetch from all curator pages
    for curator_id in CURATOR_IDS:
        games = fetch_curator_games(curator_id)
        all_games.update(games)
        print(f"Total games from curator {curator_id}: {len(games)}")

    print(f"\nTotal unique games: {len(all_games)}")

    # Create output structure
    output = {
        "comment": "GeForce NOW supported games from Steam curators",
        "last_updated": time.strftime("%Y-%m-%d"),
        "sources": [
            {"curator_id": 38115929, "name": "Geforce Now Friendly"},
            {"curator_id": 45481916, "name": "Geforce Now Friendly Part 2"}
        ],
        "games": {
            appid: {"name": f"Game {appid}", "available": True}
            for appid in sorted(all_games.keys())
        }
    }

    # Save to defaults directory
    script_dir = Path(__file__).parent
    project_dir = script_dir.parent
    defaults_dir = project_dir / "defaults"
    defaults_dir.mkdir(exist_ok=True)

    output_path = defaults_dir / "gfn_games.json"

    with open(output_path, 'w') as f:
        json.dump(output, f, indent=2)

    print(f"\nSaved {len(all_games)} games to {output_path}")
    print("\nSample games:")
    for appid in list(sorted(all_games.keys()))[:5]:
        print(f"  - {appid}")

if __name__ == "__main__":
    main()
