const { describe, it } = require('node:test');
const assert = require('node:assert');
const open = require('../index');

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
