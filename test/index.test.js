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
    assert.match(output, /<command> \| out-url/);
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
