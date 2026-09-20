const os = require('os');

const isWsl = () => {
  if (process.platform !== 'linux') return false;
  if (process.env.WSL_DISTRO_NAME || process.env.WSL_INTEROP) return true;
  return os.release().toLowerCase().includes('microsoft');
};

const isHeadless = () => {
  if (process.platform !== 'linux') return false;
  if (isWsl()) return false;
  return !process.env.DISPLAY && !process.env.WAYLAND_DISPLAY;
};

module.exports = {
  isWsl,
  isHeadless,
};
