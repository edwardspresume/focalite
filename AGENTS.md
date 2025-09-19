# AGENTS.md

This file provides guidance to when working with code in this repository.

## Project Overview

**Focalite** is a Windows desktop focus timer (Pomodoro-style), built with Tauri v2 and Svelte 5.

- **Stack**: Tauri v2, Svelte 5 with Runes, TypeScript, Tailwind CSS
- **Target Platform**: Windows (WebView2)
- **App Identifier**: com.focalite.app
- **Package Manager**: pnpm

### Core Feature Requirements

#### Timer Functionality

- Pomodoro-style focus timer with automatic break transitions
- Customizable focus and break durations with preset options (10-90 min focus, 2-20 min break)
- Auto-loop mode for continuous focus/break cycles
- Real-time timer display with minutes:seconds format

#### User Interface

- Visual progress indicators with circular SVG animations
- Settings panel
- Session statistics dashboard (sessions completed, total focus/break time)
- Break activity suggestions for physical movement and mental rest

#### Notifications & Feedback

- Audio notifications for timer events (break-start.mp3, break-complete.mp3)
- Desktop toast notifications via Tauri notification plugin

#### Data Management

- Persistent storage of user preferences and progress via Tauri Store plugin
- Daily progress tracking with automatic midnight rollover
- Reset daily progress functionality

#### Controls & Interaction

- Keyboard shortcuts (Space: play/pause/resume, Esc: reset, B: start break)
- Manual timer controls (start, pause, resume, reset, end break early)

#### Platform Support

- Cross-runtime compatibility (Tauri desktop and web browser)
- Windows-optimized with WebView2 runtime

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

Note: Preference persistence works only under the Tauri runtime. Using `pnpm dev` (frontend-only) will not load/save preferences; use `pnpm tauri dev` when testing persistence.

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

When connected to the svelte-llm MCP server, you have access to comprehensive Svelte 5 and SvelteKit documentation. Here's how to use the available tools effectively:

## Available MCP Tools:

### 1. list_sections

Use this FIRST to discover all available documentation sections. Returns a structured list with titles and paths.
When asked about Svelte or SvelteKit topics, ALWAYS use this tool at the start of the chat to find relevant sections.

### 2. get_documentation

Retrieves full documentation content for specific sections. Accepts single or multiple sections.
After calling the list_sections tool, you MUST analyze the returned documentation sections and then use the get_documentation tool to fetch ALL documentation sections that are relevant for the users task.

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
- `/src/lib/stores/` - State management
  - `preferences.ts` - Persistent preferences using Tauri Store
- `/src/lib/utils.ts` - Utility functions

### Backend Structure (`/src-tauri`)

- Rust-based Tauri backend
- `src/main.rs` - Main entry point
- `src/lib.rs` - Library exports with plugin initialization
- `tauri.conf.json` - Tauri configuration
- `Cargo.toml` - Rust dependencies
- `capabilities/default.json` - Plugin permissions (includes `store:default` for persistence)

### Key Configuration Files

- `svelte.config.js` - Configured for static adapter (SPA mode for Tauri)
- `vite.config.js` - Tailwind and SvelteKit integration, Tauri-specific dev server settings
- `tsconfig.json` - TypeScript configuration with strict mode
- `components.json` - shadcn/ui component configuration
- `.mcp.json` - MCP (Model Context Protocol) configuration

## Core Principles

### Code Quality & Organization

- **Simplicity First**: Prefer simple, clear, and concise solutions
- **DRY (Don't Repeat Yourself)**: Actively avoid code duplication by reusing/refactoring existing functionality
- **Modularity**: Write clean, modular, reusable code for better maintainability
- **File Size**: Keep components/modules under 200-300 lines; refactor larger files
- **Environment Awareness**: Adapt code for dev/test/prod environments using environment variables

### Development Approach

- **Focused Changes**: Make only task-related changes; separate broader refactors
- **Incremental Improvements**: Prioritize solutions within existing patterns; fully remove old implementations when introducing new ones
- **Thorough Understanding**: Ask clarifying questions before proposing solutions
- **Suggest Improvements**: Offer refactoring and performance enhancement suggestions

## Accessibility & Performance

### Accessibility (WCAG 2.1/2.2 Level AA)

- **Semantic HTML**: Use appropriate elements (`<nav>`, `<article>`, `<button>`, etc.)
- **Keyboard Navigation**: Ensure all interactive elements are keyboard accessible with logical focus order
- **ARIA**: Use WAI-ARIA judiciously; avoid redundant roles when semantic HTML suffices
- **Images**: Provide descriptive `alt` attributes for informative images; use `alt=""` for decorative ones
- **Forms**: Associate all inputs with `<label>` elements or `aria-label`/`aria-labelledby`
- **Contrast**: Ensure sufficient color contrast; content resizable to 200% without loss of function

### Performance Optimization

- **Algorithms**: Analyze and optimize data structures and algorithms for bottlenecks
- **Memoization**: Use Svelte's `$derived` and caching techniques for expensive operations
- **Data Structures**: Choose appropriate structures (`Map`, `Set`, `SvelteMap`, `SvelteSet`)
- **Lazy Loading**: Implement `loading="lazy"` for images and below-the-fold assets
- **Network Optimization**: Minimize payload size and use efficient data formats
- **Svelte Runes**: Leverage Runes effectively for efficient state management and minimal re-renders

## Svelte 5+ Specifics

### Runes-First Approach

- **Standard**: Use Runes for all reactivity and component structure
- **No Legacy Patterns**: Avoid Svelte 4 patterns (`export let`, `$:` reactive statements)
- **Primary State Management**: Use `$state`, `$derived`, and `.svelte.ts` exports for reactive state

### State Management (`$state`)

- **Default**: Use `$state()` for deeply reactive proxies (objects/arrays)
- **Performance**: Use `$state.raw()` for large data structures; mutate via reassignment
- **External APIs**: Use `$state.snapshot()` for non-Svelte APIs needing static copies
- **Class Fields**: Declare as `done = $state(false)`
- **Cross-module**: Pass getter functions `(() => myState)` or reactive objects for reactivity
- **Exports**: Don't reassign exported state directly; mutate properties or provide accessors

### Derived State (`$derived`)

- **Computed Values**: Use `$derived()` for simple computations; `$derived.by(() => { ... })` for complex logic
- **Auto-tracking**: Dependencies tracked automatically; no side effects allowed
- **Temporary Override**: Can reassign derived values for optimistic UI; reverts when dependencies update
- **Reactivity**: Objects/arrays not automatically proxied; only reactive if derived from `$state` proxies
- **Performance**: Leverage referential equality checks to skip unnecessary re-evaluations

### Effects (`$effect`)

- **Purpose**: DOM/third-party library side effects (canvas, analytics, subscriptions)
- **Timing**: Runs after component mount and DOM updates; use `$effect.pre()` for before-DOM-update needs
- **Cleanup**: Return cleanup function for teardown (intervals, subscriptions)
- **Dependencies**: Tracked synchronously only; async reads not tracked
- **State Updates**: Avoid direct state updates; prefer `$derived` for synchronization; use `untrack()` if unavoidable
- **Input Sync**: Use function bindings or `oninput` callbacks, not cross-updating effects
- **Advanced**: `$effect.root`, `$effect.tracking`, `$effect.pending` for specialized cases

### Async Operations (`getAbortSignal`)

- **Purpose**: Use `getAbortSignal()` (5.21+) to obtain `AbortSignal` that auto-cancels on `$effect`/`$derived` destruction
- **Context**: Call synchronously inside reactive blocks; throws error outside reactive context
- **Usage**: Pass to APIs supporting abort signals; handle `AbortError` in try-catch
- **Best Practice**: Always handle abort errors to prevent uncaught promise rejections

```svelte
<script lang="ts">
	import { getAbortSignal } from 'svelte';
	import type { Item } from '$lib/types';

	let { id } = $props<{ id: number }>();

	const item = $derived.by(async () => {
		try {
			const signal = getAbortSignal();
			const response = await fetch(`/api/items/${id}`, { signal });

			if (!response.ok) throw new Error('Failed to fetch item');
			return (await response.json()) as Item;
		} catch (error: any) {
			if (error.name === 'AbortError') return null;
			throw error;
		}
	});
</script>

{#await item}
	<p>Loading item...</p>
{:then data}
	{#if data}<h1>{data.name}</h1>{/if}
{:catch error}
	<p class="error">Could not load item: {error.message}</p>
{/await}
```

### Component Features

#### Props (`$props`)

- **Declaration**: `let { propName, optionalProp = 'default', ...rest } = $props();`
- **Destructuring**: Use standard JS destructuring for defaults and renaming
- **Rest Props**: Use `...rest` to capture and forward additional props
- **Unique IDs**: Use `$props.id()` for accessibility attributes (consistent server/client IDs)
  - Generates identical IDs on server and client, preventing hydration mismatches
  - Essential for form labels, ARIA relationships, and keyboard navigation
  - IDs are unique within component instance, not globally unique
  - More efficient than generating random IDs or using external libraries
  - Prevents common SSR/client ID mismatch issues

```svelte
<script>
	const uid = $props.id();
</script>

<form>
	<label for="{uid}-first-name">First Name:</label>
	<input id="{uid}-first-name" type="text" />

	<label for="{uid}-last-name">Last Name:</label>
	<input id="{uid}-last-name" type="text" />
</form>
```

#### Two-Way Binding (`$bindable`)

- **Bindable Props**: `let { value = $bindable() } = $props();`
- **Parent Binding**: Use `bind:propName` in parent component
- **Fallback Values**: Avoid binding `undefined` to props with fallback values

#### Function Bindings

- **Custom Logic**: Use `[getter, setter]` tuple for validation/transformation on bind

```svelte
<script lang="ts">
	let value = $state('');

	function get() {
		return value.toUpperCase();
	}
	function set(newValue: string) {
		if (newValue.length < 10) {
			value = newValue.toLowerCase();
		}
	}
</script>

<input bind:value={[get, set]} />
```

#### Advanced Binding Targets

- **Groups**: `bind:group` for radio/checkbox groups
- **Details**: `bind:open` for `<details>` elements
- **Media**: Bind `currentTime`, `paused`, `volume`, etc. on `<audio>`/`<video>`
- **Dimensions**: Readonly bindings for `clientWidth`, `offsetHeight`, etc.
- **Content**: Bind `innerHTML`, `innerText`, `textContent` with `contenteditable="true"`

### Template Features

#### Snippets & Rendering

- **Definition**: `{#snippet name(param1, param2)}...{/snippet}`
- **Rendering**: `{@render name(arg1, arg2)}`
- **Children**: Content inside component tags becomes `children` snippet prop

#### Control Flow

- **Key Blocks**: `{#key expression}` to force recreation when expression changes
- **Const Tags**: `{@const area = item.width * item.height}` for local template constants
- **Debug Tags**: `{@debug user, cartItems}` for reactive debugging

#### Transitions & Animation

- **Transitions**: Use `transition:`, `in:`, `out:` with functions from `svelte/transition`
- **Global Transitions**: Add `|global` modifier to play on parent block changes
- **List Animation**: Use `animate:flip` on keyed `{#each}` children for reorder animations

#### Attachments (5.29+)

- **Basic**: `{@attach myAttachment}` to run functions in effects when element mounts
- **Factories**: `{@attach tooltip(content)}` for parameterized attachments
- **Component Props**: Attachments on components apply to spread elements

### Module Scripts

- **Purpose**: Shared logic across component instances; runs once per module
- **Scope**: Module variables accessible in instance script; not vice versa
- **Exports**: Can export constants, functions, snippets (if no instance dependencies)
- **Restrictions**: No Runes, no store subscriptions, minimal side effects
- **Environment**: Guard browser-only code with `if (browser)` check

### Special Elements

- **Window**: `<svelte:window>` for window events/properties (prefer `svelte/reactivity/window` module)
- **Document**: `<svelte:document>` for document events like `visibilitychange`
- **Body**: `<svelte:body>` for body events/actions
- **Dynamic**: `<svelte:element this={tag}>` for dynamic element types
- **Options**: `<svelte:options>` for component-level compiler options
- **Boundary**: `<svelte:boundary>` for comprehensive error handling with async operations
  - Provides `pending`, `then`, and `catch` snippets for different states
  - Handles promises and async operations gracefully
  - Can be nested for granular error handling at different component levels
  - Use `$effect.pending()` to track pending promises within boundaries

```svelte
<svelte:boundary>
  {#snippet pending()}
    <div class="loading">Loading data...</div>
  {/snippet}

  {#snippet then(data)}
    <DataComponent {data} />
  {/snippet}

  {#snippet catch(error)}
    <ErrorDisplay message={error.message} />
  {/snippet}

  <AsyncDataLoader />
</svelte:boundary>
```

### Reactive Collections

- **Built-ins**: Use `SvelteMap`, `SvelteSet`, `SvelteDate`, `SvelteURL`, `SvelteURLSearchParams` from `svelte/reactivity`
- **Media Queries**: Use `MediaQuery` class for reactive breakpoint state with optional server fallback
- **Window Properties**: Import reactive properties from `svelte/reactivity/window`:
  - Dimensions: `innerWidth`, `innerHeight`, `outerWidth`, `outerHeight`
  - Scroll: `scrollX`, `scrollY`
  - State: `online`, `devicePixelRatio`
- **Custom External Systems**: Use `createSubscriber` (5.7+) to integrate event-based APIs (WebSocket, IntersectionObserver)

```ts
import { innerWidth, online } from 'svelte/reactivity/window';
const isMobile = $derived(innerWidth.current < 768);
const isOffline = $derived(!online.current);
```

### Custom Elements

- **Compilation**: Use `customElement: true` compiler option; specify tag with `<svelte:options customElement="my-element" />`
- **Configuration**: Customize with object form for shadow DOM (`shadow: "none"`), props reflection, lifecycle extensions
- **Access Host**: Use `$host()` rune to access and manipulate host element (dispatch events, etc.)
- **Limitations**: Styles encapsulated, no SSR support, different slotting behavior vs regular Svelte components

## Styling (Tailwind CSS Primary)

### Approach

- **Primary Method**: Apply Tailwind utility classes directly in components
- **Avoid Global CSS**: Minimize `app.css` usage; prefer component-scoped styles
- **Component Styles**: Use scoped `<style>` tags only when Tailwind is insufficient

### Dynamic Styles

- **Style Directives**: Use `style:property={value}` for dynamic inline styles
- **Precedence**: `style:` directives always override standard `style` attributes
- **Important**: Use `style:property|important={value}` when needed

```svelte
<div
	style:color={darkMode ? 'white' : 'black'}
	style:opacity
	style:--custom-property|important={value}
>
	...
</div>
```

### Dynamic Classes (Svelte 5.16+)

```svelte
<script lang="ts">
	import type { ClassValue } from 'svelte/elements';

	interface Props {
		class?: ClassValue;
	}

	let { class: classList, ...rest }: Props = $props();
</script>

<!-- Object form -->
<div class={{ cool, lame: !cool }}>...</div>

<!-- Array form -->
<div class={[faded && 'opacity-50 saturate-0', large && 'scale-200']}>...</div>

<!-- Mixed with props -->
<div class={['base-class', classList]} {...rest}>
	<!-- ... -->
</div>
```

### Global Keyframes

```svelte
<style>
	@keyframes -global-fade-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
</style>
```

## TypeScript Guidelines

### Configuration

- **Script Tags**: Use `<script lang="ts">` for all components

### Type Definitions

- **Interfaces vs Types**: Prefer `interface` for object shapes; `type` for unions/intersections
- **Avoid `any`**: Provide specific types; explicitly type function parameters/returns
- **Utility Types**: Use built-in utilities (`Partial`, `Required`, `Pick`, `Omit`)
- **Type Narrowing**: Prefer type guards over type assertions

### Build and Deployment

- Frontend builds to static files for Tauri consumption
- Development server runs on port 1420 (Tauri requirement)
- Cross-platform considerations for Windows target from WSL development environment
- GitHub Actions workflows:
  - `build.yml` - Automated build pipeline
  - `claude.yml` - Claude PR Assistant
  - `claude-code-review.yml` - Claude Code Review workflow
