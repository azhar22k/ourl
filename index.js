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

const open = async (url) => {
  const [command, args = []] = commands();

  // encode url and replace & with ^& for windows
  url = encodeURI(url);
  if (process.platform === 'win32') {
    url = url.replaceAll('&', '^&');
  }

  execFileSync(
    command,
    [...args, url],
  );
};

module.exports = { open };
