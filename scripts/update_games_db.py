#!/usr/bin/env python3
"""
Script to update the GFN games database from online sources.

This script fetches the current list of GeForce NOW supported games
and updates the local database file.
"""

import json
import requests
from datetime import datetime
from pathlib import Path


def fetch_from_cloudbase():
    """
    Fetch games list from Cloudbase.gg

    Note: This is a placeholder - adjust based on actual API structure
    """
    print("Fetching from Cloudbase.gg...")

    try:
        # Example endpoint - adjust based on actual API
        response = requests.get(
            "https://static.nvidiagrid.net/supported-public-game-list/gfnpc.json",
            timeout=30
        )

        if response.status_code == 200:
            data = response.json()
            games = {}

            # Parse the response - adjust based on actual structure
            # NVIDIA's actual list format may vary
            for item in data:
                steam_app_id = item.get("steamAppId") or item.get("id")
                if steam_app_id:
                    games[str(steam_app_id)] = {
                        "name": item.get("title", "Unknown"),
                        "available": True
                    }

            print(f"Found {len(games)} games from Cloudbase")
            return games
        else:
            print(f"Failed to fetch: HTTP {response.status_code}")
            return None

    except Exception as e:
        print(f"Error fetching from Cloudbase: {e}")
        return None


def fetch_from_nvidia():
    """
    Fetch games list directly from NVIDIA's public list
    """
    print("Fetching from NVIDIA...")

    try:
        # NVIDIA maintains a public JSON list
        response = requests.get(
            "https://static.nvidiagrid.net/supported-public-game-list/gfnpc.json",
            timeout=30
        )

        if response.status_code == 200:
            data = response.json()
            games = {}

            # Parse NVIDIA's format
            for item in data:
                # Look for Steam app ID in various fields
                steam_id = None

                if "steamAppId" in item:
                    steam_id = str(item["steamAppId"])
                elif "id" in item and "steam" in item.get("store", "").lower():
                    steam_id = str(item["id"])

                if steam_id and steam_id != "0":
                    games[steam_id] = {
                        "name": item.get("title", "Unknown Game"),
                        "available": True
                    }

            print(f"Found {len(games)} games from NVIDIA")
            return games
        else:
            print(f"Failed to fetch: HTTP {response.status_code}")
            return None

    except Exception as e:
        print(f"Error fetching from NVIDIA: {e}")
        return None


def update_database(games_dict, output_path):
    """Update the local games database file"""

    database = {
        "comment": "Auto-generated list of GFN-supported games. Do not edit manually - run update script instead.",
        "last_updated": datetime.now().strftime("%Y-%m-%d"),
        "games": games_dict,
        "notes": [
            "This file serves as a fallback when external APIs are unavailable",
            "Updated by scripts/update_games_db.py",
            "Format: Steam AppID as key, with name and availability status"
        ]
    }

    with open(output_path, 'w') as f:
        json.dump(database, f, indent=2, sort_keys=True)

    print(f"\n✓ Database updated: {output_path}")
    print(f"✓ Total games: {len(games_dict)}")


def main():
    print("GFN Games Database Updater")
    print("=" * 50)

    # Try NVIDIA first (most reliable)
    games = fetch_from_nvidia()

    # Fallback to other sources if needed
    if not games or len(games) < 100:
        print("\nTrying alternative sources...")
        games = fetch_from_cloudbase()

    if not games:
        print("\n✗ Failed to fetch games from any source")
        print("\nManual alternatives:")
        print("1. Visit: https://www.nvidia.com/en-us/geforce-now/games/")
        print("2. Check: https://cloudbase.gg/geforce-now-games/")
        print("3. Manually populate defaults/gfn_games.json")
        return 1

    # Determine output path
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    output_path = project_root / "defaults" / "gfn_games.json"

    # Update the database
    update_database(games, output_path)

    print("\n✓ Update complete!")
    return 0


if __name__ == "__main__":
    exit(main())
