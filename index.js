const { execSync } = require('child_process');

const commands = (url) => {
  const { platform } = process;
  switch (platform) {
    case 'android':
    case 'linux':
      return `xdg-open ${url}`;
    case 'darwin':
      return `open ${url}`;
    case 'win32':
      return `cmd /c start ${url}`;
    default:
      throw new Error(`Platform ${platform} isn't supported.`);
  }
};

const open = url => new Promise((resolve, reject) => {
  try {
    execSync(
      commands(
        encodeURI(url),
      ),
    );
    return resolve();
  } catch (error) {
    return reject(error);
  }
});

module.exports = { open };
