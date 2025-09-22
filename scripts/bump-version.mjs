#!/usr/bin/env node
// Simple version bumper for Focalite (Tauri v2 + Svelte)
// Updates: package.json, src-tauri/tauri.conf.json, src-tauri/Cargo.toml
// Usage examples:
//   node scripts/bump-version.mjs 0.1.1
//   node scripts/bump-version.mjs v0.1.1
//   node scripts/bump-version.mjs patch
//   node scripts/bump-version.mjs minor --commit --tag
//   node scripts/bump-version.mjs major --commit --tag --push

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const PKG_PATH = path.join(ROOT, 'package.json');
const TAURI_PATH = path.join(ROOT, 'src-tauri', 'tauri.conf.json');
const CARGO_PATH = path.join(ROOT, 'src-tauri', 'Cargo.toml');

function readText(p) {
  return fs.readFileSync(p, 'utf8');
}

function detectIndent(jsonText, fallback = 2) {
  const m = jsonText.match(/^\{\n([ \t]+)/);
  if (!m) return fallback;
  const ws = m[1];
  if (ws.includes('\t')) return '\t';
  return ws.length; // number of spaces
}

function parseJSONWithIndent(p) {
  const text = readText(p);
  const indent = detectIndent(text, 2);
  return { json: JSON.parse(text), indent };
}

function writeJSON(p, obj, indent) {
  const str = JSON.stringify(obj, null, indent) + '\n';
  fs.writeFileSync(p, str);
}

function bumpSemver(current, type) {
  const [maj, min, pat] = current.split('.').map((n) => parseInt(n, 10));
  if ([maj, min, pat].some((n) => Number.isNaN(n))) {
    throw new Error(`Invalid current semver: ${current}`);
  }
  switch (type) {
    case 'major':
      return `${maj + 1}.0.0`;
    case 'minor':
      return `${maj}.${min + 1}.0`;
    case 'patch':
      return `${maj}.${min}.${pat + 1}`;
    default:
      throw new Error(`Unknown bump type: ${type}`);
  }
}

function normalizeVersion(input, currentPkgVersion) {
  if (!input) throw new Error('Version or bump type required');
  const t = String(input).trim();
  if (/^(major|minor|patch)$/.test(t)) {
    return bumpSemver(currentPkgVersion, t);
  }
  // explicit version, allow leading v
  const v = t.replace(/^v/, '');
  if (!/^\d+\.\d+\.\d+$/.test(v)) {
    throw new Error(`Invalid version: ${input}`);
  }
  return v;
}

function updateCargoToml(text, version) {
  // Replace the first version = "x.y.z" under [package]
  return text.replace(/^(version\s*=\s*")[^"]+("\s*)$/m, `$1${version}$2`);
}

function run(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, { stdio: 'inherit', ...opts });
  if (res.status !== 0) {
    throw new Error(`${cmd} ${args.join(' ')} failed with code ${res.status}`);
  }
}

function hasGit() {
  try {
    spawnSync('git', ['rev-parse', '--is-inside-work-tree'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// CLI args
const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith('--')));
const positional = args.filter((a) => !a.startsWith('--'));
const doCommit = flags.has('--commit');
const doTag = flags.has('--tag');
const doPush = flags.has('--push');

try {
  // Read current versions
  const { json: pkg, indent: pkgIndent } = parseJSONWithIndent(PKG_PATH);
  const { json: tauri, indent: tauriIndent } = parseJSONWithIndent(TAURI_PATH);
  const cargoText = readText(CARGO_PATH);
  const current = pkg.version;
  if (!current) throw new Error('package.json missing version');

  const next = normalizeVersion(positional[0], current);

  // Update package.json
  pkg.version = next;
  writeJSON(PKG_PATH, pkg, pkgIndent);

  // Update tauri.conf.json
  tauri.version = next;
  writeJSON(TAURI_PATH, tauri, tauriIndent);

  // Update Cargo.toml
  const newCargo = updateCargoToml(cargoText, next);
  fs.writeFileSync(CARGO_PATH, newCargo);

  console.log(`Updated versions to ${next}`);

  if ((doCommit || doTag || doPush) && !hasGit()) {
    throw new Error('Git not available in PATH for commit/tag operations');
  }

  if (doCommit) {
    run('git', ['add', 'package.json', 'src-tauri/tauri.conf.json', 'src-tauri/Cargo.toml']);
    run('git', ['commit', '-m', `chore: release v${next}`]);
  }

  if (doTag) {
    run('git', ['tag', `v${next}`]);
  }

  if (doPush) {
    // push commit and tags
    run('git', ['push']);
    run('git', ['push', '--tags']);
  }
} catch (err) {
  console.error('[bump-version] Error:', err.message || err);
  process.exit(1);
}

