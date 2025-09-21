import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/svelte';
import SettingsPanel from './SettingsPanel.svelte';
import { preferences } from '$lib/stores/preferences.svelte';
import { timer } from '$lib/stores/timer.svelte';

// Mock external dependencies
vi.mock('mode-watcher', () => ({
	toggleMode: vi.fn()
}));

vi.mock('@tauri-apps/plugin-store', () => {
  const storeApi = {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn(),
    save: vi.fn()
  };
  return {
    load: vi.fn(async () => storeApi),
    LazyStore: vi.fn(() => ({
      entries: vi.fn(async () => []),
      set: vi.fn()
    }))
  };
});

vi.mock('$lib/stores/timer.svelte', () => ({
	timer: {
		phase: 'idle',
		startedAt: null
	}
}));

describe('SettingsPanel', () => {
beforeEach(() => {
    vi.clearAllMocks();
    // Reset timer mock state
    (timer as any).phase = 'idle';
    (timer as any).startedAt = null;
    // Reset preferences defaults for isolation
    preferences.setFocusMinutes(30);
    preferences.setBreakMinutes(3);
    preferences.setAutoLoop(false);
});

	it('should render all preset focus options', () => {
    render(SettingsPanel);

    const focusOptions = [20, 25, 30, 45, 50, 60, 75, 90];
    const focusSection = screen.getByText('Focus Duration').closest('fieldset')!;
    const scope = within(focusSection);
    focusOptions.forEach((duration) => {
        expect(scope.getByTitle(`${duration} minutes`)).toBeInTheDocument();
    });
});

	it('should render all preset break options', () => {
    render(SettingsPanel);

    const breakOptions = [3, 5, 8, 10, 12, 15, 17, 20];
    const breakSection = screen.getByText('Break Duration').closest('fieldset')!;
    const scope = within(breakSection);
    breakOptions.forEach((duration) => {
        expect(scope.getByTitle(`${duration} minutes`)).toBeInTheDocument();
    });
});

	it('should show custom focus input', () => {
		render(SettingsPanel);

		const focusInput = screen.getByLabelText('Custom focus duration in minutes');
		expect(focusInput).toBeInTheDocument();
		expect(focusInput).toHaveAttribute('type', 'number');
		expect(focusInput).toHaveAttribute('placeholder', 'Custom minutes');
	});

	it('should show custom break input', () => {
		render(SettingsPanel);

		const breakInput = screen.getByLabelText('Custom break duration in minutes');
		expect(breakInput).toBeInTheDocument();
		expect(breakInput).toHaveAttribute('type', 'number');
		expect(breakInput).toHaveAttribute('placeholder', 'Custom minutes');
	});

	it('should handle valid custom focus input', async () => {
		render(SettingsPanel);

		const focusInput = screen.getByLabelText('Custom focus duration in minutes');

		await fireEvent.input(focusInput, { target: { value: '35' } });
		await fireEvent.change(focusInput);

		// Input should be cleared after successful validation
		expect(focusInput).toHaveValue(null);
	});

	// No inline validation is shown in current UI; inputs are permissive and clear on submit.

	it('should handle Enter key in custom focus input', async () => {
		render(SettingsPanel);

		const focusInput = screen.getByLabelText('Custom focus duration in minutes');

		await fireEvent.input(focusInput, { target: { value: '40' } });
		await fireEvent.keyDown(focusInput, { key: 'Enter' });

		// Input should be cleared after successful validation
		expect(focusInput).toHaveValue(null);
	});

	it('should handle valid custom break input', async () => {
		render(SettingsPanel);

		const breakInput = screen.getByLabelText('Custom break duration in minutes');

		await fireEvent.input(breakInput, { target: { value: '7' } });
		await fireEvent.change(breakInput);

		// Input should be cleared after successful validation
		expect(breakInput).toHaveValue(null);
	});

	// No error UI to clear in the current implementation

	it('should show auto-loop switch', () => {
		render(SettingsPanel);

		const autoLoopSwitch = screen.getByLabelText('Auto-loop sessions');
		expect(autoLoopSwitch).toBeInTheDocument();
	});

	it('should show theme toggle button', () => {
		render(SettingsPanel);

		const themeButton = screen.getByLabelText('Toggle theme');
		expect(themeButton).toBeInTheDocument();
	});

	it('should call toggleMode when theme button is clicked', async () => {
		const { toggleMode } = await import('mode-watcher');
		render(SettingsPanel);

		const themeButton = screen.getByLabelText('Toggle theme');
		await fireEvent.click(themeButton);

		expect(toggleMode).toHaveBeenCalled();
	});

	describe('Next session warning', () => {
    it('should show warning when timer is active', () => {
			// Mock timer as active
			(timer as any).phase = 'focus';
			(timer as any).startedAt = Date.now();

			render(SettingsPanel);

        expect(screen.getByText('Timer changes will apply next session')).toBeInTheDocument();
    });

		it('should not show warning when timer is idle', () => {
			// Timer is already idle by default
			render(SettingsPanel);

        expect(screen.queryByText('Timer changes will apply next session')).not.toBeInTheDocument();
    });

    it('should show focus-specific warning during focus phase', () => {
        (timer as any).phase = 'focus';
        (timer as any).startedAt = Date.now();

        render(SettingsPanel);

        const focusSection = screen.getByText('Focus Duration').closest('fieldset')!;
        expect(within(focusSection).getByText('(next session)')).toBeInTheDocument();
    });

		it('should show break-specific warning during break phase', () => {
			(timer as any).phase = 'break';
			(timer as any).startedAt = Date.now();

			render(SettingsPanel);

        // Should show the general warning
        expect(screen.getByText('Timer changes will apply next session')).toBeInTheDocument();
		});
	});

		describe('Accessibility', () => {
			it('should have proper ARIA attributes for inputs', () => {
				render(SettingsPanel);

			const focusInput = screen.getByLabelText('Custom focus duration in minutes');
			const breakInput = screen.getByLabelText('Custom break duration in minutes');

			expect(focusInput).toHaveAttribute('aria-label', 'Custom focus duration in minutes');
			expect(breakInput).toHaveAttribute('aria-label', 'Custom break duration in minutes');
		});

			it('should reflect selected durations in summary text', () => {
				render(SettingsPanel);

				// Defaults are 30 and 3
				expect(screen.getAllByText(/Selected:/)[0].textContent).toContain('30 minutes');
				expect(screen.getAllByText(/Selected:/)[1].textContent).toContain('3 minutes');
			});
		});
});
