# Testing Persistent Preferences

## Implementation Summary

I've successfully implemented persistent storage for your Focalite app using Tauri's Store plugin and Svelte 5 best practices. Here's what was done:

### 1. **Installed Dependencies**
- Added `tauri-plugin-store` to Rust dependencies in `src-tauri/Cargo.toml`
- Added `@tauri-apps/plugin-store` to JavaScript dependencies in `package.json`

### 2. **Initialized Store Plugin**
- Updated `src-tauri/src/lib.rs` to register the store plugin with Tauri

### 3. **Created Preferences Module**
- Created `/src/lib/stores/preferences.ts` with:
  - `Preferences` interface for type safety
  - `loadPreferences()` to retrieve saved settings
  - `savePreferences()` and helper functions to persist changes
  - Default values: 30 min focus, 3 min break, autoLoop off

### 4. **Updated Main Component (Following Svelte 5 Best Practices)**
- Modified `/src/routes/+page.svelte` to use `$effect` runes instead of `onMount`:
  - Load preferences once on component initialization using `$effect`
  - Auto-save when focus duration changes (when not running)
  - Auto-save when break duration changes (when not running)
  - Auto-save when auto-loop toggle changes
  - Proper reactive dependency tracking with granular effects

## How It Works

1. **Storage Location**: The preferences are stored in a `preferences.json` file in the app's data directory:
   - Windows: `%APPDATA%/com.focalite.app/preferences.json`
   - macOS: `~/Library/Application Support/com.focalite.app/preferences.json`
   - Linux: `~/.config/com.focalite.app/preferences.json`

2. **Persistence**:
   - Settings are automatically saved whenever the user changes them
   - Settings are loaded when the app starts
   - The data persists across app restarts indefinitely

3. **Data Stored**:
   - `focusDurationMin`: Focus session duration in minutes
   - `breakDurationMin`: Break duration in minutes
   - `autoLoop`: Whether to automatically start a new focus session after a break

## Testing the Implementation

To test that preferences persist:

1. **Build and run the app**:
   ```bash
   npm run tauri dev
   ```

2. **Change settings**:
   - Adjust the focus duration slider
   - Adjust the break duration slider
   - Toggle the auto-loop checkbox

3. **Close the app** completely

4. **Restart the app** - your settings should be restored exactly as you left them

## Notes

- The implementation uses Tauri's official Store plugin, which is the recommended approach for user preferences
- Settings are saved only when the timer is not running to avoid conflicts
- Error handling is included to fallback to defaults if loading fails
- The store uses a singleton pattern to avoid multiple file handles