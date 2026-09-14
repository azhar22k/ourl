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

  Options:
    --wait         Wait for the opened process to terminate
    -v, --version  Display version
    -h, --help     Display this help message

  Examples:
    $ out-url https://github.com
    $ ourl https://github.com --wait
`);
};

if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
  showHelp();
  process.exit(args.length === 0 ? 1 : 0);
}

if (args.includes('-v') || args.includes('--version')) {
  // eslint-disable-next-line no-console
  console.log(pkg.version);
  process.exit(0);
}

const wait = args.includes('--wait');
const url = args.find((arg) => !arg.startsWith('-'));

if (!url) {
  showHelp();
  process.exit(1);
}

open(url, { wait }).catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
