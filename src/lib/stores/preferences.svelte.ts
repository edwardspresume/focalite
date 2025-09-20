export const preferences = $state({
	focusMinutes: 30,
	breakMinutes: 3,
	autoLoop: false
});

export function setFocusMinutes(min: number) {
    // Allow fractional minutes; clamp to at least 1 second (1/60 min)
    const n = Number(min);
    if (!Number.isNaN(n)) {
        preferences.focusMinutes = Math.max(1 / 60, n);
    }
}

export function setBreakMinutes(min: number) {
    // Allow fractional minutes; clamp to at least 1 second (1/60 min)
    const n = Number(min);
    if (!Number.isNaN(n)) {
        preferences.breakMinutes = Math.max(1 / 60, n);
    }
}

export function toggleAutoLoop() {
	preferences.autoLoop = !preferences.autoLoop;
}
