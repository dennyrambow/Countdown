# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the Project

No build step. Serve the directory with any static file server (audio assets require a server origin, not `file://`):

```sh
python3 -m http.server
# or
npx serve .
```

There are no tests, no lint commands, and no package manager.

## Architecture

A zero-dependency, vanilla JS/CSS/HTML theatrical party invitation page. It simulates a retro MS-DOS terminal where the user is guided through a scripted "agent mission" before receiving the event address.

**Three source files:**
- [index.html](index.html) — Minimal HTML shell with a single `<main>` and a hidden `<input>` for keyboard capture
- [styles.css](styles.css) — Black/green phosphor terminal aesthetic, CSS custom properties, CRT scanlines overlay
- [app.js](app.js) — All application logic (~1,000 lines), wrapped in an IIFE

### `app.js` Structure

**`CONFIG`** (top of file) — Single source of truth for all content and settings:
- `TARGET_UTC_ISO` — Countdown target datetime (Berlin midnight, March 10 2026)
- `EVENT_DETAILS`, `ADDRESS_TEXT`, `FOOTER_LINES` — Display copy
- `GOOGLE_APPS_SCRIPT_ENDPOINT` — Serverless backend URL for RSVP collection (posts JSON to a Google Sheet via Apps Script)
- `AUDIO` — Paths to local audio files in `assets/audio/` (not in repo)
- `TYPING` — Typewriter speed config

**`TerminalEngine` class** — Core rendering engine:
- `typeLine()` — Character-by-character typewriter animation
- `progressBar()` / `progressBarSilent()` — ASCII progress bars
- `prompt()` — Interactive input with validators and blinking cursor
- `matrixRain()` — Canvas-based Matrix digital rain overlay
- `startCountdownSticky()` — Live sticky countdown timer (days/hours/min/sec)
- Screen wipe effects: `wipeScreenAnimated()`, `blackOut()`, `showFooterThenWipe()`

**`AudioBus`** — IIFE audio manager for background music loop and SFX (type clicks, beeps, mission accepted, coords reveal, self-destruct).

**`FLOW` async function** — Linear `async/await` script driving 7 scenes in sequence:
0. Matrix rain cold open
1. Boot sequence + PRESS ENTER
2. Mission invite + Y/N accept
3. Identity scan + briefing (sticky countdown activates)
4. Mission summary with event details
5. RSVP capture (name + plus-one) → POST to Google Apps Script
6. Location reveal (physical address)
7. 20-second self-destruct → screen wipe → footer

**Input validators** — `validateYN`, `validateName`, `validateRooftop` enforce strict input rules for each prompt stage.

## Semantic Versioning

The version badge displays semantic versioning (major.minor.patch) and automatically increments based on commit message prefixes.

### How It Works

The version badge (`v{version}-{commit-hash}`) on the page is **automatically calculated** by:
1. Fetching the latest commit from GitHub
2. Parsing its message for version bump indicators
3. Calculating the version from the base version in `CONFIG.VERSION`
4. Displaying the calculated version with the commit hash

### Commit Message Prefixes

Use these prefixes in your commit messages to control version bumping:

- **MAJOR:** → Major version bump (1.0.0 → 2.0.0)
- **FEAT:** → Minor version bump (1.0.0 → 1.1.0)
- All other commits → Patch version bump (1.0.0 → 1.0.1)

### Examples

```sh
# Minor version bump (feature)
git commit -m "FEAT: Add countdown sound effect"

# Major version bump (breaking change)
git commit -m "MAJOR: Redesign UI layout"

# Patch version bump (bug fix, chore, etc.)
git commit -m "Fix audio glitch in Scene 3"
git commit -m "Update README"
```

### Manual Version Updates (Optional)

If you need to manually adjust the base version:
```sh
./scripts/update-version.sh [major|minor|patch]
```

This updates both `app.js` and `index.html` for the fallback display.
