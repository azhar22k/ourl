const { describe, it, afterEach } = require('node:test');
const assert = require('node:assert');
const { execFileSync } = require('child_process');
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

    it('resolves win32 cmd.exe with app and incognito options', () => {
      setPlatform('win32');
      const [cmd, args] = open.getCommands({ app: 'firefox' });
      assert.strictEqual(cmd, 'cmd.exe');
      assert.deepStrictEqual(args, ['/c', 'start', '""', 'firefox']);

      const [cmd2, args2] = open.getCommands({ incognito: true });
      assert.strictEqual(cmd2, 'cmd.exe');
      assert.deepStrictEqual(args2, ['/c', 'start', '""', 'chrome', '--incognito']);
    });

    it('resolves linux with app and incognito options', () => {
      setPlatform('linux');
      delete process.env.WSL_DISTRO_NAME;
      delete process.env.WSL_INTEROP;
      const [cmd, args] = open.getCommands({ app: 'firefox', incognito: true });
      assert.strictEqual(cmd, 'firefox');
      assert.deepStrictEqual(args, ['--private-window']);
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
    assert.match(output, /--fallback/);
    assert.match(output, /--json/);
    assert.match(output, /<command> \| out-url/);
  });

  it('prints version as JSON with -v and --json flags', () => {
    const output = execFileSync(process.execPath, [cliPath, '-v', '--json'], { encoding: 'utf8' });
    const parsed = JSON.parse(output.trim());
    assert.strictEqual(parsed.version, pkg.version);
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
});
