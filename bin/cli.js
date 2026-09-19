#!/usr/bin/env node

const { open } = require('../index');
const pkg = require('../package.json');

const args = process.argv.slice(2);

const showHelp = () => {
  // eslint-disable-next-line no-console
  console.log(`
  ${pkg.name} v${pkg.version}
  ${pkg.description}

  Usage:
    $ out-url <url> [options]
    $ ourl <url> [options]
    $ <command> | out-url

  Options:
    --wait         Wait for the opened process to terminate
    -v, --version  Display version
    -h, --help     Display this help message

  Examples:
    $ out-url https://github.com
    $ ourl https://github.com --wait
    $ echo "https://github.com" | out-url
`);
};

const readStdin = () => new Promise((resolve) => {
  if (process.stdin.isTTY) {
    resolve('');
    return;
  }
  let data = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => {
    data += chunk;
  });
  process.stdin.on('end', () => {
    resolve(data.trim());
  });
  process.stdin.on('error', () => {
    resolve('');
  });
});

const run = async () => {
  if (args.includes('-h') || args.includes('--help')) {
    showHelp();
    process.exit(0);
  }

  if (args.includes('-v') || args.includes('--version')) {
    // eslint-disable-next-line no-console
    console.log(pkg.version);
    process.exit(0);
  }

  const wait = args.includes('--wait');
  let url = args.find((arg) => !arg.startsWith('-'));

  if (!url) {
    url = await readStdin();
  }

  if (!url) {
    showHelp();
    process.exit(1);
  }

  try {
    await open(url, { wait });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  }
};

run();
