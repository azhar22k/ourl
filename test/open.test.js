const { describe, it, afterEach } = require('node:test');
const assert = require('node:assert');
const open = require('../index');
const pkg = require('../package.json');
const { setPlatform, restore } = require('./helpers');

describe('out-url core and package', () => {
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

  it('defines comprehensive package keywords in package.json', () => {
    assert.ok(Array.isArray(pkg.keywords));
    assert.ok(pkg.keywords.length >= 30);
    assert.ok(pkg.keywords.includes('open-url'));
    assert.ok(pkg.keywords.includes('mcp'));
    assert.ok(pkg.keywords.includes('dry-run'));
    assert.ok(pkg.keywords.includes('validate-url'));
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
