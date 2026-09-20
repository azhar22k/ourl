/* eslint-disable no-script-url */
const { describe, it } = require('node:test');
const assert = require('node:assert');
const { PassThrough } = require('stream');
const open = require('../index');
const pkg = require('../package.json');
const { sleep } = require('./helpers');

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
