# Refactor TODO — Core Logic, Flows

## Goals

- Make the code simpler and more maintainable.
- Ensure the core logic is correct (timing, transitions, auto-loop, manual overrides, persistence, rollover).
- Utilize modern TypeScript and JavaScript best practices.
- Use Svelte 5 Runes-first patterns ($state, $derived) and avoid legacy Svelte 4 idioms.
- Write tests with Vitest when feasible to validate behavior and prevent regressions.

## Testing (Vitest)

- When applicable, write or update tests and run the test suite iteratively until all tests pass (green); fix any failures as they emerge before moving on.
- Unit tests for `timer.svelte.ts` using `vi.useFakeTimers()` to cover start/pause/resume/reset, transitions, auto-loop, manual overrides, and rollover
- Component tests with `@testing-library/svelte` for tabs, controls, keyboard shortcuts, and auto-tab switching
- Mock/stub environment specifics: `localStorage` in browser, `@tauri-apps/api` (store/notification) in desktop unit tests
- Keep durations short/preset for tests; avoid real waits
- Optional: configure coverage via c8 (V8) to track core logic coverage

## Documentation & Clean‑up

- Keep `AGENTS.md` aligned with behavior (no drift)
      -- Remove obsolete comments or dead code uncovered during refactor
- Note any limitations or open questions at the end of this file

---
