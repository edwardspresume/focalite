import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import SettingsPanel from './SettingsPanel.svelte';
import { timer } from '$lib/stores/timer.svelte';

// Mock external dependencies
vi.mock('mode-watcher', () => ({
	toggleMode: vi.fn()
}));

vi.mock('@tauri-apps/plugin-store', () => ({
	load: vi.fn(() => ({
		get: vi.fn().mockResolvedValue(null),
		set: vi.fn(),
		save: vi.fn()
	}))
}));

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
	});

	it('should render all preset focus options', () => {
		render(SettingsPanel);

		const focusOptions = [20, 25, 30, 45, 50, 52, 60, 75, 90];
		focusOptions.forEach(duration => {
			expect(screen.getByText(`${duration}m`)).toBeInTheDocument();
		});
	});

	it('should render all preset break options', () => {
		render(SettingsPanel);

		const breakOptions = [3, 5, 8, 10, 12, 15, 17, 20];
		breakOptions.forEach(duration => {
			expect(screen.getByText(`${duration}m`)).toBeInTheDocument();
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

	it('should show error for invalid custom focus input', async () => {
		render(SettingsPanel);

		const focusInput = screen.getByLabelText('Custom focus duration in minutes');

		await fireEvent.input(focusInput, { target: { value: '-5' } });
		await fireEvent.change(focusInput);

		expect(screen.getByRole('alert')).toHaveTextContent('Duration must be at least 1 second');
		expect(focusInput).toHaveAttribute('aria-invalid', 'true');
	});

	it('should show error for non-numeric custom focus input', async () => {
		render(SettingsPanel);

		const focusInput = screen.getByLabelText('Custom focus duration in minutes');

		await fireEvent.input(focusInput, { target: { value: 'abc' } });
		await fireEvent.change(focusInput);

		expect(screen.getByRole('alert')).toHaveTextContent('Please enter a valid number');
		expect(focusInput).toHaveAttribute('aria-invalid', 'true');
	});

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

	it('should show error for invalid custom break input', async () => {
		render(SettingsPanel);

		const breakInput = screen.getByLabelText('Custom break duration in minutes');

		await fireEvent.input(breakInput, { target: { value: '2000' } });
		await fireEvent.change(breakInput);

		expect(screen.getByRole('alert')).toHaveTextContent('Duration cannot exceed 24 hours');
		expect(breakInput).toHaveAttribute('aria-invalid', 'true');
	});

	it('should clear error when input is emptied', async () => {
		render(SettingsPanel);

		const focusInput = screen.getByLabelText('Custom focus duration in minutes');

		// First enter invalid value
		await fireEvent.input(focusInput, { target: { value: 'invalid' } });
		await fireEvent.change(focusInput);

		expect(screen.getByRole('alert')).toBeInTheDocument();

		// Then clear the input
		await fireEvent.input(focusInput, { target: { value: '' } });

		expect(screen.queryByRole('alert')).not.toBeInTheDocument();
	});

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

			expect(screen.getByText('⚠️ Changes will apply next session')).toBeInTheDocument();
		});

		it('should not show warning when timer is idle', () => {
			// Timer is already idle by default
			render(SettingsPanel);

			expect(screen.queryByText('⚠️ Changes will apply next session')).not.toBeInTheDocument();
		});

		it('should show focus-specific warning during focus phase', () => {
			(timer as any).phase = 'focus';
			(timer as any).startedAt = Date.now();

			render(SettingsPanel);

			expect(screen.getByText('(next session)')).toBeInTheDocument();
		});

		it('should show break-specific warning during break phase', () => {
			(timer as any).phase = 'break';
			(timer as any).startedAt = Date.now();

			render(SettingsPanel);

			// Should show the general warning
			expect(screen.getByText('⚠️ Changes will apply next session')).toBeInTheDocument();
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

		it('should mark inputs as invalid when showing errors', async () => {
			render(SettingsPanel);

			const focusInput = screen.getByLabelText('Custom focus duration in minutes');

			await fireEvent.input(focusInput, { target: { value: 'invalid' } });
			await fireEvent.change(focusInput);

			expect(focusInput).toHaveAttribute('aria-invalid', 'true');
		});

		it('should use role="alert" for error messages', async () => {
			render(SettingsPanel);

			const focusInput = screen.getByLabelText('Custom focus duration in minutes');

			await fireEvent.input(focusInput, { target: { value: 'invalid' } });
			await fireEvent.change(focusInput);

			const errorMessage = screen.getByRole('alert');
			expect(errorMessage).toHaveTextContent('Please enter a valid number');
		});

		it('should have proper button states for preset options', () => {
			render(SettingsPanel);

			// Default focus duration is 30 minutes
			const defaultFocusButton = screen.getByTitle('30 minutes');
			expect(defaultFocusButton).toHaveAttribute('aria-pressed', 'true');

			// Default break duration is 3 minutes
			const defaultBreakButton = screen.getByTitle('3 minutes');
			expect(defaultBreakButton).toHaveAttribute('aria-pressed', 'true');
		});
	});
});