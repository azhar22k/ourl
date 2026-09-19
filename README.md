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

# Open in specific browser (e.g. firefox, chrome, edge, safari)
npx out-url http://localhost:3000 --app firefox

# Open in incognito / private browsing mode
npx out-url http://localhost:3000 -i

# Pass custom browser flags (e.g. Chrome DevTools Protocol / CDP remote debugging port)
npx out-url http://localhost:3000 --app chrome --browser-args="--remote-debugging-port=9222"

# Wait for browser process to terminate
npx out-url https://github.com/azhar22k --wait

# Pipe URL from other commands (STDIN)
git remote get-url origin | npx out-url
echo "https://github.com" | bunx ourl

# Print URL in headless CI / Docker environments without a display
npx out-url https://github.com/azhar22k --fallback

# Machine-readable JSON output for AI agents and scripts
npx out-url http://localhost:3000 --json

# Print LLM Function Calling tool definition schema (OpenAI, Anthropic, Gemini)
npx out-url --schema
npx out-url --schema=anthropic
npx out-url --schema=gemini

# Run as Model Context Protocol (MCP) server for Claude Desktop and Cursor
npx out-url --mcp
```

## AI Agents & Automation

`out-url` is built from the ground up to be agent-ready for AI coding assistants (Cursor, Claude, Antigravity, Copilot), LLM frameworks, and automated scripts.

### Native Model Context Protocol (MCP) Server (`--mcp`)

`out-url` includes a zero-dependency, native **Model Context Protocol (MCP)** server running over standard I/O (stdio). This allows **Claude Desktop**, **Cursor**, **Zed**, and other MCP-compatible AI agents to open links, local documentation, test dashboards, and web applications on demand.

#### Claude Desktop Configuration
Add to your `claude_desktop_config.json` (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS, `%APPDATA%\Claude\claude_desktop_config.json` on Windows):

```json
{
  "mcpServers": {
    "out-url": {
      "command": "npx",
      "args": ["-y", "out-url", "--mcp"]
    }
  }
}
```

#### Cursor Configuration
Add to `.cursor/mcp.json` in your workspace or global settings:

```json
{
  "mcpServers": {
    "out-url": {
      "command": "npx",
      "args": ["-y", "out-url", "--mcp"]
    }
  }
}
```

#### Exposed MCP Tools
- **`open_in_browser`**: Opens a URL, local file, or directory in the desktop browser.
  - `url` *(string, required)*: Target URL or path (e.g. `http://localhost:3000`, `./coverage/index.html`).
  - `app` *(string, optional)*: Browser alias (`chrome`, `firefox`, `edge`, `safari`, `brave`).
  - `incognito` *(boolean, optional)*: Private browsing mode.
  - `browserArgs` *(string, optional)*: Custom flags (e.g. `--remote-debugging-port=9222`).

### Machine-Readable JSON Output (`--json`)
AI agents and scripts can inspect the exact launch status and process ID without parsing human terminal output:

```bash
npx out-url http://localhost:3000 --json
```

Output:
```json
{
  "status": "success",
  "target": "http://localhost:3000",
  "resolvedTarget": "http://localhost:3000",
  "pid": 58312,
  "platform": "darwin"
}
```

### Custom Browser Flags & Remote Debugging (`--browser-args`)

When building AI coding agents, test runners, or browser automation pipelines (such as Playwright, Puppeteer, or Chrome DevTools MCP servers), you often need to launch an actual desktop browser configured with remote debugging flags:

```bash
# Launch Chrome with a remote debugging port for CDP / DevTools agents
npx out-url http://localhost:3000 --app chrome --browser-args="--remote-debugging-port=9222 --disable-gpu"
```

In Node.js:
```javascript
const { open } = require('out-url');

// Launch browser with remote debugging for AI agents or Playwright/Puppeteer CDP connection
await open('http://localhost:3000', {
  app: 'chrome',
  browserArgs: [
    '--remote-debugging-port=9222',
    '--disable-gpu',
    '--user-data-dir=/tmp/agent-chrome-profile',
  ],
});
```

### Built-in LLM Tool Definitions (Function Calling)

Building an autonomous agent or AI assistant? `out-url` ships with pre-configured tool schemas ready to drop into **OpenAI**, **Anthropic Claude**, **Google Gemini**, and **Vercel AI SDK** with zero boilerplate.

#### CLI Schema Inspection
Piping the tool schema into prompt files or agent definitions:
```bash
# OpenAI / standard JSON Schema format
npx out-url --schema

# Anthropic Claude format
npx out-url --schema=anthropic

# Google Gemini format
npx out-url --schema=gemini
```

#### In Node.js / TypeScript Agents
```javascript
const { open, toolDefinition, getToolDefinition } = require('out-url');

// 1. OpenAI Function Calling
const completion = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Open localhost:3000 in Chrome' }],
  tools: [toolDefinition],
});

// 2. Anthropic Claude Tools
const claudeMsg = await anthropic.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  messages: [{ role: 'user', content: 'Open GitHub repo' }],
  tools: [getToolDefinition({ format: 'anthropic' })],
});

// 3. Google Gemini Function Declarations
const geminiModel = genAI.getGenerativeModel({
  model: 'gemini-1.5-pro',
  tools: [{ functionDeclarations: [getToolDefinition({ format: 'gemini' })] }],
});
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

// Open in a specific browser:
await open('http://localhost:3000', { app: 'firefox' });

// Open in private/incognito mode:
await open('http://localhost:3000', { incognito: true });

// Pass custom browser flags (string or array):
await open('http://localhost:3000', {
  app: 'chrome',
  browserArgs: '--remote-debugging-port=9222',
});

// Gracefully handle headless/CI environments (e.g. Docker, SSH):
await open('https://github.com/azhar22k', { fallback: true });
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
