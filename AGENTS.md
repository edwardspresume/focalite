# AGENTS.md

This file provides guidance to when working with code in this repository.

## Project Overview

**Focalite** is a Windows desktop focus timer (Pomodoro-style), built with Tauri v2 and Svelte 5.

- **Stack**: Tauri v2, Svelte 5 with Runes, TypeScript, Tailwind CSS
- **Target Platform**: Windows (WebView2)
- **App Identifier**: com.ed_linux.focalite
- **Package Manager**: pnpm

## Development Commands

### Core Development

```bash
# Start development server
pnpm tauri dev

# Build for production
pnpm tauri build

# Frontend only development
pnpm dev

# Build frontend only
pnpm build

# Preview built frontend
pnpm preview
```

### Type Checking and Validation

```bash
# Run Svelte type checking
pnpm check

# Watch mode for type checking
pnpm check:watch
```

### Package Management

```bash
# Install dependencies
pnpm install

# Run Tauri commands
pnpm tauri [command]
```

## Architecture

### Frontend Structure (`/src`)

- Single-page Svelte 5 application using **Runes exclusively**
- `/src/routes/+page.svelte` - Main application entry
- `/src/app.html` - HTML template
- `/src/app.css` - Global styles with Tailwind
- `/src/lib/components/` - Component library
  - `TimerView.svelte` - Main timer display component
  - `BreakView.svelte` - Break timer display component
  - `ui/` - Reusable UI components (shadcn/ui components)
- `/src/lib/utils.ts` - Utility functions

### Backend Structure (`/src-tauri`)

- Rust-based Tauri backend
- `src/main.rs` - Main entry point
- `src/lib.rs` - Library exports
- `tauri.conf.json` - Tauri configuration
- `Cargo.toml` - Rust dependencies

### Key Configuration Files

- `svelte.config.js` - Configured for static adapter (SPA mode for Tauri)
- `vite.config.js` - Tailwind and SvelteKit integration, Tauri-specific dev server settings
- `tsconfig.json` - TypeScript configuration with strict mode
- `components.json` - shadcn/ui component configuration
- `.mcp.json` - MCP (Model Context Protocol) configuration

## Development Guidelines

### Svelte 5 Runes (Mandatory)

- Use **Svelte 5 Runes exclusively**: `$state`, `$derived`, `$effect`, `$props`, `$bindable`
- **No legacy Svelte 4 patterns** (stores, reactive declarations, etc.)
- State management: `TimerState` with `$state`
- Computed values: `$derived` for timers and calculations
- Side effects: `$effect` for intervals and DOM manipulation

### Core Feature Requirements

- Focus timer that transitions to automatic break timer
- Audio notifications for timer transitions (break-start.mp3)
- Visual progress indicators with circular dashOffset animations

### Code Standards

- TypeScript strict mode enabled
- Tailwind CSS v4 for styling
- Components should be under 200-300 LOC
- Use `$derived` for computed values to avoid redundant work
- Prefer `$state.raw()` for large collections when deep reactivity isn't needed
- UI components library: shadcn/ui with bits-ui
- Icon libraries: @lucide/svelte

### Build and Deployment

- Frontend builds to static files for Tauri consumption
- Development server runs on port 1420 (Tauri requirement)
- Cross-platform considerations for Windows target from WSL development environment
- GitHub Actions workflows:
  - `build.yml` - Automated build pipeline
  - `claude.yml` - Claude PR Assistant
  - `claude-code-review.yml` - Claude Code Review workflow

## Project Context

This is a hobby project for building a productivity tool focused on helping users maintain focus through timed work sessions with automatic break reminders.
