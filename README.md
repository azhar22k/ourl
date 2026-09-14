# out-url
Light Weight, Cross platform Node.js Utility to open urls in browser with zero dependencies

[![NPM](https://nodei.co/npm/out-url.svg?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/out-url/)


[![CodeQL](https://github.com/azhar22k/ourl/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/azhar22k/ourl/actions/workflows/codeql-analysis.yml) [![Release Please](https://github.com/azhar22k/ourl/actions/workflows/release-please.yml/badge.svg)](https://github.com/azhar22k/ourl/actions/workflows/release-please.yml) [![Publish to NPM](https://github.com/azhar22k/ourl/actions/workflows/publish.yml/badge.svg)](https://github.com/azhar22k/ourl/actions/workflows/publish.yml) ![](https://img.shields.io/npm/v/out-url) ![](https://img.shields.io/bundlephobia/minzip/out-url) ![](https://img.shields.io/bundlephobia/min/out-url) ![](https://img.shields.io/npm/dt/out-url) ![](https://img.shields.io/github/issues/azhar22k/ourl) ![](https://img.shields.io/github/issues-pr/azhar22k/ourl)

## Installation

```bash
npm install out-url
# or
yarn add out-url
```

## Supported platforms
- Android
- Windows
- MacOS
- Linux

### Example
```javascript
// Plain example
const { open } = require('out-url');
open('https://github.com/azhar22k');
//or
require('out-url').open('https://github.com/azhar22k');
```

```javascript
// With error handling
const { open } = require('out-url');
open('https://github.com/azhar22k')
  .then(res => console.log('RES', res)) // Resolves with Done!
  .catch(err => console.log('ERR', err));
```

```javascript
// Using async/await
const { open } = require('out-url');

const foo = async () => {
  await open('https://github.com/azhar22k');
};
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
