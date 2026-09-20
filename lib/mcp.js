const readline = require('readline');
const pkg = require('../package.json');

const getOpenHandler = (customOpen) => {
  if (typeof customOpen === 'function') return customOpen;
  // eslint-disable-next-line global-require
  return require('../index');
};

const startMcpServer = (serverOptions = {}, customOpen = null) => {
  const inStream = (serverOptions && serverOptions.inStream) || process.stdin;
  const outStream = (serverOptions && serverOptions.outStream) || process.stdout;
  const openFn = (serverOptions && serverOptions.open) || getOpenHandler(customOpen);

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
                  validate: {
                    type: 'boolean',
                    description: 'Validate and sanitize URL to block dangerous protocols before opening.',
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
        const child = await openFn(toolArgs.url, {
          app: toolArgs.app,
          incognito: toolArgs.incognito,
          browserArgs: toolArgs.browserArgs,
          validate: toolArgs.validate !== undefined ? toolArgs.validate : true,
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

module.exports = {
  startMcpServer,
};
