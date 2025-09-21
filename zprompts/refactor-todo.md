# Refactor TODO — Core Logic, Flows, and UI

Purpose: Track and execute the refactor of Focalite’s core logic and the documented flows/features in a structured, verifiable way.

Status key: [ ] todo · [~] in progress · [x] done

## Goals

- Make the code simpler and more maintainable.
- Ensure the core logic is correct (timing, transitions, auto-loop, manual overrides, persistence, rollover).
- Utilize modern TypeScript and JavaScript best practices.
- Use Svelte 5 Runes-first patterns ($state, $derived) and avoid legacy Svelte 4 idioms.
- Write tests with Vitest where applicable to validate behavior and prevent regressions.

## 1) Timer Store (Centralized)

- [ ] Single source of truth in `src/lib/stores/timer.svelte.ts` (no per-component timers)
- [ ] One 250ms interval drives updates (created/cleaned up in store)
- [ ] Core state exists and is typed: `phase`, `startedAt`, `baseElapsedSec`, `now`
- [ ] `$derived` values implemented: `elapsed`, `remaining`, `progress (0–1)`, `timeLabel (MM:SS)`, `dashOffset`
- [ ] Public API methods: `startFocus()`, `startBreak()`, `startBreakEarly()`, `endBreakEarly()`, `pause()`, `resume()`, `reset()`
- [ ] Ensure method calls cancel/restore interval appropriately (pause/resume)
- [ ] No redundant state in `FocusTimer.svelte` / `BreakTimer.svelte`

## 2) Session Flows

- [ ] Focus Flow: Start → Pause/Resume → Reset → Completion behavior
- [ ] On Focus completion: transition to Break and auto-switch tab to Break
- [ ] Break Flow: Start Break (ends Focus if running) → End Break Early → Completion behavior
- [ ] Auto-loop: if enabled, Break completion auto-starts Focus; otherwise remain idle after Break
- [ ] Manual overrides take precedence for the current cycle (manually started Break does not trigger auto-start Focus on completion)
- [ ] Edge cases validated (starting Break while Focus running, immediate reset after completion, etc.)

## 3) Navigation & Tabs

- [ ] Tabs (Timer, Break, Settings, Stats) are always clickable regardless of timer state
- [ ] Smart auto-tab switching on phase change (Focus→Break, Break→Timer when appropriate)
- [ ] Keyboard focus order remains logical after auto-switch

## 4) Settings & Defaults

- [ ] Defaults: Focus 30m, Break 3m
- [ ] Presets and custom input for durations
- [ ] Changes persist immediately (see Persistence section)
- [ ] UI indicates when changes apply next session vs immediately

## 5) Data, Progress & Persistence

- [ ] Environment-specific persistence:
  - Desktop (Tauri): Tauri Store plugin to JSON file
  - Browser: `localStorage`
- [ ] On startup: load preferences and daily progress
- [ ] Throttled progress saving every ~15s while active; immediate on completion
- [ ] Midnight rollover: daily counters reset; historical data retained
- [ ] Historical retention policy: 30 days for charts
- [ ] Reset action for daily progress and statistics
- [ ] No cross-runtime sync between browser `localStorage` and desktop file store

## 6) Notifications & Feedback

- [ ] Audio: play `break-start.mp3` at break start
- [ ] Audio: play `break-complete.mp3` at break end
- [ ] Desktop: send Tauri notification when a break ends
- [ ] Capability/permission present for notifications (Tauri plugin config)

## 7) Display & Controls

- [ ] Timer display: idle shows selected duration; running shows remaining time (MM:SS)
- [ ] Progress ring uses SVG stroke-dashoffset; computed from `progress`
- [ ] Keyboard shortcuts: Space (play/pause/resume), Esc (reset)
- [ ] Manual controls present in UI: start, pause, resume, reset, start break early, end break early

## 8) Stats & History

- [ ] Real-time dashboard: sessions, completion rates, streaks
- [ ] Weekly/monthly charts implement (D3/LayerChart)
- [ ] Data reads from persisted progress; respects retention window

## 9) Performance & Reactivity (Svelte 5 Runes)

- [ ] Favor `$derived` over `$effect` for computed synchronization
- [ ] Single interval in store; remove any component-level intervals
- [ ] Avoid duplicate reactive sources for the same concept (DRY)
- [ ] Ensure minimal re-renders (check referential equality where needed)

## 10) Cross‑Runtime Behavior

- [ ] Timer logic identical across browser and desktop
- [ ] Guard Tauri-only APIs; provide no-op or browser equivalent when needed
- [ ] Document any runtime-specific nuances (e.g., notifications, filesystem persistence)



## 13) Verification & Acceptance Criteria

- [ ] Focus → Break transition happens automatically on focus completion; tab auto-switches
- [ ] With auto-loop On: Break → Focus auto-starts; with auto-loop Off: remain idle after Break
- [ ] Manual Start Break (during Focus) ends Focus and starts Break; Break completion does not auto-start Focus for that cycle
- [ ] Tabs remain clickable in all states; switching tabs does not break timer logic
- [ ] Preferences persist correctly in both runtimes; progress saves throttle and immediate-on-completion work
- [ ] Midnight rollover occurs and maintains 30‑day history
- [ ] Audio cues and desktop notifications trigger at correct events (and do not duplicate)
- [ ] Vitest unit/component test suite covers core logic paths and passes in CI

## 15) Testing (Vitest)

- [ ] Configure Vitest (jsdom or happy-dom environment)
- [ ] Unit tests for `timer.svelte.ts` using `vi.useFakeTimers()` to cover start/pause/resume/reset, transitions, auto-loop, manual overrides, and rollover
- [ ] Component tests with `@testing-library/svelte` for tabs, controls, keyboard shortcuts, and auto-tab switching
- [ ] Mock/stub environment specifics: `localStorage` in browser, `@tauri-apps/api` (store/notification) in desktop unit tests
- [ ] Keep durations short/preset for tests; avoid real waits
- [ ] Optional: configure coverage via c8 (V8) to track core logic coverage

## 14) Documentation & Clean‑up

- [ ] Keep `AGENTS.md` aligned with behavior (no drift)
      -- [ ] Remove obsolete comments or dead code uncovered during refactor
- [ ] Note any limitations or open questions at the end of this file

---
