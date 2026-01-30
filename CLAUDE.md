# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React + TypeScript + Vite web application using modern build tooling. The project uses **rolldown-vite** (a Rolldown-powered fork of Vite) as its bundler for improved build performance.

## Key Commands

All commands should be run from the `secret-house-web` directory:

```bash
cd secret-house-web

# Development
npm run dev          # Start dev server with HMR (default port 5173)

# Building
npm run build        # Type check with tsc and build for production
npx tsc -b           # Type check only (use npx)

# Code Quality
npm run lint         # Run ESLint on all files

# Preview
npm run preview      # Preview production build locally
```

**Note**: TypeScript must be run with `npx tsc` (not `tsc` directly) as it's a dev dependency.

## Project Structure

```
secret-house-web/
├── CLAUDE.md                  # This file
├── secret-house-web.esproj    # Visual Studio project file
├── package.json               # NPM dependencies
├── vite.config.ts             # Vite configuration
├── index.html                 # HTML entry point
├── src/
│   ├── main.tsx               # Application entry point
│   ├── App.tsx                # Root component
│   ├── assets/                # Static assets (images, SVGs)
│   └── *.css                  # Component and global styles
├── public/                    # Static public assets
└── dist/                      # Production build output
```

## Architecture

### Build System
- **Bundler**: rolldown-vite@7.2.5 (specified via npm override in package.json)
- **Fast Refresh**: @vitejs/plugin-react with Babel
- **TypeScript**: Project references using tsconfig.app.json (app code) and tsconfig.node.json (config files)
- **CSS**: Tailwind CSS v4 with PostCSS and Autoprefixer

### TypeScript Configuration
- Uses ES2022 target and modern module resolution ("bundler" mode)
- Strict mode enabled with additional linting flags (noUnusedLocals, noUnusedParameters, etc.)
- JSX transform: react-jsx (no need to import React in every file)
- verbatimModuleSyntax enabled for type imports

### ESLint Setup
- Uses flat config format (eslint.config.js)
- Configured with TypeScript ESLint, React Hooks rules, and React Refresh plugin
- Ignores `dist` directory
- Targets browser globals

### React
- React 19.2.0 with React DOM 19.2.0
- Uses StrictMode in main.tsx
- Entry point: src/main.tsx mounts App component to #root div
- **Routing**: React Router DOM for URL-based navigation
  - `/` - Home page with all content
  - `/book`, `/booking`, `/telegram` - Auto-redirect to Telegram bot
  - Gallery state managed via URL parameters (`?gallery=open&category=...`)
  - Browser back button closes gallery and returns to home page

### Styling
- **Framework**: Tailwind CSS v4 with @tailwindcss/postcss plugin
- **Custom utilities**: Luxury gradients, gold colors, and shadow effects in index.css
- **Theme colors**: Luxury gold (#d4af37) and gold-light (#f4d03f)
- **Base styles**: Dark theme (black background, white text) with Inter font family
- **PostCSS**: Configured with @tailwindcss/postcss and autoprefixer

## Visual Studio Integration

This project was created with Visual Studio 2022 tooling:
- `.esproj` file configures Visual Studio JavaScript/TypeScript project support
- `.vscode/launch.json` provides browser debugging configurations for Edge and Chrome on port 49723
- `JavaScriptTestFramework` is set to Vitest in the project file, but no tests are currently configured
- Project was initialized using `create-vite` with the `react-ts` template

## Environment Variables

Create a `.env` file in the `secret-house-web` directory with the following variables:

```env
# Location coordinates for Yandex Maps
VITE_LOCATION_LAT=53.934202
VITE_LOCATION_LON=27.300385
VITE_LOCATION_ADDRESS=Минск, Беларусь

# Telegram bot username (without @)
VITE_BOT_USERNAME=the_secret_house_booking_bot

# Social media and contacts
VITE_TELEGRAM_ADMIN=the_secret_house
VITE_TELEGRAM_CHANNEL=sekret_blr
VITE_INSTAGRAM_USERNAME=private_sekret_blr
VITE_PHONE_NUMBER=+375257908378
```

- **VITE_LOCATION_\*** - Configure the Yandex Maps location display
- **VITE_BOT_USERNAME** - Telegram bot username for booking button (links to https://t.me/the_secret_house_booking_bot)
- **VITE_TELEGRAM_ADMIN** - Telegram admin chat username displayed in footer (https://t.me/the_secret_house)
- **VITE_TELEGRAM_CHANNEL** - Telegram channel username displayed in footer (https://t.me/sekret_blr)
- **VITE_INSTAGRAM_USERNAME** - Instagram username (without @) for social link in footer
- **VITE_PHONE_NUMBER** - Contact phone number in international format (e.g., +375257908378)

## Important Notes

- All application code and configuration files are in the `secret-house-web` directory root
- This project uses rolldown-vite (not standard Vite), which may have different behavior or features
- TypeScript is configured with very strict settings including unused variable/parameter checking
- React Compiler is not enabled (see README for performance reasons)
- No test framework is currently installed despite the project file referencing Vitest
- **Yandex Maps API**: Integrated without API key (public usage), loaded in index.html
- The map component uses coordinates from environment variables for flexibility
