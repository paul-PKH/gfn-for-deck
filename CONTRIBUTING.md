# Contributing to GFN for Deck

Thank you for your interest in contributing to GeForce NOW for Deck! This document provides guidelines and information for contributors.

## Ways to Contribute

- Report bugs and issues
- Suggest new features or improvements
- Submit pull requests with bug fixes or features
- Improve documentation
- Update the games database
- Share the plugin with others

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/gfn-decky.git`
3. Create a feature branch: `git checkout -b feature/amazing-feature`
4. Install dependencies: `pnpm install`
5. Make your changes
6. Test thoroughly
7. Commit and push
8. Open a pull request

## Development Setup

### Requirements

- Node.js 18+ and pnpm
- Python 3.9+
- A Steam Deck (or access to one for testing)
- Decky Loader installed on Steam Deck

### Building

```bash
# Install dependencies
pnpm install

# Build
pnpm run build

# Watch mode for development
pnpm run watch
```

## Code Style

### TypeScript/React

- Use functional components with hooks
- Follow the existing code style
- Use meaningful variable and function names
- Add JSDoc comments for complex functions
- Keep components small and focused

### Python

- Follow PEP 8 style guidelines
- Use type hints where appropriate
- Add docstrings to all public methods
- Keep functions focused on a single task

## Project Structure

```
gfn-decky/
├── src/                      # Frontend TypeScript/React code
│   ├── components/          # React components
│   ├── patches/             # UI injection patches
│   ├── types.ts             # TypeScript interfaces
│   └── index.tsx            # Plugin entry point
├── main.py                  # Backend Python code
├── defaults/                # Default configuration files
│   └── gfn_games.json      # Local games database
├── assets/                  # Images and resources
└── dist/                    # Build output (generated)
```

## Testing

### Manual Testing

1. Build the plugin
2. Deploy to Steam Deck
3. Test all features:
   - Logo appears on game pages
   - Settings changes take effect
   - Cache works correctly
   - Different positions work
   - Size and glow adjustments work

### Test Checklist

- [ ] Plugin loads without errors
- [ ] Logo appears on game pages
- [ ] Green logo shows for available games
- [ ] Grey logo shows for unavailable games
- [ ] Settings persist across restarts
- [ ] All position options work
- [ ] Size slider works correctly
- [ ] Glow intensity slider works
- [ ] Cache clear function works
- [ ] No performance issues

## Updating the Games Database

The local games database (`defaults/gfn_games.json`) serves as a fallback when external APIs are unavailable.

### Adding Games

1. Find the Steam App ID (from the store URL)
2. Verify the game is on GeForce NOW (check officially)
3. Add to `gfn_games.json`:

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

4. Update the `last_updated` field
5. Submit a pull request

### Bulk Updates

If you have a large list of games to add:

1. Create a script to format them correctly
2. Verify accuracy (spot check at minimum)
3. Include source/verification method in PR description

## Pull Request Guidelines

### Before Submitting

- [ ] Test on actual Steam Deck hardware
- [ ] Code builds without errors
- [ ] No console errors or warnings
- [ ] Follow existing code style
- [ ] Update documentation if needed
- [ ] Add yourself to contributors (if not already there)

### PR Description

Include:

- **What**: Brief description of changes
- **Why**: Motivation for the changes
- **How**: Technical approach (if complex)
- **Testing**: How you tested the changes
- **Screenshots**: If UI changes are involved

### Example PR

```markdown
## Add logo rotation animation

### What
Adds a subtle rotation animation to the logo when hovering.

### Why
Improves user feedback and makes the UI feel more polished.

### How
- Added CSS transition to GFNLogo component
- Rotation triggers on hover
- Animation duration: 0.3s

### Testing
- Tested on Steam Deck with multiple games
- Verified performance is not impacted
- Checked all position options

### Screenshots
[Include screenshots or video]
```

## API Integration

If you're working on integrating a new GFN availability API:

1. Add it to `_fetch_gfn_status()` in `main.py`
2. Implement proper error handling
3. Use async/await for network calls
4. Add timeout (5 seconds recommended)
5. Fall back to next option on failure
6. Document the API source
7. Respect rate limits

### Example API Integration

```python
async def _fetch_gfn_status(self, appid: str) -> bool:
    # Try new API
    try:
        response = await asyncio.to_thread(
            requests.get,
            f"https://new-api.example.com/check/{appid}",
            timeout=5
        )
        if response.status_code == 200:
            return response.json().get("onGFN", False)
    except Exception as e:
        logger.warning(f"New API failed: {e}")

    # Fall back to existing methods
    # ...
```

## UI/UX Guidelines

- Keep the logo unobtrusive but visible
- Ensure text is readable
- Test with Steam Deck's screen size
- Animations should be smooth (avoid jank)
- Settings should be intuitive
- Provide helpful descriptions

## Documentation

Update documentation when you:

- Add new features
- Change existing behavior
- Add new settings
- Change API integrations
- Fix significant bugs

Documentation to update:

- `README.md` - Main documentation
- `QUICKSTART.md` - Quick start guide
- Code comments - For complex logic
- `plugin.json` - If metadata changes

## Reporting Issues

### Bug Reports

Include:

- **Description**: Clear description of the bug
- **Steps to Reproduce**: Detailed steps
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens
- **Screenshots**: If applicable
- **Environment**:
  - Plugin version
  - Decky Loader version
  - SteamOS version
  - Any relevant logs

### Feature Requests

Include:

- **Problem**: What problem does this solve?
- **Solution**: Proposed solution
- **Alternatives**: Other options considered
- **Use Case**: When would this be useful?

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Assume good intentions
- Help others learn and grow

## Questions?

- Open an issue for general questions
- Use discussions for broader topics
- Check existing issues/PRs first

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (BSD 3-Clause).

---

Thank you for contributing to GFN for Deck!
