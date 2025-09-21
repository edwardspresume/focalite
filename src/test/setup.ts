import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Configure test environment for browser mode
import { configure } from '@testing-library/svelte';

configure({
	testIdAttribute: 'data-testid'
});

// Mock browser globals that might be missing in jsdom
Object.defineProperty(window, 'matchMedia', {
	writable: true,
	value: vi.fn().mockImplementation(query => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: vi.fn(), // deprecated
		removeListener: vi.fn(), // deprecated
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn(),
	})),
});

// Ensure Svelte runs in browser mode
global.window = window;
global.document = document;
global.navigator = navigator;