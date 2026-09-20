const { describe, it } = require('node:test');
const assert = require('node:assert');
const open = require('../index');

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
      // eslint-disable-next-line no-script-url
      'javascript:alert(1)',
      // eslint-disable-next-line no-script-url
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
      // eslint-disable-next-line no-script-url
      open('javascript:alert(1)', { validate: true }),
      /Dangerous or unsupported protocol/,
    );
  });

  it('passes in open() when options.validate is true and URL is valid', () => {
    const validation = open.validateUrl('https://example.com', {});
    assert.strictEqual(validation.valid, true);
  });
});
