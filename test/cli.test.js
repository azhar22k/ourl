/* eslint-disable no-script-url */
const { describe, it } = require('node:test');
const assert = require('node:assert');
const { execFileSync } = require('child_process');
const path = require('path');
const pkg = require('../package.json');

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
