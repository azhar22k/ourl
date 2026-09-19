const { spawn, execFileSync } = require('child_process');
const os = require('os');
const { existsSync } = require('fs');
const { resolve: pathResolve } = require('path');
const { pathToFileURL } = require('url');

const isWsl = () => {
  if (process.platform !== 'linux') return false;
  if (process.env.WSL_DISTRO_NAME || process.env.WSL_INTEROP) return true;
  return os.release().toLowerCase().includes('microsoft');
};

const resolveTarget = (target) => {
  if (typeof target === 'string' && existsSync(target)) {
    return pathToFileURL(pathResolve(target)).href;
  }
  return target;
};

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

const isHeadless = () => {
  if (process.platform !== 'linux') return false;
  if (isWsl()) return false;
  return !process.env.DISPLAY && !process.env.WAYLAND_DISPLAY;
};

const BROWSER_ALIASES = {
  darwin: {
    chrome: 'Google Chrome',
    firefox: 'Firefox',
    edge: 'Microsoft Edge',
    safari: 'Safari',
    brave: 'Brave Browser',
  },
  win32: {
    chrome: 'chrome',
    firefox: 'firefox',
    edge: 'msedge',
    brave: 'brave',
  },
  linux: {
    chrome: 'google-chrome',
    firefox: 'firefox',
    edge: 'microsoft-edge',
    brave: 'brave-browser',
  },
};

const getIncognitoFlag = (browser) => {
  const lower = (browser || '').toLowerCase();
  if (lower.includes('firefox')) return '--private-window';
  if (lower.includes('edge') || lower.includes('msedge')) return '--inprivate';
  return '--incognito';
};

const getCommands = (options = {}) => {
  const { platform } = process;
  const platformAliases = BROWSER_ALIASES[platform];
  const app = options.app
    ? ((platformAliases && platformAliases[options.app.toLowerCase()]) || options.app)
    : null;
  const incognito = Boolean(options.incognito);

  if (platform === 'darwin') {
    const args = [];
    if (options.wait) args.push('-W');
    if (app) {
      args.push('-a', app);
      if (incognito) {
        args.push('-n', '--args', getIncognitoFlag(app));
      }
    } else if (incognito) {
      args.push('-a', 'Google Chrome', '-n', '--args', '--incognito');
    }
    return ['open', args];
  }

  if (platform === 'win32' || isWsl()) {
    const startArgs = ['/c', 'start', '""'];
    if (options.wait) {
      startArgs.push('/wait');
    }
    const winApp = app || (incognito ? 'chrome' : null);
    if (winApp) {
      startArgs.push(winApp);
      if (incognito) {
        startArgs.push(getIncognitoFlag(winApp));
      }
    }
    return ['cmd.exe', startArgs];
  }

  if (platform === 'android' && process.env.TERMUX_VERSION) {
    return ['termux-open-url', []];
  }

  if (platform === 'android' || platform === 'linux') {
    const linuxApp = app || (incognito ? 'google-chrome' : null);
    if (linuxApp) {
      const args = [];
      if (incognito) args.push(getIncognitoFlag(linuxApp));
      return [linuxApp, args];
    }
    return ['xdg-open', []];
  }

  throw new Error(`Platform ${platform} isn't supported.`);
};

const formatUrl = (url, command) => {
  const encoded = encodeURI(url);
  if (command === 'cmd.exe') {
    return encoded.replace(/&/g, '^&');
  }
  return encoded;
};

const open = (url, options = {}) => new Promise((resolve, reject) => {
  const target = resolveTarget(url);
  const [command, baseArgs = []] = getCommands(options);
  const formattedUrl = formatUrl(target, command);

  if (options.fallback && isHeadless()) {
    if (typeof options.fallback === 'function') {
      options.fallback(formattedUrl);
    } else {
      // eslint-disable-next-line no-console
      console.log(`[out-url] Headless environment detected. Open link: ${formattedUrl}`);
    }
    resolve(null);
    return;
  }
  const args = [...baseArgs, formattedUrl];

  const child = spawn(command, args, {
    detached: !options.wait,
    stdio: 'ignore',
    windowsHide: true,
  });

  child.on('error', reject);

  if (options.wait) {
    child.on('close', (code) => {
      if (code === 0) {
        resolve(child);
      } else {
        reject(new Error(`Process exited with code ${code}`));
      }
    });
  } else {
    child.unref();
    child.on('spawn', () => resolve(child));
  }
});

open.open = open;
open.getCommands = getCommands;
open.isWsl = isWsl;
open.isHeadless = isHeadless;
open.formatUrl = formatUrl;
open.resolveTarget = resolveTarget;
open.parseGitRemoteUrl = parseGitRemoteUrl;
open.getGitRepoUrl = getGitRepoUrl;

module.exports = open;
