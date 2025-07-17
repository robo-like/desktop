# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **RoboLike**, an Electron-based desktop application for Instagram automation that allows users to automatically like posts from specific hashtags. The app is built with Electron Forge and uses a webview to embed Instagram functionality.

## Development Commands

- `npm run start` - Start the Electron app in development mode
- `npm run package` - Package the app for distribution
- `npm run make` - Build distributables for current platform
- `npm run make:darwin:arm64` - Build for macOS ARM64
- `npm run make:darwin:x64` - Build for macOS x64
- `npm run publish` - Publish the app
- `npm run lint` - Currently not configured (echoes "No linting configured")

## Architecture

### Main Process (`src/index.js`)
- Handles app lifecycle, window creation, and protocol registration
- Manages deep linking via `robolike://` protocol
- Implements single-instance enforcement
- Handles authentication flow and navigation between login and main app

### Renderer Process (`src/app.js`)
- Controls the main application logic for Instagram automation
- Manages hashtag selection, time scheduling, and like tracking
- Communicates with backend API at `https://www.robolike.com`
- Stores user preferences and like history in localStorage

### Key Features
- **Protocol Handling**: Registers `robolike://` custom protocol for deep linking
- **Authentication Flow**: Redirects to web-based login, then loads local HTML
- **Instagram Integration**: Uses webview to interact with Instagram directly
- **Rate Limiting**: Enforces max 500 likes per day with configurable time windows
- **Cross-Platform**: Supports macOS, Windows, and Linux with appropriate makers

## Environment Configuration

Uses dotenv for environment variables:
- `BASE_URL` - Backend API URL (defaults to https://robolike.com)
- `APPLE_SIGN_IDENTITY` - Code signing identity for macOS
- `APPLE_ID` - Apple ID for notarization
- `APPLE_PASSWORD` - App-specific password for notarization
- `APPLE_TEAM_ID` - Apple Developer Team ID

## Build Configuration

Electron Forge configuration in `forge.config.js`:
- **Code Signing**: Configured for macOS with notarization
- **Makers**: DMG (macOS), Squirrel (Windows), DEB (Linux)
- **Security**: Fuses enabled for enhanced security
- **ASAR**: App packaging enabled

## File Structure

```
src/
├── index.js        # Main Electron process
├── app.js          # Renderer process logic
├── index.html      # Main app UI
├── index.css       # Basic styling
└── preload.js      # Currently minimal/empty
```

## Security Considerations

- Uses webview with `disablewebsecurity` for Instagram integration
- Implements Electron security fuses
- Stores sensitive data (access tokens) in URL parameters
- Protocol handler registered for deep linking

## Development Notes

The app follows a hybrid approach:
1. **Web-based authentication** via external browser/webview
2. **Local HTML interface** for controls and like history
3. **Instagram webview** for actual social media interaction
4. **Backend API** for hashtag fetching and authentication

The codebase is intentionally simple with minimal dependencies, focusing on core Electron functionality rather than complex frameworks.