const { BROWSER_ALIASES } = require('./constants');
const { isWsl } = require('./platform');

const getIncognitoFlag = (browser) => {
  const lower = (browser || '').toLowerCase();
  if (lower.includes('firefox')) return '--private-window';
  if (lower.includes('edge') || lower.includes('msedge')) return '--inprivate';
  return '--incognito';
};

const normalizeBrowserArgs = (browserArgs) => {
  if (Array.isArray(browserArgs)) return browserArgs;
  if (typeof browserArgs === 'string' && browserArgs.trim()) {
    return browserArgs.trim().split(/\s+/);
  }
  return [];
};

const getCommands = (options = {}) => {
  const { platform } = process;
  const platformAliases = BROWSER_ALIASES[platform];
  const app = options.app
    ? ((platformAliases && platformAliases[options.app.toLowerCase()]) || options.app)
    : null;
  const incognito = Boolean(options.incognito);
  const extraBrowserArgs = normalizeBrowserArgs(options.browserArgs);

  if (platform === 'darwin') {
    const args = [];
    if (options.wait) args.push('-W');
    const targetApp = app || (incognito || extraBrowserArgs.length > 0 ? 'Google Chrome' : null);
    if (targetApp) {
      args.push('-a', targetApp);
      const flags = [];
      if (incognito) flags.push(getIncognitoFlag(targetApp));
      if (extraBrowserArgs.length > 0) flags.push(...extraBrowserArgs);
      if (flags.length > 0) {
        args.push('-n', '--args', ...flags);
      }
    }
    return ['open', args];
  }

  if (platform === 'win32' || isWsl()) {
    const startArgs = ['/c', 'start', '""'];
    if (options.wait) {
      startArgs.push('/wait');
    }
    const winApp = app || (incognito || extraBrowserArgs.length > 0 ? 'chrome' : null);
    if (winApp) {
      startArgs.push(winApp);
      if (incognito) {
        startArgs.push(getIncognitoFlag(winApp));
      }
      if (extraBrowserArgs.length > 0) {
        startArgs.push(...extraBrowserArgs);
      }
    }
    return ['cmd.exe', startArgs];
  }

  if (platform === 'android' && process.env.TERMUX_VERSION) {
    return ['termux-open-url', []];
  }

  if (platform === 'android' || platform === 'linux') {
    const linuxApp = app || (incognito || extraBrowserArgs.length > 0 ? 'google-chrome' : null);
    if (linuxApp) {
      const args = [];
      if (incognito) args.push(getIncognitoFlag(linuxApp));
      if (extraBrowserArgs.length > 0) args.push(...extraBrowserArgs);
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

module.exports = {
  getIncognitoFlag,
  normalizeBrowserArgs,
  getCommands,
  formatUrl,
};
