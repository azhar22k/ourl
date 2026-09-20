const { execFileSync } = require('child_process');

const parseGitRemoteUrl = (remoteUrl) => {
  if (!remoteUrl || typeof remoteUrl !== 'string') return null;
  const trimmed = remoteUrl.trim();
  const sshMatch = trimmed.match(/^(?:ssh:\/\/)?git@([^:/]+)[:/](.+?)(?:\.git)?$/);
  if (sshMatch) {
    return `https://${sshMatch[1]}/${sshMatch[2]}`;
  }
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed.replace(/\.git$/, '');
  }
  return null;
};

const getGitRepoUrl = (remote = 'origin') => {
  try {
    const raw = execFileSync('git', ['remote', 'get-url', remote], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return parseGitRemoteUrl(raw);
  } catch (err) {
    return null;
  }
};

module.exports = {
  parseGitRemoteUrl,
  getGitRepoUrl,
};
