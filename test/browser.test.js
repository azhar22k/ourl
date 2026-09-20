const { describe, it } = require('node:test');
const assert = require('node:assert');
const open = require('../index');

describe('browser and url formatting', () => {
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
});
