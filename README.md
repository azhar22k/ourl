# out-url

> Lightweight, cross-platform utility to open URLs and local files in desktop browsers with **zero dependencies**. Agent-ready with native Model Context Protocol (MCP) and LLM function calling support.

[![NPM](https://nodei.co/npm/out-url.svg?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/out-url/)

[![CI](https://github.com/azhar22k/ourl/actions/workflows/ci.yml/badge.svg)](https://github.com/azhar22k/ourl/actions/workflows/ci.yml) [![CodeQL](https://github.com/azhar22k/ourl/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/azhar22k/ourl/actions/workflows/codeql-analysis.yml) [![Release Please](https://github.com/azhar22k/ourl/actions/workflows/release-please.yml/badge.svg)](https://github.com/azhar22k/ourl/actions/workflows/release-please.yml) [![Publish to NPM](https://github.com/azhar22k/ourl/actions/workflows/publish.yml/badge.svg)](https://github.com/azhar22k/ourl/actions/workflows/publish.yml) ![](https://img.shields.io/npm/v/out-url) ![](https://img.shields.io/bundlephobia/minzip/out-url) ![](https://img.shields.io/bundlephobia/min/out-url) ![](https://img.shields.io/npm/dt/out-url) ![](https://img.shields.io/github/issues/azhar22k/ourl) ![](https://img.shields.io/github/issues-pr/azhar22k/ourl)

---

## ✨ Features

- 🪶 **Zero Dependencies**: Pure vanilla Node.js standard library — no bloatware, minimal footprint.
- 🌍 **Cross-Platform**: Seamless support for macOS, Windows, Linux, WSL, and Android (Termux).
- ⚡ **Asynchronous & Non-Blocking**: Spawns detached background processes without hanging your Node.js event loop.
- 🤖 **AI Agent-Ready**: Native **Model Context Protocol (MCP)** server for Claude Desktop, Cursor, and Zed.
- 🛠️ **Built-in LLM Tool Schemas**: Zero-boilerplate function calling definitions for OpenAI, Anthropic Claude, and Google Gemini.
- 🔍 **Command Simulation (`--dry-run`)**: Preview resolved OS executable binaries and arguments before spawning.
- 🛡️ **URL Validation & Security**: Built-in protection against malicious pseudo-protocols (`javascript:`, `vbscript:`, `data:`).
- 💻 **Automation Friendly**: Supports custom browser arguments (e.g. `--remote-debugging-port=9222`), headless fallback, and machine-readable `--json` output.

---

## 📦 Installation

Install locally in your project:

```bash
npm install out-url
# or
bun add out-url
# or
yarn add out-url
# or
pnpm add out-url
```

Or run instantly via `npx` or `bunx` without installing:

```bash
npx out-url https://github.com/azhar22k
# or with the shortcut
bunx ourl https://github.com/azhar22k
```

---

## 🚀 Quick Start

### From the Command Line (CLI)

```bash
# Open a URL in default browser
npx out-url https://github.com/azhar22k

# Open in a specific browser
npx out-url https://github.com/azhar22k --app firefox

# Open in private / incognito mode
npx out-url https://github.com/azhar22k -i
```

### In Node.js / TypeScript

```javascript
const { open } = require('out-url');
// or: import open from 'out-url';

// Non-blocking: opens browser immediately and lets your process continue
await open('https://github.com/azhar22k');

// Open local HTML reports or files
await open('./coverage/index.html');
```

---

## 💻 CLI Reference

The CLI is available as either `out-url` or `ourl`.

### 1. Basic Targets
```bash
# Open any web URL
npx out-url https://github.com/azhar22k

# Open local HTML files, markdown, or generated reports
npx out-url ./coverage/index.html

# Reveal current directory or folder
npx out-url .

# Open the current git repository's remote URL on GitHub/GitLab
npx out-url --repo
```

### 2. STDIN & Piping
Pipe URLs directly into `out-url` from other CLI tools or scripts:

```bash
# Open origin remote URL
git remote get-url origin | npx out-url

# Pipe from echo or scripts
echo "https://github.com/azhar22k" | bunx ourl
```

### 3. Browser Selection & Incognito
```bash
# Open in specific browser (chrome, firefox, edge, safari, brave)
npx out-url https://github.com/azhar22k --app firefox
npx out-url https://github.com/azhar22k --app chrome

# Open in private / incognito browsing mode
npx out-url https://github.com/azhar22k -i
npx out-url https://github.com/azhar22k --app chrome -i
```

### 4. Process Control & Environments
```bash
# Wait for the browser window/process to exit before resolving
npx out-url https://github.com/azhar22k --wait

# Gracefully print URL in headless CI / Docker environments without a display server
npx out-url https://github.com/azhar22k --fallback
```

### 5. CLI Options Summary

| Flag | Shorthand | Description |
|---|---|---|
| `--app <name>` | | Target specific browser (`chrome`, `firefox`, `edge`, `safari`, `brave`) |
| `--incognito` | `-i` | Launch browser in private / incognito mode |
| `--wait` | | Wait for browser process to terminate before exiting |
| `--repo` | | Open the current git repository's remote URL |
| `--fallback` | | Gracefully print URL in headless CI / Docker environments |
| `--dry-run` | | Simulate command resolution without launching browser process |
| `--validate` | | Validate and sanitize target URL without opening |
| `--json` | | Output result as machine-readable JSON for agents and scripts |
| `--schema[=format]` | | Output LLM tool definition schema (`openai`, `anthropic`, `gemini`) |
| `--mcp` | | Run as native Model Context Protocol (MCP) server over stdio |
| `--version` | `-v` | Display version |
| `--help` | `-h` | Display help message |

---

## 🛠️ Programmatic API Reference

### `open(target, [options])`

Opens a target URL, file, or folder. Returns a `Promise` that resolves to a Node.js `ChildProcess` object (or `null` in headless fallback mode, or `DryRunResult` in dry-run mode).

```javascript
const { open } = require('out-url');

// Basic usage
await open('https://github.com/azhar22k');
```

#### Options (`OpenOptions`)

| Option | Type | Default | Description |
|---|---|---|---|
| `app` | `string` | `null` | Target browser alias (`'chrome'`, `'firefox'`, `'edge'`, `'safari'`, `'brave'`) or executable path |
| `incognito` | `boolean` | `false` | Launch browser in private / incognito mode |
| `wait` | `boolean` | `false` | Block promise resolution until browser process terminates |
| `browserArgs` | `string[] \| string` | `[]` | Additional flags to pass to browser (e.g. `'--remote-debugging-port=9222'`) |
| `dryRun` | `boolean` | `false` | Simulate command resolution without spawning a process |
| `validate` | `boolean \| ValidateUrlOptions` | `false` | Validate and sanitize URL against dangerous protocols before launching |
| `fallback` | `boolean \| Function` | `false` | Gracefully handle headless/CI environments. If function, called with formatted URL |

#### Examples

```javascript
const { open } = require('out-url');

// 1. Non-blocking (default): exits immediately while browser stays open
await open('https://github.com/azhar22k');

// 2. Wait for browser to close
await open('https://github.com/azhar22k', { wait: true });

// 3. Open in a specific browser
await open('https://github.com/azhar22k', { app: 'firefox' });

// 4. Open in private/incognito mode
await open('https://github.com/azhar22k', { incognito: true });

// 5. Pass custom browser flags (e.g. CDP remote debugging)
await open('https://github.com/azhar22k', {
  app: 'chrome',
  browserArgs: '--remote-debugging-port=9222',
});

// 6. Safe opening: automatically reject invalid or dangerous targets
await open('https://github.com/azhar22k', { validate: true });

// 7. Dry-run simulation (preview command without spawning process)
const preview = await open('https://github.com/azhar22k', { dryRun: true });
console.log(preview.command); // e.g. 'open' on macOS, 'cmd.exe' on Windows

// 8. Headless CI / Docker fallback
await open('https://github.com/azhar22k', { fallback: true });
```

#### Error Handling

```javascript
const { open } = require('out-url');

open('https://github.com/azhar22k')
  .then((childProcess) => {
    if (childProcess) {
      console.log('Browser launched with PID:', childProcess.pid);
    }
  })
  .catch((err) => {
    console.error('Failed to open:', err.message);
  });
```

---

## ⚙️ Advanced & Automation Features

### 1. Command Preview & Simulation (`--dry-run` / `dryRun: true`)

Before executing operating system commands, AI agents and security-hardened wrappers often need to preview or inspect the resolved binary and arguments without launching a process:

```bash
# Preview via CLI
npx out-url https://github.com/azhar22k --app chrome --browser-args="--remote-debugging-port=9222" --dry-run
# Output: [out-url dry-run] Would execute: open -a Google Chrome -n --args --remote-debugging-port=9222 https://github.com/azhar22k

# Machine-readable JSON output
npx out-url https://github.com/azhar22k --app chrome --browser-args="--remote-debugging-port=9222" --dry-run --json
```

Output:
```json
{
  "status": "dry_run",
  "command": "open",
  "args": [
    "-a",
    "Google Chrome",
    "-n",
    "--args",
    "--remote-debugging-port=9222",
    "https://github.com/azhar22k"
  ],
  "target": "https://github.com/azhar22k",
  "resolvedTarget": "https://github.com/azhar22k",
  "formattedUrl": "https://github.com/azhar22k",
  "platform": "darwin"
}
```

In Node.js:
```javascript
const { open } = require('out-url');

const preview = await open('https://github.com/azhar22k', {
  app: 'chrome',
  browserArgs: '--remote-debugging-port=9222',
  dryRun: true,
});

console.log(preview.command); // 'open' (or 'cmd.exe', 'xdg-open')
console.log(preview.args);    // ['-a', 'Google Chrome', ...]
```

---

### 2. Custom Browser Flags & Remote Debugging (`--browser-args`)

When building browser automation pipelines, test runners, or attaching automated tools (Playwright, Puppeteer, Chrome DevTools Protocol), you can launch the real browser with custom flags:

```bash
npx out-url https://github.com/azhar22k --app chrome --browser-args="--remote-debugging-port=9222 --disable-gpu"
```

In Node.js:
```javascript
const { open } = require('out-url');

await open('https://github.com/azhar22k', {
  app: 'chrome',
  browserArgs: [
    '--remote-debugging-port=9222',
    '--disable-gpu',
    '--user-data-dir=/tmp/agent-chrome-profile',
  ],
});
```

---

### 3. URL Validation & Security Sanitization (`open.validateUrl()` / `--validate`)

Autonomous agents frequently parse URLs from untrusted model outputs, prompt injections, or scraped web pages. Malicious pseudo-protocols (`javascript:`, `vbscript:`, `data:`, `about:`, `blob:`) can trigger severe security vulnerabilities or shell execution exploits.

`out-url` provides zero-dependency URL validation and security sanitization:

#### CLI URL Validation
```bash
# Validate URL without opening (exits 0 if valid)
npx out-url https://github.com/azhar22k --validate
# [out-url] Valid target: https://github.com/azhar22k (https:)

# Machine-readable JSON output for agent pipelines
npx out-url https://github.com/azhar22k --validate --json
# {"status":"valid","valid":true,"target":"https://github.com/azhar22k","url":"https://github.com/azhar22k","protocol":"https:","isLocal":false}

# Rejects dangerous pseudo-protocols (exits 1)
npx out-url "javascript:alert(1)" --validate --json
# {"status":"invalid","valid":false,"target":"javascript:alert(1)","protocol":"javascript:","error":"Dangerous or unsupported protocol: javascript:"}
```

#### In Node.js / TypeScript
```javascript
const { open, validateUrl } = require('out-url');

// 1. Standalone URL validation
const check = validateUrl('https://github.com/azhar22k');
console.log(check.valid);    // true
console.log(check.protocol); // 'https:'

const dangerous = validateUrl('javascript:alert(1)');
console.log(dangerous.valid); // false
console.log(dangerous.error); // 'Dangerous or unsupported protocol: javascript:'

// 2. Safe opening: automatically reject invalid or dangerous targets
await open(untrustedInput, { validate: true });
```

---

## 🤖 AI Agents & Model Context Protocol (MCP)

`out-url` is designed to be agent-ready for AI coding assistants (Claude Desktop, Cursor, Zed, Antigravity, Copilot), LLM frameworks, and automated scripts.

### 1. Native Model Context Protocol (MCP) Server (`--mcp`)

`out-url` includes a native, zero-dependency **Model Context Protocol (MCP)** server over standard I/O (stdio). This connects **Claude Desktop**, **Cursor**, **Zed**, and other MCP-compatible assistants directly to your desktop browser with zero extra configuration or heavy dependencies.

#### Claude Desktop Configuration
Add to your `claude_desktop_config.json`:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

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

#### Exposed MCP Tool
- **`open_in_browser`**: Opens a URL, local file, or directory in the desktop browser.
  - `url` *(string, required)*: Target URL or path (e.g. `https://github.com/azhar22k`, `./coverage/index.html`).
  - `app` *(string, optional)*: Target browser alias (`chrome`, `firefox`, `edge`, `safari`, `brave`).
  - `incognito` *(boolean, optional)*: Private browsing mode.
  - `browserArgs` *(string, optional)*: Custom flags (e.g. `--remote-debugging-port=9222`).
  - `validate` *(boolean, optional)*: Automatically sanitize against dangerous protocols before launching.

---

### 2. Built-in LLM Function Calling Schemas (`--schema`)

Drop pre-configured tool schemas into **OpenAI**, **Anthropic Claude**, **Google Gemini**, and **Vercel AI SDK** with zero boilerplate:

#### CLI Schema Inspection
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
  messages: [{ role: 'user', content: 'Open https://github.com/azhar22k in Chrome' }],
  tools: [toolDefinition],
});

// 2. Anthropic Claude Tools
const claudeMsg = await anthropic.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  messages: [{ role: 'user', content: 'Open https://github.com/azhar22k' }],
  tools: [getToolDefinition({ format: 'anthropic' })],
});

// 3. Google Gemini Function Declarations
const geminiModel = genAI.getGenerativeModel({
  model: 'gemini-1.5-pro',
  tools: [{ functionDeclarations: [getToolDefinition({ format: 'gemini' })] }],
});
```

---

### 3. Machine-Readable JSON Output (`--json`)

Agents and scripts can execute `out-url` and inspect process IDs and execution status directly:

```bash
npx out-url https://github.com/azhar22k --json
```

Output:
```json
{
  "status": "success",
  "target": "https://github.com/azhar22k",
  "resolvedTarget": "https://github.com/azhar22k",
  "pid": 58312,
  "platform": "darwin"
}
```

---

## 🌐 Supported Platforms

`out-url` seamlessly bridges operating system differences under the hood:

| Platform | Underlying Mechanism | Special Features |
|---|---|---|
| **macOS** | `open` | Supports browser aliases, incognito, `-W` wait, and `-n` flag injection |
| **Windows** | `cmd.exe /c start ""` | Sanitizes special `&`, `^`, `%` characters, window title handling |
| **WSL (Windows Subsystem for Linux)** | Windows host bridge (`cmd.exe`) | Automatically detected; opens URLs in the Windows desktop browser |
| **Linux** | `xdg-open` / browser binary | Desktop environment detection; headless fallback |
| **Android (Termux)** | `termux-open-url` | Native Termux intent launcher |

---

## 🔄 Releases & Versioning

This repository follows [Conventional Commits](https://www.conventionalcommits.org/) and uses [Google Release Please](https://github.com/googleapis/release-please) for automated semantic versioning and package publishing.

- **Commit Types**:
  - `fix:` bumps the **patch** version (e.g. `1.2.2` &rarr; `1.2.3`).
  - `feat:` bumps the **minor** version (e.g. `1.2.2` &rarr; `1.3.0`).
  - `BREAKING CHANGE:` or `!` (e.g. `feat!:`) bumps the **major** version (e.g. `1.2.2` &rarr; `2.0.0`).
- **Automated Flow**:
  1. Merging conventional commits to `main` creates or updates a Release PR with version bumps and changelog updates.
  2. Merging the Release PR tags the commit and publishes a GitHub Release.
  3. The GitHub Release triggers the automated NPM workflow to publish the new package version to NPM.

---

## 📄 License

MIT © [Azhar Khan](https://github.com/azhar22k)
