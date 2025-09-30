#!/usr/bin/env node

/**
 * Version Bumper for Focalite (Tauri v2 + Svelte)
 *
 * This script updates version numbers across the project and optionally creates git commits/tags.
 * It updates the following files in sync:
 *   - package.json
 *   - src-tauri/tauri.conf.json
 *   - src-tauri/Cargo.toml
 *   - src-tauri/Cargo.lock (via cargo update)
 *
 * Usage Examples:
 *   node scripts/bump-version.mjs 0.1.1                    # Set explicit version
 *   node scripts/bump-version.mjs v0.1.1                   # Set explicit version (v prefix stripped)
 *   node scripts/bump-version.mjs patch                    # Bump patch version (0.1.1 → 0.1.2)
 *   node scripts/bump-version.mjs minor                    # Bump minor version (0.1.1 → 0.2.0)
 *   node scripts/bump-version.mjs major                    # Bump major version (0.1.1 → 1.0.0)
 *   node scripts/bump-version.mjs patch --dry-run          # Preview changes without writing
 *   node scripts/bump-version.mjs minor --commit --tag     # Bump, commit, and tag
 *   node scripts/bump-version.mjs major --commit --tag --push  # Bump, commit, tag, and push to remote
 *
 * Flags:
 *   --dry-run    Preview changes without writing files or running git commands
 *   --commit     Create a git commit with the version changes
 *   --tag        Create a git tag (v{version})
 *   --push       Push commit and tags to remote (requires --commit and --tag)
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

// ==============================================================================
// Constants
// ==============================================================================

const ROOT = process.cwd();
const PKG_PATH = path.join(ROOT, 'package.json');
const TAURI_PATH = path.join(ROOT, 'src-tauri', 'tauri.conf.json');
const CARGO_TOML_PATH = path.join(ROOT, 'src-tauri', 'Cargo.toml');

// ==============================================================================
// File I/O Utilities
// ==============================================================================

/**
 * Reads a file as text, throwing an error with context if it fails.
 * @param {string} filePath - Absolute path to the file
 * @returns {string} File contents as UTF-8 string
 */
function readText(filePath) {
	try {
		return fs.readFileSync(filePath, 'utf8');
	} catch (err) {
		throw new Error(`Failed to read ${path.relative(ROOT, filePath)}: ${err.message}`);
	}
}

/**
 * Detects the indentation style of a JSON file (spaces or tabs).
 * @param {string} jsonText - Raw JSON text
 * @param {number|string} fallback - Default indentation (2 spaces)
 * @returns {number|string} Number of spaces or '\t' for tabs
 */
function detectIndent(jsonText, fallback = 2) {
	const match = jsonText.match(/^\{\n([ \t]+)/);
	if (!match) return fallback;

	const whitespace = match[1];
	// If tabs are used, return '\t', otherwise return number of spaces
	if (whitespace.includes('\t')) return '\t';
	return whitespace.length;
}

/**
 * Parses a JSON file while preserving its indentation style.
 * @param {string} filePath - Absolute path to JSON file
 * @returns {{json: object, indent: number|string}} Parsed JSON and detected indent
 */
function parseJSONWithIndent(filePath) {
	const text = readText(filePath);
	const indent = detectIndent(text, 2);
	try {
		return { json: JSON.parse(text), indent };
	} catch (err) {
		throw new Error(`Invalid JSON in ${path.relative(ROOT, filePath)}: ${err.message}`);
	}
}

/**
 * Writes a JavaScript object to a JSON file with proper indentation.
 * @param {string} filePath - Absolute path to output file
 * @param {object} obj - Object to serialize
 * @param {number|string} indent - Indentation (spaces or '\t')
 */
function writeJSON(filePath, obj, indent) {
	try {
		const content = JSON.stringify(obj, null, indent) + '\n';
		fs.writeFileSync(filePath, content, 'utf8');
	} catch (err) {
		throw new Error(`Failed to write ${path.relative(ROOT, filePath)}: ${err.message}`);
	}
}

/**
 * Writes text to a file.
 * @param {string} filePath - Absolute path to output file
 * @param {string} content - Text content to write
 */
function writeText(filePath, content) {
	try {
		fs.writeFileSync(filePath, content, 'utf8');
	} catch (err) {
		throw new Error(`Failed to write ${path.relative(ROOT, filePath)}: ${err.message}`);
	}
}

// ==============================================================================
// Version Manipulation
// ==============================================================================

/**
 * Bumps a semantic version by major, minor, or patch.
 * @param {string} current - Current version (e.g., "0.1.1")
 * @param {'major'|'minor'|'patch'} type - Bump type
 * @returns {string} New version (e.g., "0.1.2")
 */
function bumpSemver(current, type) {
	const [major, minor, patch] = current.split('.').map((n) => parseInt(n, 10));

	// Validate that all parts are valid numbers
	if ([major, minor, patch].some((n) => Number.isNaN(n))) {
		throw new Error(`Invalid semver format: ${current}`);
	}

	switch (type) {
		case 'major':
			return `${major + 1}.0.0`;
		case 'minor':
			return `${major}.${minor + 1}.0`;
		case 'patch':
			return `${major}.${minor}.${patch + 1}`;
		default:
			throw new Error(`Unknown bump type: ${type}`);
	}
}

/**
 * Normalizes version input (explicit version or bump type).
 * @param {string} input - User input (e.g., "0.1.2", "v0.1.2", "patch")
 * @param {string} currentVersion - Current version for relative bumps
 * @returns {string} Normalized version without 'v' prefix
 */
function normalizeVersion(input, currentVersion) {
	if (!input) {
		throw new Error('Version or bump type required (e.g., "0.1.2" or "patch")');
	}

	const trimmed = String(input).trim();

	// Check if it's a bump type (major, minor, patch)
	if (/^(major|minor|patch)$/.test(trimmed)) {
		return bumpSemver(currentVersion, trimmed);
	}

	// Otherwise, treat as explicit version (strip 'v' prefix if present)
	const version = trimmed.replace(/^v/, '');

	// Validate semver format (x.y.z)
	if (!/^\d+\.\d+\.\d+$/.test(version)) {
		throw new Error(`Invalid version format: ${input} (expected x.y.z)`);
	}

	return version;
}

// ==============================================================================
// File Update Functions
// ==============================================================================

/**
 * Updates the version field in Cargo.toml using regex replacement.
 * Only updates the first occurrence under [package] section.
 * @param {string} cargoText - Current Cargo.toml contents
 * @param {string} newVersion - New version to set
 * @returns {string} Updated Cargo.toml contents
 */
function updateCargoToml(cargoText, newVersion) {
	// Match: version = "x.y.z"
	// Replace with: version = "newVersion"
	const updated = cargoText.replace(
		/^(version\s*=\s*")[^"]+(")\s*$/m,
		`$1${newVersion}$2`
	);

	// Verify that the replacement actually happened
	if (updated === cargoText) {
		throw new Error('Failed to update Cargo.toml: version field not found');
	}

	return updated;
}

/**
 * Updates Cargo.lock by running `cargo update --workspace`.
 * This ensures Cargo.lock stays in sync with Cargo.toml changes.
 * @param {boolean} dryRun - If true, only show what would be done
 */
function updateCargoLock(dryRun) {
	console.log('  → Updating Cargo.lock via cargo update...');

	if (dryRun) {
		console.log('    [dry-run] Would run: cargo update --workspace --manifest-path src-tauri/Cargo.toml');
		return;
	}

	try {
		execSync('cargo update --workspace --manifest-path src-tauri/Cargo.toml', {
			stdio: 'inherit',
			cwd: ROOT
		});
	} catch (err) {
		throw new Error(`Failed to update Cargo.lock: ${err.message}`);
	}
}

// ==============================================================================
// Git Operations
// ==============================================================================

/**
 * Checks if git is available in PATH.
 * @returns {boolean} True if git is available
 */
function hasGit() {
	try {
		execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });
		return true;
	} catch {
		return false;
	}
}

/**
 * Runs a git command, optionally in dry-run mode.
 * @param {string[]} args - Git command arguments
 * @param {boolean} dryRun - If true, only show what would be done
 */
function runGit(args, dryRun) {
	const cmd = `git ${args.join(' ')}`;

	if (dryRun) {
		console.log(`  [dry-run] Would run: ${cmd}`);
		return;
	}

	try {
		execSync(cmd, { stdio: 'inherit', cwd: ROOT });
	} catch (err) {
		throw new Error(`Git command failed: ${cmd}\n${err.message}`);
	}
}

// ==============================================================================
// Main Script
// ==============================================================================

try {
	// Parse command-line arguments
	const args = process.argv.slice(2);
	const flags = new Set(args.filter((a) => a.startsWith('--')));
	const positional = args.filter((a) => !a.startsWith('--'));

	// Extract flags
	const dryRun = flags.has('--dry-run');
	const doCommit = flags.has('--commit');
	const doTag = flags.has('--tag');
	const doPush = flags.has('--push');

	// Show help if no arguments provided
	if (positional.length === 0) {
		console.error('Error: Version or bump type required\n');
		console.error('Usage:');
		console.error('  node scripts/bump-version.mjs <version|patch|minor|major> [--dry-run] [--commit] [--tag] [--push]');
		console.error('\nExamples:');
		console.error('  node scripts/bump-version.mjs 0.1.2');
		console.error('  node scripts/bump-version.mjs patch --dry-run');
		console.error('  node scripts/bump-version.mjs minor --commit --tag --push');
		process.exit(1);
	}

	// Check git availability if git operations are requested
	if ((doCommit || doTag || doPush) && !hasGit()) {
		throw new Error('Git not available in PATH (required for --commit, --tag, --push)');
	}

	console.log('Reading current versions...');

	// Read all three files
	const { json: pkg, indent: pkgIndent } = parseJSONWithIndent(PKG_PATH);
	const { json: tauri, indent: tauriIndent } = parseJSONWithIndent(TAURI_PATH);
	const cargoText = readText(CARGO_TOML_PATH);

	// Get current version from package.json
	const currentVersion = pkg.version;
	if (!currentVersion) {
		throw new Error('package.json is missing a "version" field');
	}

	console.log(`Current version: ${currentVersion}`);

	// Calculate new version
	const newVersion = normalizeVersion(positional[0], currentVersion);

	if (newVersion === currentVersion) {
		console.log(`Version is already ${newVersion}, no changes needed.`);
		process.exit(0);
	}

	console.log(`New version: ${newVersion}`);

	if (dryRun) {
		console.log('\n[DRY RUN MODE] - No files will be modified\n');
	}

	// Update all files
	console.log('\nUpdating files...');

	console.log(`  → package.json`);
	pkg.version = newVersion;
	if (!dryRun) {
		writeJSON(PKG_PATH, pkg, pkgIndent);
	}

	console.log(`  → src-tauri/tauri.conf.json`);
	tauri.version = newVersion;
	if (!dryRun) {
		writeJSON(TAURI_PATH, tauri, tauriIndent);
	}

	console.log(`  → src-tauri/Cargo.toml`);
	const updatedCargo = updateCargoToml(cargoText, newVersion);
	if (!dryRun) {
		writeText(CARGO_TOML_PATH, updatedCargo);
	}

	// Update Cargo.lock to stay in sync
	updateCargoLock(dryRun);

	console.log(`\n✓ Version updated to ${newVersion}`);

	// Git operations
	if (doCommit) {
		console.log('\nCreating git commit...');
		runGit(['add', 'package.json', 'src-tauri/tauri.conf.json', 'src-tauri/Cargo.toml', 'src-tauri/Cargo.lock'], dryRun);
		runGit(['commit', '-m', `chore: release v${newVersion}`], dryRun);
		console.log('✓ Commit created');
	}

	if (doTag) {
		console.log('\nCreating git tag...');
		runGit(['tag', `v${newVersion}`], dryRun);
		console.log(`✓ Tag v${newVersion} created`);
	}

	if (doPush) {
		console.log('\nPushing to remote...');
		runGit(['push'], dryRun);
		runGit(['push', '--tags'], dryRun);
		console.log('✓ Pushed to remote');
	}

	console.log('\n✓ Done!');

	if (dryRun) {
		console.log('\nTo apply these changes, run the same command without --dry-run');
	} else if (doCommit && doTag && !doPush) {
		console.log('\nTo push to remote, run:');
		console.log('  git push origin main --tags');
	}
} catch (err) {
	console.error('\n❌ Error:', err.message || err);
	process.exit(1);
}
