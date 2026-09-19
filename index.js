const { spawn, execFileSync } = require('child_process');
const os = require('os');
const { existsSync } = require('fs');
const { resolve: pathResolve } = require('path');
const { pathToFileURL } = require('url');
const readline = require('readline');
const pkg = require('./package.json');

const isWsl = () => {
  if (process.platform !== 'linux') return false;
  if (process.env.WSL_DISTRO_NAME || process.env.WSL_INTEROP) return true;
  return os.release().toLowerCase().includes('microsoft');
};

const resolveTarget = (target) => {
  if (typeof target === 'string' && existsSync(target)) {
    return pathToFileURL(pathResolve(target)).href;
  }
  return target;
};

const parseGitRemoteUrl = (remoteUrl) => {
  if (!remoteUrl || typeof remoteUrl !== 'string') return null;
  const trimmed = remoteUrl.trim();
  const sshMatch = trimmed.match(/^(?:ssh:\/\/)?git@([^:/]+)[:/](.+?)(?:\.git)?$/);
  if (sshMatch) {
    return `https://${sshMatch[1]}/${sshMatch[2]}`;
  }
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed.replace(/\.git$/, '');
  }
  return null;
};

const getGitRepoUrl = (remote = 'origin') => {
  try {
    const raw = execFileSync('git', ['remote', 'get-url', remote], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return parseGitRemoteUrl(raw);
  } catch (err) {
    return null;
  }
};

const isHeadless = () => {
  if (process.platform !== 'linux') return false;
  if (isWsl()) return false;
  return !process.env.DISPLAY && !process.env.WAYLAND_DISPLAY;
};

const BROWSER_ALIASES = {
  darwin: {
    chrome: 'Google Chrome',
    firefox: 'Firefox',
    edge: 'Microsoft Edge',
    safari: 'Safari',
    brave: 'Brave Browser',
  },
  win32: {
    chrome: 'chrome',
    firefox: 'firefox',
    edge: 'msedge',
    brave: 'brave',
  },
  linux: {
    chrome: 'google-chrome',
    firefox: 'firefox',
    edge: 'microsoft-edge',
    brave: 'brave-browser',
  },
};

const getIncognitoFlag = (browser) => {
  const lower = (browser || '').toLowerCase();
  if (lower.includes('firefox')) return '--private-window';
  if (lower.includes('edge') || lower.includes('msedge')) return '--inprivate';
  return '--incognito';
};

const normalizeBrowserArgs = (browserArgs) => {
  if (Array.isArray(browserArgs)) return browserArgs;
  if (typeof browserArgs === 'string' && browserArgs.trim()) {
    return browserArgs.trim().split(/\s+/);
  }
  return [];
};

const getCommands = (options = {}) => {
  const { platform } = process;
  const platformAliases = BROWSER_ALIASES[platform];
  const app = options.app
    ? ((platformAliases && platformAliases[options.app.toLowerCase()]) || options.app)
    : null;
  const incognito = Boolean(options.incognito);
  const extraBrowserArgs = normalizeBrowserArgs(options.browserArgs);

  if (platform === 'darwin') {
    const args = [];
    if (options.wait) args.push('-W');
    const targetApp = app || (incognito || extraBrowserArgs.length > 0 ? 'Google Chrome' : null);
    if (targetApp) {
      args.push('-a', targetApp);
      const flags = [];
      if (incognito) flags.push(getIncognitoFlag(targetApp));
      if (extraBrowserArgs.length > 0) flags.push(...extraBrowserArgs);
      if (flags.length > 0) {
        args.push('-n', '--args', ...flags);
      }
    }
    return ['open', args];
  }

  if (platform === 'win32' || isWsl()) {
    const startArgs = ['/c', 'start', '""'];
    if (options.wait) {
      startArgs.push('/wait');
    }
    const winApp = app || (incognito || extraBrowserArgs.length > 0 ? 'chrome' : null);
    if (winApp) {
      startArgs.push(winApp);
      if (incognito) {
        startArgs.push(getIncognitoFlag(winApp));
      }
      if (extraBrowserArgs.length > 0) {
        startArgs.push(...extraBrowserArgs);
      }
    }
    return ['cmd.exe', startArgs];
  }

  if (platform === 'android' && process.env.TERMUX_VERSION) {
    return ['termux-open-url', []];
  }

  if (platform === 'android' || platform === 'linux') {
    const linuxApp = app || (incognito || extraBrowserArgs.length > 0 ? 'google-chrome' : null);
    if (linuxApp) {
      const args = [];
      if (incognito) args.push(getIncognitoFlag(linuxApp));
      if (extraBrowserArgs.length > 0) args.push(...extraBrowserArgs);
      return [linuxApp, args];
    }
    return ['xdg-open', []];
  }

  throw new Error(`Platform ${platform} isn't supported.`);
};

const formatUrl = (url, command) => {
  const encoded = encodeURI(url);
  if (command === 'cmd.exe') {
    return encoded.replace(/&/g, '^&');
  }
  return encoded;
};

const open = (url, options = {}) => new Promise((resolve, reject) => {
  const target = resolveTarget(url);
  const [command, baseArgs = []] = getCommands(options);
  const formattedUrl = formatUrl(target, command);

  if (options.fallback && isHeadless()) {
    if (typeof options.fallback === 'function') {
      options.fallback(formattedUrl);
    } else {
      // eslint-disable-next-line no-console
      console.log(`[out-url] Headless environment detected. Open link: ${formattedUrl}`);
    }
    resolve(null);
    return;
  }
  const args = [...baseArgs, formattedUrl];

  const child = spawn(command, args, {
    detached: !options.wait,
    stdio: 'ignore',
    windowsHide: true,
  });

  child.on('error', reject);

  if (options.wait) {
    child.on('close', (code) => {
      if (code === 0) {
        resolve(child);
      } else {
        reject(new Error(`Process exited with code ${code}`));
      }
    });
  } else {
    child.unref();
    child.on('spawn', () => resolve(child));
  }
});

const TOOL_SCHEMA_PROPERTIES = {
  url: {
    type: 'string',
    description: 'The URL or local file path to open (e.g. "https://example.com", "http://localhost:3000", "./coverage/index.html").',
  },
  app: {
    type: 'string',
    description: 'Target browser or application (e.g. "chrome", "firefox", "edge", "safari", "brave").',
  },
  incognito: {
    type: 'boolean',
    description: 'Open in private / incognito browsing mode.',
  },
  browserArgs: {
    type: 'string',
    description: 'Additional flags or arguments to pass to the browser (e.g. "--remote-debugging-port=9222").',
  },
  wait: {
    type: 'boolean',
    description: 'Wait for the browser/app process to close before resolving.',
  },
  fallback: {
    type: 'boolean',
    description: 'Gracefully handle headless/CI environments without a display server.',
  },
};

const getToolDefinition = (options = {}) => {
  const format = (options && options.format ? options.format : 'openai').toLowerCase();

  if (format === 'anthropic' || format === 'claude') {
    return {
      name: 'open_in_browser',
      description: 'Opens a URL, local file, directory, or git repository in the user\'s desktop browser.',
      input_schema: {
        type: 'object',
        properties: TOOL_SCHEMA_PROPERTIES,
        required: ['url'],
      },
    };
  }

  if (format === 'gemini') {
    const geminiProperties = Object.keys(TOOL_SCHEMA_PROPERTIES).reduce((acc, key) => {
      const prop = TOOL_SCHEMA_PROPERTIES[key];
      return Object.assign(acc, {
        [key]: {
          type: prop.type.toUpperCase(),
          description: prop.description,
        },
      });
    }, {});

    return {
      name: 'open_in_browser',
      description: 'Opens a URL, local file, directory, or git repository in the user\'s desktop browser.',
      parameters: {
        type: 'OBJECT',
        properties: geminiProperties,
        required: ['url'],
      },
    };
  }

  return {
    type: 'function',
    function: {
      name: 'open_in_browser',
      description: 'Opens a URL, local file, directory, or git repository in the user\'s desktop browser.',
      parameters: {
        type: 'object',
        properties: TOOL_SCHEMA_PROPERTIES,
        required: ['url'],
      },
    },
  };
};

const toolDefinition = getToolDefinition({ format: 'openai' });

const startMcpServer = (serverOptions = {}) => {
  const inStream = (serverOptions && serverOptions.inStream) || process.stdin;
  const outStream = (serverOptions && serverOptions.outStream) || process.stdout;

  const rl = readline.createInterface({
    input: inStream,
    terminal: false,
  });

  const send = (message) => {
    outStream.write(`${JSON.stringify(message)}\n`);
  };

  rl.on('line', async (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    let request;
    try {
      request = JSON.parse(trimmed);
    } catch (err) {
      send({
        jsonrpc: '2.0',
        id: null,
        error: { code: -32700, message: 'Parse error: invalid JSON' },
      });
      return;
    }

    const { id, method, params } = request;

    if (method === 'initialize') {
      send({
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: (params && params.protocolVersion) || '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: {
            name: 'out-url',
            version: pkg.version,
          },
        },
      });
      return;
    }

    if (method === 'notifications/initialized') {
      return;
    }

    if (method === 'ping') {
      send({ jsonrpc: '2.0', id, result: {} });
      return;
    }

    if (method === 'tools/list') {
      send({
        jsonrpc: '2.0',
        id,
        result: {
          tools: [
            {
              name: 'open_in_browser',
              description: 'Opens a URL, local file, directory, or git repository in the desktop browser.',
              inputSchema: {
                type: 'object',
                properties: {
                  url: {
                    type: 'string',
                    description: 'The URL or local file path to open (e.g. "https://github.com", "http://localhost:3000", "./coverage/index.html").',
                  },
                  app: {
                    type: 'string',
                    description: 'Target browser or application (e.g. "chrome", "firefox", "edge", "safari", "brave").',
                  },
                  incognito: {
                    type: 'boolean',
                    description: 'Open in private / incognito browsing mode.',
                  },
                  browserArgs: {
                    type: 'string',
                    description: 'Additional flags or arguments to pass to the browser (e.g. "--remote-debugging-port=9222").',
                  },
                },
                required: ['url'],
              },
            },
          ],
        },
      });
      return;
    }

    if (method === 'tools/call') {
      const toolName = params && params.name;
      const toolArgs = (params && params.arguments) || {};

      if (toolName !== 'open_in_browser') {
        send({
          jsonrpc: '2.0',
          id,
          result: {
            content: [{ type: 'text', text: `Unknown tool: "${toolName}"` }],
            isError: true,
          },
        });
        return;
      }

      if (!toolArgs.url) {
        send({
          jsonrpc: '2.0',
          id,
          result: {
            content: [{ type: 'text', text: 'Missing required argument: "url"' }],
            isError: true,
          },
        });
        return;
      }

      try {
        const child = await open(toolArgs.url, {
          app: toolArgs.app,
          incognito: toolArgs.incognito,
          browserArgs: toolArgs.browserArgs,
        });
        const pidInfo = child && child.pid ? ` (PID: ${child.pid})` : '';
        send({
          jsonrpc: '2.0',
          id,
          result: {
            content: [{
              type: 'text',
              text: `Successfully opened ${toolArgs.url}${pidInfo}`,
            }],
            isError: false,
          },
        });
      } catch (err) {
        send({
          jsonrpc: '2.0',
          id,
          result: {
            content: [{ type: 'text', text: `Failed to open: ${err.message}` }],
            isError: true,
          },
        });
      }
      return;
    }

    if (id !== undefined && id !== null) {
      send({
        jsonrpc: '2.0',
        id,
        error: {
          code: -32601,
          message: `Method "${method}" not found`,
        },
      });
    }
  });

  return { rl, close: () => rl.close() };
};

open.open = open;
open.getCommands = getCommands;
open.isWsl = isWsl;
open.isHeadless = isHeadless;
open.formatUrl = formatUrl;
open.resolveTarget = resolveTarget;
open.parseGitRemoteUrl = parseGitRemoteUrl;
open.getGitRepoUrl = getGitRepoUrl;
open.normalizeBrowserArgs = normalizeBrowserArgs;
open.toolDefinition = toolDefinition;
open.getToolDefinition = getToolDefinition;
open.startMcpServer = startMcpServer;

module.exports = open;
