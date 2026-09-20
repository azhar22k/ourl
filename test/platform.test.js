const { describe, it, afterEach } = require('node:test');
const assert = require('node:assert');
const open = require('../index');
const { setPlatform, restore } = require('./helpers');

describe('platform and command resolution', () => {
  afterEach(() => {
    restore();
  });

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
