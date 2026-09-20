const DANGEROUS_PROTOCOLS = new Set([
  // eslint-disable-next-line no-script-url
  'javascript:',
  'vbscript:',
  'data:',
  'about:',
  'blob:',
]);

const DEFAULT_ALLOWED_PROTOCOLS = [
  'http:',
  'https:',
  'file:',
  'ftp:',
  'mailto:',
  'tel:',
];

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

module.exports = {
  DANGEROUS_PROTOCOLS,
  DEFAULT_ALLOWED_PROTOCOLS,
  BROWSER_ALIASES,
};
