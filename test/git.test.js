const { describe, it } = require('node:test');
const assert = require('node:assert');
const open = require('../index');

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
