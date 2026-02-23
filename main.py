import asyncio
import json
import logging
import os
import requests
import re
import time
from typing import Optional, Dict
from datetime import datetime, timedelta
from pathlib import Path

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Curator IDs for GeForce NOW game lists
CURATOR_IDS = [
    38115929,  # Geforce Now Friendly (original)
    45481916,  # Geforce Now Friendly Part 2
]


def fetch_curator_games(curator_id: int, batch_size: int = 100) -> Dict[str, Dict]:
    """Fetch all games from a Steam curator."""
    games = {}
    start = 0

    logger.info(f"Fetching games from curator {curator_id}...")

    while True:
        url = f"https://store.steampowered.com/curator/{curator_id}/ajaxgetfilteredrecommendations/render/?query=&start={start}&count={batch_size}"

        # Retry the HTTP fetch up to 3 times with exponential backoff
        data = None
        for attempt in range(3):
            try:
                response = requests.get(url, timeout=10)
                data = response.json()
                break  # success — exit retry loop
            except Exception as e:
                wait = 2 ** attempt  # 1s, 2s, 4s
                logger.warning(f"  Attempt {attempt + 1}/3 failed for curator {curator_id}: {e}. Retrying in {wait}s...")
                if attempt < 2:
                    time.sleep(wait)
                else:
                    logger.error(f"  All retries exhausted for curator {curator_id} at offset {start}")

        if data is None:
            break  # all retries failed — stop pagination

        html = data.get('results_html', '')
        total_count = int(data.get('total_count', 0))

        # Extract app IDs from HTML
        appids = list(set(re.findall(r'data-ds-appid="(\d+)"', html)))

        if not appids:
            break

        logger.info(f"  Fetched {len(appids)} games (offset {start}/{total_count})")

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

    return games


def fetch_gfn_status(appid: str, local_games_db: Dict[str, Dict]) -> bool:
    """
    Check GFN status from local database (standalone function)

    Uses local database sourced from Steam curator "Geforce Now Friendly" pages.

    Args:
        appid: Steam app ID
        local_games_db: Local games database

    Returns:
        True if game is available on GFN, False otherwise
    """
    logger.info(f"Checking local database for appid {appid}...")
    logger.info(f"Database has {len(local_games_db)} games")

    if appid in local_games_db:
        game_data = local_games_db[appid]
        is_available = game_data.get('available', False)
        logger.info(f"Found {appid} in local database: {is_available}")
        return is_available
    else:
        logger.info(f"Game {appid} not found in database")

    return False


class Plugin:
    """GeForce NOW availability checker plugin for Steam Deck"""

    # GFN availability cache: {appid: {"available": bool, "timestamp": datetime}}
    _cache: Dict[str, Dict] = {}
    _cache_duration = timedelta(hours=2)

    # Settings
    _settings: Dict[str, any] = {
        "logoSize": 64,
        "glowIntensity": 50,
        "position": "top-right",
        "enabled": True
    }
    _settings_path: Optional[Path] = None

    # Local games database
    _local_games_db: Dict[str, Dict] = {}
    _db_last_updated: Optional[str] = None
    _db_lock: Optional[asyncio.Lock] = None
    _plugin_dir: Optional[Path] = None

    async def check_gfn_availability(self, appid: str) -> Dict[str, any]:
        """
        Check if a game is available on GeForce NOW

        Args:
            appid: Steam app ID

        Returns:
            Dictionary with 'available' (bool) and 'cached' (bool) keys
        """
        logger.info(f"Checking GFN availability for app {appid}")

        # Check cache first
        if appid in self._cache:
            cached_data = self._cache[appid]
            cache_age = datetime.now() - cached_data["timestamp"]

            if cache_age < self._cache_duration:
                logger.info(f"Returning cached result for app {appid}")
                return {
                    "available": cached_data["available"],
                    "cached": True
                }

        # Fetch fresh data
        try:
            # Call standalone function instead of method
            available = fetch_gfn_status(appid, self._local_games_db)

            # Update cache
            self._cache[appid] = {
                "available": available,
                "timestamp": datetime.now()
            }

            return {
                "available": available,
                "cached": False
            }
        except Exception as e:
            logger.error(f"Error checking GFN availability for {appid}: {e}")
            # Return cached data if available, even if expired
            if appid in self._cache:
                return {
                    "available": self._cache[appid]["available"],
                    "cached": True,
                    "error": str(e)
                }
            return {
                "available": False,
                "cached": False,
                "error": str(e)
            }

    async def clear_cache(self) -> Dict[str, str]:
        """Clear the GFN availability cache"""
        count = len(self._cache)
        self._cache.clear()
        logger.info(f"Cleared {count} cached entries")
        return {"status": "success", "cleared": count}

    async def get_cache_stats(self) -> Dict[str, any]:
        """Get cache statistics"""
        total = len(self._cache)
        expired = sum(
            1 for data in self._cache.values()
            if datetime.now() - data["timestamp"] >= self._cache_duration
        )

        return {
            "total": total,
            "expired": expired,
            "fresh": total - expired
        }

    async def get_db_info(self) -> Dict[str, any]:
        """Get local database info for debugging"""
        return {
            "db_size": len(self._local_games_db),
            "plugin_dir": str(self._plugin_dir) if self._plugin_dir else None,
            "last_updated": self._db_last_updated
        }

    async def refresh_database(self) -> Dict[str, any]:
        """Refresh the games database from Steam curator pages"""
        try:
            logger.info("Starting database refresh from Steam curators...")

            # Fetch from all curator pages in a thread to avoid blocking
            all_games = {}

            for curator_id in CURATOR_IDS:
                # Run the blocking HTTP requests in a thread pool
                games = await asyncio.to_thread(fetch_curator_games, curator_id)
                all_games.update(games)
                logger.info(f"Fetched {len(games)} games from curator {curator_id}")

            logger.info(f"Total unique games fetched: {len(all_games)}")

            # Update in-memory database (lock protects the swap)
            old_count = len(self._local_games_db)
            async with self._db_lock:
                self._local_games_db = all_games
            new_count = len(self._local_games_db)

            # Save to file
            if self._plugin_dir:
                db_path = self._plugin_dir / "defaults" / "gfn_games.json"

                # Ensure defaults directory exists and is writable
                defaults_dir = self._plugin_dir / "defaults"
                defaults_dir.mkdir(parents=True, exist_ok=True)

                last_updated = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                output = {
                    "comment": "GeForce NOW supported games from Steam curators",
                    "last_updated": last_updated,
                    "sources": [
                        {"curator_id": 38115929, "name": "Geforce Now Friendly"},
                        {"curator_id": 45481916, "name": "Geforce Now Friendly Part 2"}
                    ],
                    "games": {
                        appid: {"available": True}
                        for appid in sorted(all_games.keys())
                    }
                }
                self._db_last_updated = last_updated

                try:
                    with open(db_path, 'w') as f:
                        json.dump(output, f, indent=2)
                    logger.info(f"Database saved to {db_path}")
                except PermissionError as e:
                    logger.error(f"Permission denied writing to {db_path}: {e}")
                    logger.error("Database updated in memory but could not save to file")
                    # Don't fail the whole operation - the in-memory update succeeded

            # Clear cache since we have fresh data
            self._cache.clear()

            return {
                "status": "success",
                "old_count": old_count,
                "new_count": new_count,
                "added": new_count - old_count
            }

        except Exception as e:
            logger.error(f"Error refreshing database: {e}")
            return {
                "status": "error",
                "message": str(e)
            }

    async def get_settings(self) -> Dict[str, any]:
        """Get current settings"""
        return self._settings

    async def save_settings(self, settings: Dict[str, any]) -> Dict[str, str]:
        """Save settings to file"""
        self._settings = settings

        if self._settings_path:
            try:
                with open(self._settings_path, 'w') as f:
                    json.dump(settings, f, indent=2)
                logger.info("Settings saved successfully")
                return {"status": "success"}
            except Exception as e:
                logger.error(f"Error saving settings: {e}")
                return {"status": "error", "message": str(e)}

        return {"status": "error", "message": "Settings path not initialized"}

    def _load_settings(self):
        """Load settings from file"""
        if self._settings_path and self._settings_path.exists():
            try:
                with open(self._settings_path, 'r') as f:
                    loaded_settings = json.load(f)
                    self._settings.update(loaded_settings)
                logger.info("Settings loaded successfully")
            except Exception as e:
                logger.error(f"Error loading settings: {e}")

    def _load_local_games_db(self):
        """Load local games database"""
        if not self._plugin_dir:
            logger.warning("Plugin directory not set, cannot load database")
            return

        db_path = self._plugin_dir / "defaults" / "gfn_games.json"
        logger.info(f"Looking for database at: {db_path}")

        if db_path.exists():
            try:
                with open(db_path, 'r') as f:
                    data = json.load(f)
                    self._local_games_db = data.get("games", {})
                    self._db_last_updated = data.get("last_updated")
                logger.info(f"Loaded {len(self._local_games_db)} games from local database")
            except Exception as e:
                logger.error(f"Error loading local games database: {e}")
        else:
            logger.error(f"Database file not found at {db_path}")
            logger.error(f"Please ensure defaults/gfn_games.json exists in the plugin directory")

    # Decky plugin lifecycle methods
    async def _main(self):
        logger.info("GFN for Deck plugin loaded")

        # Initialize async lock for DB writes
        self._db_lock = asyncio.Lock()

        # Initialize plugin directory
        plugin_dir = os.environ.get("DECKY_PLUGIN_DIR")
        if plugin_dir:
            self._plugin_dir = Path(plugin_dir)
            logger.info(f"Plugin directory: {self._plugin_dir}")

        # Initialize settings path
        # Decky plugins have access to DECKY_PLUGIN_SETTINGS_DIR environment variable
        settings_dir = os.environ.get("DECKY_PLUGIN_SETTINGS_DIR")
        if settings_dir:
            self._settings_path = Path(settings_dir) / "settings.json"
            self._load_settings()
        else:
            logger.warning("DECKY_PLUGIN_SETTINGS_DIR not found, settings will not persist")

        # Load local games database
        self._load_local_games_db()

        # Auto-refresh if DB is empty or older than 7 days
        needs_refresh = len(self._local_games_db) == 0
        if not needs_refresh and self._db_last_updated:
            try:
                last_updated_dt = datetime.strptime(self._db_last_updated, "%Y-%m-%d %H:%M:%S")
                if datetime.now() - last_updated_dt > timedelta(days=7):
                    needs_refresh = True
                    logger.info("Database is older than 7 days, scheduling background refresh")
            except ValueError:
                pass  # unparseable timestamp — leave as-is

        if needs_refresh:
            logger.info("Scheduling background database refresh...")
            asyncio.create_task(self.refresh_database())

    async def _unload(self):
        logger.info("GFN for Deck plugin unloaded")
        self._cache.clear()
