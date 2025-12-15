# GFN for Deck - Architecture

This document explains the technical architecture and how the components work together.

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Steam Deck UI                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                    Game Page                            │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │  [Game Title and Details]                        │  │ │
│  │  │                                                   │  │ │
│  │  │                                        ┌────────┐ │  │ │
│  │  │                                        │  GFN   │ │  │ │
│  │  │                                        │  Logo  │ │  │ │
│  │  │                                        └────────┘ │  │ │
│  │  │                                        (Overlay)  │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │            Quick Access Menu (Decky)                   │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │  GFN for Deck Settings                           │ │ │
│  │  │  • Logo Size Slider                              │ │ │
│  │  │  • Glow Intensity Slider                         │ │ │
│  │  │  • Position Dropdown                             │ │ │
│  │  │  • Clear Cache Button                            │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Plugin Frontend                          │
│                    (TypeScript/React)                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  index.tsx (Plugin Entry Point)                     │   │
│  │  • Plugin initialization                            │   │
│  │  • Settings state management                        │   │
│  │  • Backend communication                            │   │
│  └──────────┬──────────────────────────────────────────┘   │
│             │                                               │
│    ┌────────┴────────┐                                     │
│    ▼                 ▼                                      │
│  ┌─────────────┐   ┌──────────────────────────────────┐   │
│  │ Settings    │   │  GamePagePatch.tsx               │   │
│  │ Panel       │   │  • Detects game page navigation  │   │
│  │             │   │  • Extracts Steam App ID         │   │
│  │ • Sliders   │   │  • Calls backend for GFN status  │   │
│  │ • Toggles   │   │  • Renders logo overlay          │   │
│  │ • Buttons   │   └───────────┬──────────────────────┘   │
│  └─────────────┘               │                           │
│                                 ▼                           │
│                        ┌─────────────────┐                 │
│                        │  GFNLogo.tsx    │                 │
│                        │  • SVG logo     │                 │
│                        │  • Dynamic size │                 │
│                        │  • Glow effect  │                 │
│                        │  • Position     │                 │
│                        └─────────────────┘                 │
└─────────────────────────────────────────────────────────────┘
                               │
                               │ RPC Calls
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      Plugin Backend                          │
│                         (Python)                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  main.py (Plugin Class)                                     │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  check_gfn_availability(appid)                     │    │
│  │  ├─► Check cache (2hr expiration)                  │    │
│  │  ├─► Fetch from external API                       │    │
│  │  ├─► Fallback to local database                    │    │
│  │  └─► Return availability status                    │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Settings Management                               │    │
│  │  ├─► get_settings()                                │    │
│  │  ├─► save_settings(settings)                       │    │
│  │  └─► Load from disk on startup                     │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Cache Management                                  │    │
│  │  ├─► get_cache_stats()                             │    │
│  │  ├─► clear_cache()                                 │    │
│  │  └─► Automatic expiration (2 hours)                │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                               │
                               │
                   ┌───────────┴───────────┐
                   ▼                       ▼
         ┌──────────────────┐    ┌─────────────────┐
         │  External APIs   │    │ Local Database  │
         │  (Cloudbase.gg)  │    │ (gfn_games.json)│
         └──────────────────┘    └─────────────────┘
```

## Data Flow

### 1. User Views Game Page

```
User navigates to game page
        ↓
GamePagePatch intercepts route: /library/app/:appid
        ↓
Extract appid from URL (e.g., "271590")
        ↓
GamePageWrapper component mounted
```

### 2. Check GFN Availability

```
GamePageWrapper.useEffect()
        ↓
Call: serverAPI.callPluginMethod('check_gfn_availability', {appid})
        ↓
Python backend receives request
        ↓
Plugin.check_gfn_availability(appid)
        ↓
Check cache for appid
        │
        ├─► Cache hit (< 2hrs) ──► Return cached result
        │
        └─► Cache miss/expired
                ↓
          _fetch_gfn_status(appid)
                ↓
          Try external API (Cloudbase.gg)
                │
                ├─► API success ──► Parse response ──► Cache ──► Return
                │
                └─► API fails
                        ↓
                  Check local database
                        │
                        ├─► Found ──► Cache ──► Return
                        │
                        └─► Not found ──► Return False
```

### 3. Render Logo

```
Backend returns: {available: true/false, cached: true/false}
        ↓
GamePageWrapper.setGfnStatus(result)
        ↓
GFNLogo component receives props:
    • available: boolean
    • settings: GFNSettings
        ↓
Calculate styles based on:
    • Position (top-left/right, bottom-left/right)
    • Size (logoSize in pixels)
    • Color (green if available, grey if not)
    • Glow (boxShadow based on glowIntensity)
        ↓
Render SVG logo with styles
        ↓
User sees indicator on game page
```

### 4. Settings Change

```
User opens Quick Access Menu
        ↓
Clicks GFN for Deck plugin
        ↓
SettingsPanel renders with current settings
        ↓
User adjusts slider/dropdown
        ↓
onChange event fires
        ↓
handleSettingsChange(newSettings)
        ↓
Update local state: setSettings(newSettings)
        ↓
Call: serverAPI.callPluginMethod('save_settings', {settings})
        ↓
Python: Plugin.save_settings(settings)
        ↓
Write to disk: settings.json
        ↓
Settings persisted for next session
```

## File Responsibilities

### Frontend Files

| File | Purpose | Key Functions |
|------|---------|---------------|
| `src/index.tsx` | Plugin entry point | Plugin registration, lifecycle, settings loading |
| `src/types.ts` | TypeScript definitions | Interfaces for settings and availability data |
| `src/components/SettingsPanel.tsx` | Settings UI | Render sliders, toggles, dropdowns |
| `src/components/GFNLogo.tsx` | Logo overlay | Render SVG, apply styles, positioning |
| `src/patches/GamePagePatch.tsx` | Game page injection | Route patching, app ID extraction, overlay injection |

### Backend Files

| File | Purpose | Key Methods |
|------|---------|-------------|
| `main.py` | Backend service | `check_gfn_availability()`, `get_settings()`, `save_settings()` |

### Configuration Files

| File | Purpose | Contains |
|------|---------|----------|
| `plugin.json` | Plugin metadata | Name, author, description, tags |
| `package.json` | Node dependencies | React, Decky Frontend Lib, build tools |
| `tsconfig.json` | TypeScript config | Compiler options, paths |
| `rollup.config.js` | Build config | Bundle configuration, plugins |

### Data Files

| File | Purpose | Format |
|------|---------|--------|
| `defaults/gfn_games.json` | Local game database | JSON: `{appid: {name, available}}` |
| `settings.json` (runtime) | User settings | JSON: `{logoSize, glowIntensity, position, enabled}` |

## State Management

### Frontend State

```typescript
// In index.tsx (Quick Access content)
const [settings, setSettings] = useState<GFNSettings>(DEFAULT_SETTINGS);
const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);

// In GamePageWrapper (per game page)
const [gfnStatus, setGfnStatus] = useState<GFNAvailability | null>(null);
const [loading, setLoading] = useState(true);
```

### Backend State

```python
# In Plugin class
_cache: Dict[str, Dict] = {}              # {appid: {available, timestamp}}
_settings: Dict[str, any] = {...}         # Current settings
_local_games_db: Dict[str, Dict] = {}     # Local game database
```

### State Persistence

- **Settings**: Saved to `settings.json` on every change
- **Cache**: In-memory only, cleared on plugin unload
- **Local DB**: Read-only, loaded on startup

## API Interactions

### Backend → External API

```python
# Pseudocode
async def _fetch_gfn_status(appid: str) -> bool:
    try:
        response = requests.get(f"https://api.example.com/gfn/{appid}")
        return response.json()["available"]
    except:
        # Fall back to local database
        return _local_games_db.get(appid, {}).get("available", False)
```

### Frontend → Backend (RPC)

```typescript
// TypeScript
const result = await serverAPI.callPluginMethod<
    { appid: string },  // Request type
    GFNAvailability     // Response type
>('check_gfn_availability', { appid: '271590' });

if (result.success) {
    const availability = result.result;
    // {available: true, cached: false}
}
```

## Performance Considerations

### Caching Strategy

- **2-hour expiration**: Balance between freshness and API load
- **Per-game caching**: Each app ID cached independently
- **Graceful degradation**: Return stale cache on API errors

### Loading Strategy

- **Async loading**: Logo doesn't block page render
- **Local state**: Each game page has independent state
- **Debouncing**: Settings changes batched before save

### Optimization

- **SVG logos**: Scalable without quality loss
- **CSS transitions**: Hardware-accelerated animations
- **Minimal re-renders**: React memoization where needed

## Error Handling

### Frontend Errors

```typescript
try {
    const result = await serverAPI.callPluginMethod(...);
    if (!result.success) {
        console.error('Backend error:', result.result);
    }
} catch (error) {
    console.error('RPC error:', error);
    // Show grey logo (unavailable) as fallback
}
```

### Backend Errors

```python
try:
    available = await self._fetch_gfn_status(appid)
except Exception as e:
    logger.error(f"Error checking GFN: {e}")
    # Return cached data if available
    if appid in self._cache:
        return self._cache[appid]
    # Otherwise return unavailable
    return {"available": False, "error": str(e)}
```

## Security Considerations

- **No user credentials**: Plugin doesn't handle authentication
- **Read-only operations**: Doesn't modify Steam data
- **Sandboxed**: Runs in Decky Loader container
- **Local storage**: Settings stored locally, not transmitted

## Extension Points

### Adding New Data Sources

1. Add new API check in `_fetch_gfn_status()`
2. Maintain fallback chain
3. Document source and rate limits

### Adding New Settings

1. Add to `GFNSettings` interface in `types.ts`
2. Update default values in `DEFAULT_SETTINGS`
3. Add UI control in `SettingsPanel.tsx`
4. Apply setting in `GFNLogo.tsx` or relevant component

### Adding New Features

Examples:
- **Click to launch**: Add onClick handler to GFNLogo
- **Tooltip**: Add title/tooltip component on hover
- **Statistics**: Track views, cache hits in backend
- **Themes**: Add theme selector in settings

## Testing Strategy

### Unit Testing (Future)

- Test individual components with React Testing Library
- Test backend methods with pytest
- Mock API responses

### Integration Testing

- Test frontend-backend communication
- Test settings persistence
- Test cache expiration

### Manual Testing

- Visual verification on actual Steam Deck
- Test all settings combinations
- Performance testing with many games

## Deployment Architecture

```
Development Machine
        ↓ (build)
    dist/ folder
        ↓ (scp/ssh)
Steam Deck: ~/homebrew/plugins/gfn-for-deck/
        ├─ dist/index.js
        ├─ main.py
        ├─ plugin.json
        ├─ requirements.txt
        └─ defaults/gfn_games.json
        ↓ (loaded by)
    Decky Loader
        ↓ (injected into)
    Steam UI
```

## Monitoring and Debugging

### Logs

- **Frontend**: Browser console (Chromium DevTools)
- **Backend**: `~/homebrew/logs/<plugin-name>.log`
- **Decky Loader**: `~/homebrew/logs/decky.log`

### Debugging

```bash
# SSH into Steam Deck
ssh deck@DECK_IP

# View plugin logs
tail -f ~/homebrew/logs/gfn-for-deck.log

# View Decky logs
tail -f ~/homebrew/logs/decky.log

# Test Python backend directly
python3 -c "from main import Plugin; p = Plugin(); print(p.check_gfn_availability('271590'))"
```

---

This architecture supports the core functionality while remaining extensible for future enhancements.
