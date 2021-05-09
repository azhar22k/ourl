const { execFileSync } = require('child_process');

const commands = () => {
  const { platform } = process;
  switch (platform) {
    case 'android':
    case 'linux':
      return ['xdg-open'];
    case 'darwin':
      return ['open'];
    case 'win32':
      return ['cmd', ['/c', 'start']];
    default:
      throw new Error(`Platform ${platform} isn't supported.`);
  }
};

const open = url => new Promise((resolve, reject) => {
  try {
    const [command, args = []] = commands();
    execFileSync(
      command,
      [...args, encodeURI(url)],
    );
    return resolve();
  } catch (error) {
    return reject(error);
  }
});

module.exports = { open };
