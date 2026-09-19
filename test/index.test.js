/* eslint-disable no-script-url */
const { describe, it, afterEach } = require('node:test');
const assert = require('node:assert');
const { execFileSync } = require('child_process');
const { PassThrough } = require('stream');
const path = require('path');
const open = require('../index');
const pkg = require('../package.json');

const originalPlatform = Object.getOwnPropertyDescriptor(process, 'platform');
const originalEnv = { ...process.env };

const setPlatform = (platform) => {
  Object.defineProperty(process, 'platform', {
    value: platform,
    configurable: true,
  });
};

const restore = () => {
  Object.defineProperty(process, 'platform', originalPlatform);
  process.env = { ...originalEnv };
};

const sleep = (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

describe('out-url core', () => {
  afterEach(() => {
    restore();
  });

  it('exports open function with named and default compatibility', () => {
    assert.strictEqual(typeof open, 'function');
    assert.strictEqual(typeof open.open, 'function');
    assert.strictEqual(open, open.open);
  });

  it('defines valid package exports in package.json', () => {
    assert.ok(pkg.exports);
    assert.strictEqual(pkg.exports['.'].default, './index.js');
    assert.strictEqual(pkg.exports['.'].types, './index.d.ts');
  });

  describe('command resolution across platforms', () => {
    it('resolves darwin open command without wait', () => {
      setPlatform('darwin');
      const [cmd, args] = open.getCommands();
      assert.strictEqual(cmd, 'open');
      assert.deepStrictEqual(args, []);
    });

    it('resolves darwin open command with wait', () => {
      setPlatform('darwin');
      const [cmd, args] = open.getCommands({ wait: true });
      assert.strictEqual(cmd, 'open');
      assert.deepStrictEqual(args, ['-W']);
    });

    it('resolves win32 cmd.exe start command without wait', () => {
      setPlatform('win32');
      const [cmd, args] = open.getCommands();
      assert.strictEqual(cmd, 'cmd.exe');
      assert.deepStrictEqual(args, ['/c', 'start', '""']);
    });

    it('resolves win32 cmd.exe start command with wait', () => {
      setPlatform('win32');
      const [cmd, args] = open.getCommands({ wait: true });
      assert.strictEqual(cmd, 'cmd.exe');
      assert.deepStrictEqual(args, ['/c', 'start', '""', '/wait']);
    });

    it('resolves linux xdg-open command', () => {
      setPlatform('linux');
      delete process.env.WSL_DISTRO_NAME;
      delete process.env.WSL_INTEROP;
      const [cmd, args] = open.getCommands();
      assert.strictEqual(cmd, 'xdg-open');
      assert.deepStrictEqual(args, []);
    });

    it('resolves WSL to cmd.exe start command', () => {
      setPlatform('linux');
      process.env.WSL_DISTRO_NAME = 'Ubuntu';
      const [cmd, args] = open.getCommands();
      assert.strictEqual(cmd, 'cmd.exe');
      assert.deepStrictEqual(args, ['/c', 'start', '""']);
    });

    it('resolves android in Termux to termux-open-url', () => {
      setPlatform('android');
      process.env.TERMUX_VERSION = '0.118';
      const [cmd, args] = open.getCommands();
      assert.strictEqual(cmd, 'termux-open-url');
      assert.deepStrictEqual(args, []);
    });

    it('resolves android outside Termux to xdg-open', () => {
      setPlatform('android');
      delete process.env.TERMUX_VERSION;
      const [cmd, args] = open.getCommands();
      assert.strictEqual(cmd, 'xdg-open');
      assert.deepStrictEqual(args, []);
    });

    it('resolves darwin open with app and incognito options', () => {
      setPlatform('darwin');
      const [cmd, args] = open.getCommands({ app: 'firefox' });
      assert.strictEqual(cmd, 'open');
      assert.deepStrictEqual(args, ['-a', 'Firefox']);

      const [cmd2, args2] = open.getCommands({ app: 'chrome', incognito: true });
      assert.strictEqual(cmd2, 'open');
      assert.deepStrictEqual(args2, ['-a', 'Google Chrome', '-n', '--args', '--incognito']);
    });

    it('resolves darwin open with browserArgs', () => {
      setPlatform('darwin');
      const [cmd, args] = open.getCommands({ browserArgs: ['--remote-debugging-port=9222'] });
      assert.strictEqual(cmd, 'open');
      assert.deepStrictEqual(args, ['-a', 'Google Chrome', '-n', '--args', '--remote-debugging-port=9222']);

      const [cmd2, args2] = open.getCommands({
        app: 'chrome',
        incognito: true,
        browserArgs: '--remote-debugging-port=9222 --disable-gpu',
      });
      assert.strictEqual(cmd2, 'open');
      assert.deepStrictEqual(args2, [
        '-a',
        'Google Chrome',
        '-n',
        '--args',
        '--incognito',
        '--remote-debugging-port=9222',
        '--disable-gpu',
      ]);
    });

    it('resolves win32 cmd.exe with app and incognito options', () => {
      setPlatform('win32');
      const [cmd, args] = open.getCommands({ app: 'firefox' });
      assert.strictEqual(cmd, 'cmd.exe');
      assert.deepStrictEqual(args, ['/c', 'start', '""', 'firefox']);

      const [cmd2, args2] = open.getCommands({ incognito: true });
      assert.strictEqual(cmd2, 'cmd.exe');
      assert.deepStrictEqual(args2, ['/c', 'start', '""', 'chrome', '--incognito']);
    });

    it('resolves win32 cmd.exe with browserArgs', () => {
      setPlatform('win32');
      const [cmd, args] = open.getCommands({ browserArgs: ['--remote-debugging-port=9222'] });
      assert.strictEqual(cmd, 'cmd.exe');
      assert.deepStrictEqual(args, ['/c', 'start', '""', 'chrome', '--remote-debugging-port=9222']);

      const [cmd2, args2] = open.getCommands({
        app: 'edge',
        incognito: true,
        browserArgs: '--remote-debugging-port=9222',
      });
      assert.strictEqual(cmd2, 'cmd.exe');
      assert.deepStrictEqual(args2, ['/c', 'start', '""', 'msedge', '--inprivate', '--remote-debugging-port=9222']);
    });

    it('resolves linux with app and incognito options', () => {
      setPlatform('linux');
      delete process.env.WSL_DISTRO_NAME;
      delete process.env.WSL_INTEROP;
      const [cmd, args] = open.getCommands({ app: 'firefox', incognito: true });
      assert.strictEqual(cmd, 'firefox');
      assert.deepStrictEqual(args, ['--private-window']);
    });

    it('resolves linux with browserArgs', () => {
      setPlatform('linux');
      delete process.env.WSL_DISTRO_NAME;
      delete process.env.WSL_INTEROP;
      const [cmd, args] = open.getCommands({ browserArgs: ['--remote-debugging-port=9222'] });
      assert.strictEqual(cmd, 'google-chrome');
      assert.deepStrictEqual(args, ['--remote-debugging-port=9222']);

      const [cmd2, args2] = open.getCommands({
        app: 'firefox',
        incognito: true,
        browserArgs: '--remote-debugging-port=9222',
      });
      assert.strictEqual(cmd2, 'firefox');
      assert.deepStrictEqual(args2, ['--private-window', '--remote-debugging-port=9222']);
    });

    it('throws on unsupported platform', () => {
      setPlatform('sunos');
      assert.throws(() => open.getCommands(), /Platform sunos isn't supported\./);
    });
  });

  describe('url formatting and escaping', () => {
    it('encodes standard spaces in url', () => {
      const formatted = open.formatUrl('https://example.com/hello world', 'open');
      assert.strictEqual(formatted, 'https://example.com/hello%20world');
    });

    it('escapes special cmd & character for cmd.exe', () => {
      const formatted = open.formatUrl('https://example.com?a=1&b=2', 'cmd.exe');
      assert.strictEqual(formatted, 'https://example.com?a=1^&b=2');
    });

    it('does not escape cmd characters for non-cmd commands', () => {
      const formatted = open.formatUrl('https://example.com?a=1&b=2', 'open');
      assert.strictEqual(formatted, 'https://example.com?a=1&b=2');
    });
  });

  describe('git repository remote resolution', () => {
    it('parses standard SSH git remotes', () => {
      const parsed = open.parseGitRemoteUrl('git@github.com:azhar22k/ourl.git');
      assert.strictEqual(parsed, 'https://github.com/azhar22k/ourl');
    });

    it('parses ssh:// prefixed git remotes', () => {
      const parsed = open.parseGitRemoteUrl('ssh://git@gitlab.com/org/subgroup/project.git');
      assert.strictEqual(parsed, 'https://gitlab.com/org/subgroup/project');
    });

    it('parses HTTPS git remotes', () => {
      const parsed = open.parseGitRemoteUrl('https://github.com/azhar22k/ourl.git');
      assert.strictEqual(parsed, 'https://github.com/azhar22k/ourl');
    });

    it('returns null for invalid or empty remotes', () => {
      assert.strictEqual(open.parseGitRemoteUrl(''), null);
      assert.strictEqual(open.parseGitRemoteUrl(null), null);
      assert.strictEqual(open.parseGitRemoteUrl('not-a-remote'), null);
    });

    it('resolves current repository origin remote', () => {
      const repoUrl = open.getGitRepoUrl('origin');
      assert.strictEqual(repoUrl, 'https://github.com/azhar22k/ourl');
    });
  });

  describe('local file and path resolution', () => {
    it('resolves existing local file path to file:// URL', () => {
      const resolved = open.resolveTarget('README.md');
      assert.match(resolved, /^file:\/\/\/.*README\.md$/);
    });

    it('resolves current directory path . to file:// URL', () => {
      const resolved = open.resolveTarget('.');
      assert.match(resolved, /^file:\/\/\//);
    });

    it('leaves web URLs unchanged', () => {
      const webUrl = 'https://github.com/azhar22k/ourl';
      assert.strictEqual(open.resolveTarget(webUrl), webUrl);
    });
  });

  describe('headless environment detection and fallback', () => {
    it('detects headless Linux without display', () => {
      setPlatform('linux');
      delete process.env.DISPLAY;
      delete process.env.WAYLAND_DISPLAY;
      delete process.env.WSL_DISTRO_NAME;
      delete process.env.WSL_INTEROP;
      assert.strictEqual(open.isHeadless(), true);
    });

    it('detects non-headless Linux when DISPLAY is present', () => {
      setPlatform('linux');
      process.env.DISPLAY = ':0';
      assert.strictEqual(open.isHeadless(), false);
    });

    it('returns false for darwin or win32', () => {
      setPlatform('darwin');
      assert.strictEqual(open.isHeadless(), false);
      setPlatform('win32');
      assert.strictEqual(open.isHeadless(), false);
    });

    it('invokes fallback callback in headless environment', async () => {
      setPlatform('linux');
      delete process.env.DISPLAY;
      delete process.env.WAYLAND_DISPLAY;
      delete process.env.WSL_DISTRO_NAME;
      delete process.env.WSL_INTEROP;

      let calledUrl = null;
      const res = await open('https://example.com', {
        fallback: (url) => {
          calledUrl = url;
        },
      });

      assert.strictEqual(res, null);
      assert.strictEqual(calledUrl, 'https://example.com');
    });
  });

  describe('normalizeBrowserArgs', () => {
    it('returns array as is if already an array', () => {
      const args = ['--remote-debugging-port=9222', '--disable-gpu'];
      assert.deepStrictEqual(open.normalizeBrowserArgs(args), args);
    });

    it('splits space-delimited argument strings', () => {
      assert.deepStrictEqual(
        open.normalizeBrowserArgs('--remote-debugging-port=9222 --disable-gpu'),
        ['--remote-debugging-port=9222', '--disable-gpu'],
      );
    });

    it('returns empty array for non-string/non-array values', () => {
      assert.deepStrictEqual(open.normalizeBrowserArgs(null), []);
      assert.deepStrictEqual(open.normalizeBrowserArgs(undefined), []);
      assert.deepStrictEqual(open.normalizeBrowserArgs(''), []);
      assert.deepStrictEqual(open.normalizeBrowserArgs(123), []);
    });
  });

  describe('toolDefinition and getToolDefinition', () => {
    it('provides standard OpenAI toolDefinition by default', () => {
      const def = open.toolDefinition;
      assert.strictEqual(def.type, 'function');
      assert.strictEqual(def.function.name, 'open_in_browser');
      assert.strictEqual(typeof def.function.description, 'string');
      assert.strictEqual(def.function.parameters.type, 'object');
      assert.ok(def.function.parameters.properties.url);
      assert.ok(def.function.parameters.properties.app);
      assert.ok(def.function.parameters.properties.incognito);
      assert.ok(def.function.parameters.properties.dryRun);
      assert.ok(def.function.parameters.properties.validate);
      assert.deepStrictEqual(def.function.parameters.required, ['url']);
    });

    it('generates Anthropic Claude tool definition schema', () => {
      const def = open.getToolDefinition({ format: 'anthropic' });
      assert.strictEqual(def.name, 'open_in_browser');
      assert.strictEqual(typeof def.description, 'string');
      assert.strictEqual(def.input_schema.type, 'object');
      assert.ok(def.input_schema.properties.url);
      assert.ok(def.input_schema.properties.dryRun);
      assert.ok(def.input_schema.properties.validate);
      assert.deepStrictEqual(def.input_schema.required, ['url']);
    });

    it('generates Google Gemini tool definition schema', () => {
      const def = open.getToolDefinition({ format: 'gemini' });
      assert.strictEqual(def.name, 'open_in_browser');
      assert.strictEqual(def.parameters.type, 'OBJECT');
      assert.strictEqual(def.parameters.properties.url.type, 'STRING');
      assert.strictEqual(def.parameters.properties.incognito.type, 'BOOLEAN');
      assert.strictEqual(def.parameters.properties.dryRun.type, 'BOOLEAN');
      assert.strictEqual(def.parameters.properties.validate.type, 'BOOLEAN');
      assert.deepStrictEqual(def.parameters.required, ['url']);
    });
  });

  describe('startMcpServer', () => {
    it('handles initialize request', async () => {
      const inStream = new PassThrough();
      const outStream = new PassThrough();
      const server = open.startMcpServer({ inStream, outStream });

      let responseData = '';
      outStream.on('data', (chunk) => {
        responseData += chunk;
      });

      inStream.write(`${JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: { protocolVersion: '2024-11-05' },
      })}\n`);

      await sleep(50);
      const response = JSON.parse(responseData.trim());
      assert.strictEqual(response.jsonrpc, '2.0');
      assert.strictEqual(response.id, 1);
      assert.strictEqual(response.result.serverInfo.name, 'out-url');
      assert.strictEqual(response.result.serverInfo.version, pkg.version);
      assert.ok(response.result.capabilities.tools);
      server.close();
    });

    it('handles ping request', async () => {
      const inStream = new PassThrough();
      const outStream = new PassThrough();
      const server = open.startMcpServer({ inStream, outStream });

      let responseData = '';
      outStream.on('data', (chunk) => {
        responseData += chunk;
      });

      inStream.write(`${JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'ping' })}\n`);

      await sleep(50);
      const response = JSON.parse(responseData.trim());
      assert.strictEqual(response.id, 2);
      assert.deepStrictEqual(response.result, {});
      server.close();
    });

    it('handles tools/list request', async () => {
      const inStream = new PassThrough();
      const outStream = new PassThrough();
      const server = open.startMcpServer({ inStream, outStream });

      let responseData = '';
      outStream.on('data', (chunk) => {
        responseData += chunk;
      });

      inStream.write(`${JSON.stringify({ jsonrpc: '2.0', id: 3, method: 'tools/list' })}\n`);

      await sleep(50);
      const response = JSON.parse(responseData.trim());
      assert.strictEqual(response.id, 3);
      assert.ok(Array.isArray(response.result.tools));
      const tool = response.result.tools.find((t) => t.name === 'open_in_browser');
      assert.ok(tool);
      assert.ok(tool.inputSchema.properties.url);
      assert.ok(tool.inputSchema.properties.validate);
      server.close();
    });

    it('handles tools/call for unknown tool', async () => {
      const inStream = new PassThrough();
      const outStream = new PassThrough();
      const server = open.startMcpServer({ inStream, outStream });

      let responseData = '';
      outStream.on('data', (chunk) => {
        responseData += chunk;
      });

      inStream.write(`${JSON.stringify({
        jsonrpc: '2.0',
        id: 4,
        method: 'tools/call',
        params: { name: 'non_existent_tool' },
      })}\n`);

      await sleep(50);
      const response = JSON.parse(responseData.trim());
      assert.strictEqual(response.id, 4);
      assert.strictEqual(response.result.isError, true);
      assert.match(response.result.content[0].text, /Unknown tool/);
      server.close();
    });

    it('handles tools/call when url is missing', async () => {
      const inStream = new PassThrough();
      const outStream = new PassThrough();
      const server = open.startMcpServer({ inStream, outStream });

      let responseData = '';
      outStream.on('data', (chunk) => {
        responseData += chunk;
      });

      inStream.write(`${JSON.stringify({
        jsonrpc: '2.0',
        id: 5,
        method: 'tools/call',
        params: { name: 'open_in_browser', arguments: {} },
      })}\n`);

      await sleep(50);
      const response = JSON.parse(responseData.trim());
      assert.strictEqual(response.id, 5);
      assert.strictEqual(response.result.isError, true);
      assert.match(response.result.content[0].text, /Missing required argument/);
      server.close();
    });

    it('handles malformed JSON lines gracefully', async () => {
      const inStream = new PassThrough();
      const outStream = new PassThrough();
      const server = open.startMcpServer({ inStream, outStream });

      let responseData = '';
      outStream.on('data', (chunk) => {
        responseData += chunk;
      });

      inStream.write('this is not json\n');

      await sleep(50);
      const response = JSON.parse(responseData.trim());
      assert.strictEqual(response.error.code, -32700);
      server.close();
    });

    it('returns method not found for unknown method with id', async () => {
      const inStream = new PassThrough();
      const outStream = new PassThrough();
      const server = open.startMcpServer({ inStream, outStream });

      let responseData = '';
      outStream.on('data', (chunk) => {
        responseData += chunk;
      });

      inStream.write(`${JSON.stringify({ jsonrpc: '2.0', id: 6, method: 'random/method' })}\n`);

      await sleep(50);
      const response = JSON.parse(responseData.trim());
      assert.strictEqual(response.id, 6);
      assert.strictEqual(response.error.code, -32601);
      server.close();
    });

    it('rejects dangerous protocols like javascript: in tools/call', async () => {
      const inStream = new PassThrough();
      const outStream = new PassThrough();
      const server = open.startMcpServer({ inStream, outStream });

      let responseData = '';
      outStream.on('data', (chunk) => {
        responseData += chunk;
      });

      inStream.write(`${JSON.stringify({
        jsonrpc: '2.0',
        id: 7,
        method: 'tools/call',
        params: { name: 'open_in_browser', arguments: { url: 'javascript:alert(1)' } },
      })}\n`);

      await sleep(50);
      const response = JSON.parse(responseData.trim());
      assert.strictEqual(response.id, 7);
      assert.strictEqual(response.result.isError, true);
      assert.match(response.result.content[0].text, /Dangerous or unsupported protocol/);
      server.close();
    });
  });

  describe('validateUrl and options.validate', () => {
    it('validates standard http and https URLs', () => {
      const res1 = open.validateUrl('https://example.com');
      assert.strictEqual(res1.valid, true);
      assert.strictEqual(res1.protocol, 'https:');
      assert.strictEqual(res1.url, 'https://example.com/');
      assert.strictEqual(res1.isLocal, false);

      const res2 = open.validateUrl('http://localhost:3000/path?query=1#hash');
      assert.strictEqual(res2.valid, true);
      assert.strictEqual(res2.protocol, 'http:');
      assert.strictEqual(res2.url, 'http://localhost:3000/path?query=1#hash');
    });

    it('rejects dangerous protocols', () => {
      const dangerousList = [
        'javascript:alert(1)',
        'JAVASCRIPT:void(0)',
        'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
        'vbscript:msgbox(1)',
        'about:blank',
        'blob:https://example.com/uuid',
      ];

      dangerousList.forEach((dangerousUrl) => {
        const res = open.validateUrl(dangerousUrl);
        assert.strictEqual(res.valid, false);
        assert.match(res.error, /Dangerous or unsupported protocol/);
      });
    });

    it('rejects non-string and empty string targets', () => {
      assert.strictEqual(open.validateUrl('').valid, false);
      assert.strictEqual(open.validateUrl('   ').valid, false);
      assert.strictEqual(open.validateUrl(null).valid, false);
      assert.strictEqual(open.validateUrl(undefined).valid, false);
      assert.strictEqual(open.validateUrl(12345).valid, false);
    });

    it('validates existing local files as file: protocol', () => {
      const res = open.validateUrl('./package.json');
      assert.strictEqual(res.valid, true);
      assert.strictEqual(res.protocol, 'file:');
      assert.strictEqual(res.isLocal, true);
      assert.ok(res.url.startsWith('file://'));
    });

    it('rejects local files when allowLocal is false', () => {
      const res = open.validateUrl('./package.json', { allowLocal: false });
      assert.strictEqual(res.valid, false);
      assert.match(res.error, /Local file targets are not permitted/);
    });

    it('enforces custom allowedProtocols list', () => {
      const res = open.validateUrl('http://example.com', { allowedProtocols: ['https:'] });
      assert.strictEqual(res.valid, false);
      assert.match(res.error, /Protocol "http:" is not allowed/);

      const resValid = open.validateUrl('https://example.com', { allowedProtocols: ['https:'] });
      assert.strictEqual(resValid.valid, true);
    });

    it('rejects malformed URLs without hostname', () => {
      const res = open.validateUrl('http://');
      assert.strictEqual(res.valid, false);
    });

    it('rejects invalid non-URL random strings', () => {
      const res = open.validateUrl('not a valid url or path');
      assert.strictEqual(res.valid, false);
    });

    it('rejects in open() when options.validate is true and URL is dangerous', async () => {
      await assert.rejects(
        open('javascript:alert(1)', { validate: true }),
        /Dangerous or unsupported protocol/,
      );
    });

    it('passes in open() when options.validate is true and URL is valid', () => {
      const validation = open.validateUrl('https://example.com', {});
      assert.strictEqual(validation.valid, true);
    });
  });

  describe('dryRun simulation mode', () => {
    it('returns command preview without spawning child process', async () => {
      setPlatform('darwin');
      const result = await open('https://example.com', { dryRun: true });
      assert.strictEqual(result.dryRun, true);
      assert.strictEqual(result.command, 'open');
      assert.deepStrictEqual(result.args, ['https://example.com']);
      assert.strictEqual(result.target, 'https://example.com');
      assert.strictEqual(result.platform, 'darwin');
    });

    it('resolves browser args and custom app in dryRun mode', async () => {
      setPlatform('darwin');
      const result = await open('http://localhost:3000', {
        app: 'chrome',
        browserArgs: ['--remote-debugging-port=9222'],
        dryRun: true,
      });
      assert.strictEqual(result.dryRun, true);
      assert.strictEqual(result.command, 'open');
      assert.deepStrictEqual(result.args, [
        '-a',
        'Google Chrome',
        '-n',
        '--args',
        '--remote-debugging-port=9222',
        'http://localhost:3000',
      ]);
    });

    it('resolves win32 command structure in dryRun mode', async () => {
      setPlatform('win32');
      const result = await open('https://example.com', { dryRun: true });
      assert.strictEqual(result.dryRun, true);
      assert.strictEqual(result.command, 'cmd.exe');
      assert.deepStrictEqual(result.args, ['/c', 'start', '""', 'https://example.com']);
    });
  });
});

describe('out-url CLI', () => {
  const cliPath = path.resolve(__dirname, '../bin/cli.js');

  it('prints version with -v or --version flag', () => {
    const output = execFileSync(process.execPath, [cliPath, '-v'], { encoding: 'utf8' });
    assert.strictEqual(output.trim(), pkg.version);
  });

  it('prints help with -h or --help flag', () => {
    const output = execFileSync(process.execPath, [cliPath, '--help'], { encoding: 'utf8' });
    assert.match(output, /Usage:/);
    assert.match(output, /--wait/);
    assert.match(output, /--repo/);
    assert.match(output, /--app/);
    assert.match(output, /--incognito/);
    assert.match(output, /--browser-args/);
    assert.match(output, /--args/);
    assert.match(output, /--fallback/);
    assert.match(output, /--dry-run/);
    assert.match(output, /--validate/);
    assert.match(output, /--json/);
    assert.match(output, /--schema/);
    assert.match(output, /--mcp/);
    assert.match(output, /<command> \| out-url/);
  });

  it('prints version as JSON with -v and --json flags', () => {
    const output = execFileSync(process.execPath, [cliPath, '-v', '--json'], { encoding: 'utf8' });
    const parsed = JSON.parse(output.trim());
    assert.strictEqual(parsed.version, pkg.version);
  });

  it('prints default OpenAI tool schema with --schema flag', () => {
    const output = execFileSync(process.execPath, [cliPath, '--schema'], { encoding: 'utf8' });
    const parsed = JSON.parse(output.trim());
    assert.strictEqual(parsed.type, 'function');
    assert.strictEqual(parsed.function.name, 'open_in_browser');
  });

  it('prints Anthropic tool schema with --schema=anthropic flag', () => {
    const output = execFileSync(process.execPath, [cliPath, '--schema=anthropic'], { encoding: 'utf8' });
    const parsed = JSON.parse(output.trim());
    assert.strictEqual(parsed.name, 'open_in_browser');
    assert.ok(parsed.input_schema);
  });

  it('prints Gemini tool schema with --schema=gemini flag', () => {
    const output = execFileSync(process.execPath, [cliPath, '--schema=gemini'], { encoding: 'utf8' });
    const parsed = JSON.parse(output.trim());
    assert.strictEqual(parsed.name, 'open_in_browser');
    assert.strictEqual(parsed.parameters.type, 'OBJECT');
  });

  it('outputs error JSON when no target is provided and --json is set', () => {
    assert.throws(
      () => execFileSync(process.execPath, [cliPath, '--json'], { input: '', stdio: 'pipe' }),
      (err) => {
        assert.strictEqual(err.status, 1);
        const parsed = JSON.parse(err.stdout.toString().trim());
        assert.strictEqual(parsed.status, 'error');
        assert.strictEqual(parsed.message, 'No target or URL provided.');
        return true;
      },
    );
  });

  it('exits with error and shows help when stdin is empty and no args given', () => {
    assert.throws(
      () => execFileSync(process.execPath, [cliPath], { input: '', stdio: 'pipe' }),
      (err) => {
        assert.strictEqual(err.status, 1);
        assert.match(err.stdout.toString(), /Usage:/);
        return true;
      },
    );
  });

  it('handles --fallback with --browser-args without throwing in CLI', () => {
    const output = execFileSync(
      process.execPath,
      [cliPath, 'https://example.com', '--fallback', '--browser-args=--remote-debugging-port=9222'],
      {
        encoding: 'utf8',
        env: {
          ...process.env,
          DISPLAY: '',
          WAYLAND_DISPLAY: '',
          WSL_DISTRO_NAME: '',
          WSL_INTEROP: '',
        },
      },
    );
    assert.ok(typeof output === 'string');
  });

  it('runs as MCP server via --mcp and responds to ping', () => {
    const pingMessage = `${JSON.stringify({ jsonrpc: '2.0', id: 99, method: 'ping' })}\n`;
    const output = execFileSync(
      process.execPath,
      [cliPath, '--mcp'],
      {
        input: pingMessage,
        encoding: 'utf8',
      },
    );
    const parsed = JSON.parse(output.trim());
    assert.strictEqual(parsed.id, 99);
    assert.deepStrictEqual(parsed.result, {});
  });

  it('outputs human-readable command preview with --dry-run', () => {
    const output = execFileSync(
      process.execPath,
      [cliPath, 'https://example.com', '--dry-run'],
      { encoding: 'utf8' },
    );
    assert.match(output, /\[out-url dry-run\] Would execute:/);
    assert.match(output, /https:\/\/example\.com/);
  });

  it('outputs JSON command preview with --dry-run and --json', () => {
    const output = execFileSync(
      process.execPath,
      [cliPath, 'http://localhost:3000', '--app', 'chrome', '--args=--remote-debugging-port=9222', '--dry-run', '--json'],
      { encoding: 'utf8' },
    );
    const parsed = JSON.parse(output.trim());
    assert.strictEqual(parsed.status, 'dry_run');
    assert.strictEqual(typeof parsed.command, 'string');
    assert.ok(Array.isArray(parsed.args));
    assert.strictEqual(parsed.target, 'http://localhost:3000');
    assert.ok(parsed.args.includes('--remote-debugging-port=9222'));
    assert.strictEqual(parsed.platform, process.platform);
  });

  it('validates target URL and exits 0 with --validate', () => {
    const output = execFileSync(
      process.execPath,
      [cliPath, 'https://example.com', '--validate'],
      { encoding: 'utf8' },
    );
    assert.match(output, /\[out-url\] Valid target: https:\/\/example\.com/);
  });

  it('validates target URL and outputs JSON with --validate --json', () => {
    const output = execFileSync(
      process.execPath,
      [cliPath, 'https://example.com', '--validate', '--json'],
      { encoding: 'utf8' },
    );
    const parsed = JSON.parse(output.trim());
    assert.strictEqual(parsed.status, 'valid');
    assert.strictEqual(parsed.valid, true);
    assert.strictEqual(parsed.protocol, 'https:');
  });

  it('rejects dangerous target URL and exits 1 with --validate', () => {
    assert.throws(
      () => execFileSync(
        process.execPath,
        [cliPath, 'javascript:alert(1)', '--validate'],
        { encoding: 'utf8', stdio: 'pipe' },
      ),
      (err) => {
        assert.strictEqual(err.status, 1);
        assert.match(err.stderr.toString(), /Dangerous or unsupported protocol: javascript:/);
        return true;
      },
    );
  });

  it('rejects dangerous target URL and outputs JSON error with --validate --json', () => {
    assert.throws(
      () => execFileSync(
        process.execPath,
        [cliPath, 'javascript:alert(1)', '--validate', '--json'],
        { encoding: 'utf8', stdio: 'pipe' },
      ),
      (err) => {
        assert.strictEqual(err.status, 1);
        const parsed = JSON.parse(err.stdout.toString().trim());
        assert.strictEqual(parsed.status, 'invalid');
        assert.strictEqual(parsed.valid, false);
        assert.match(parsed.error, /Dangerous or unsupported protocol/);
        return true;
      },
    );
  });
});
