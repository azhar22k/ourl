# out-url
Light Weight, Cross platform Node.js Utility to open urls in browser with zero dependencies

[![NPM](https://nodei.co/npm/out-url.svg?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/out-url/)


[![CI](https://github.com/azhar22k/ourl/actions/workflows/ci.yml/badge.svg)](https://github.com/azhar22k/ourl/actions/workflows/ci.yml) [![CodeQL](https://github.com/azhar22k/ourl/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/azhar22k/ourl/actions/workflows/codeql-analysis.yml) [![Release Please](https://github.com/azhar22k/ourl/actions/workflows/release-please.yml/badge.svg)](https://github.com/azhar22k/ourl/actions/workflows/release-please.yml) [![Publish to NPM](https://github.com/azhar22k/ourl/actions/workflows/publish.yml/badge.svg)](https://github.com/azhar22k/ourl/actions/workflows/publish.yml) ![](https://img.shields.io/npm/v/out-url) ![](https://img.shields.io/bundlephobia/minzip/out-url) ![](https://img.shields.io/bundlephobia/min/out-url) ![](https://img.shields.io/npm/dt/out-url) ![](https://img.shields.io/github/issues/azhar22k/ourl) ![](https://img.shields.io/github/issues-pr/azhar22k/ourl)

## Installation

```bash
npm install out-url
# or
bun add out-url
# or
yarn add out-url
```

## Supported platforms
- MacOS
- Windows
- Linux & WSL (Windows Subsystem for Linux)
- Android (Termux & standard Android environments)

## CLI Usage

Run directly without installing via `npx` or `bunx`:

```bash
# Using out-url or ourl
npx out-url https://github.com/azhar22k
# or
bunx ourl https://github.com/azhar22k

# Open current git repository's remote URL in browser
npx out-url --repo

# Open local HTML files or reports
npx out-url ./coverage/index.html

# Reveal current directory
npx out-url .

# Wait for browser process to terminate
npx out-url https://github.com/azhar22k --wait

# Pipe URL from other commands (STDIN)
git remote get-url origin | npx out-url
echo "https://github.com/azhar22k" | bunx ourl
```

## API Usage

### Basic Example
```javascript
const open = require('out-url');
// or: const { open } = require('out-url');
// or: import open, { open as openUrl } from 'out-url';

// Open web URLs
open('https://github.com/azhar22k');

// Open local files or folders
open('./coverage/index.html');
```

### Non-blocking vs. Waiting
By default, `open()` spawns a detached background process and immediately unrefs it so your Node.js process can exit without hanging:

```javascript
const { open } = require('out-url');

// Non-blocking (default): exits immediately while browser stays open
await open('https://github.com/azhar22k');

// Wait for browser/app process to close before resolving:
await open('https://github.com/azhar22k', { wait: true });
```

### With Error Handling
```javascript
const { open } = require('out-url');

open('https://github.com/azhar22k')
  .then((childProcess) => console.log('Launched child PID:', childProcess.pid))
  .catch((err) => console.error('Failed to open:', err));
```

## Releases & Versioning

This repository follows [Conventional Commits](https://www.conventionalcommits.org/) and uses [Google Release Please](https://github.com/googleapis/release-please) for automated semantic versioning and package publishing.

- **Commit Types**:
  - `fix:` bumps the **patch** version (e.g. `1.2.2` &rarr; `1.2.3`).
  - `feat:` bumps the **minor** version (e.g. `1.2.2` &rarr; `1.3.0`).
  - `BREAKING CHANGE:` or `!` (e.g. `feat!:`) bumps the **major** version (e.g. `1.2.2` &rarr; `2.0.0`).
- **Automated Flow**:
  1. Merging conventional commits to `main` creates or updates a Release PR with version bumps and changelog updates.
  2. Merging the Release PR tags the commit and publishes a GitHub Release.
  3. The GitHub Release triggers the automated NPM workflow to publish the new package version to NPM.
