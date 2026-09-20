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
  dryRun: {
    type: 'boolean',
    description: 'Simulate command resolution without launching the browser/app process.',
  },
  wait: {
    type: 'boolean',
    description: 'Wait for the browser/app process to close before resolving.',
  },
  fallback: {
    type: 'boolean',
    description: 'Gracefully handle headless/CI environments without a display server.',
  },
  validate: {
    type: 'boolean',
    description: 'Validate and sanitize URL to block dangerous protocols (e.g. javascript:) before opening.',
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

module.exports = {
  TOOL_SCHEMA_PROPERTIES,
  getToolDefinition,
  toolDefinition,
};
