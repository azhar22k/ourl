#!/usr/bin/env node

const { open } = require('../index');
const pkg = require('../package.json');

const args = process.argv.slice(2);
const json = args.includes('--json');

const outputJson = (data) => {
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(data));
};

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
    --app <browser> Open in specific browser (e.g. chrome, firefox, edge, safari)
    -i, --incognito Open in private/incognito browsing mode
    --repo          Open the current git repository's remote URL
    --wait          Wait for the opened process to terminate
    --fallback      Gracefully print URL in headless/CI environments without display
    --json          Output result as machine-readable JSON for agents/scripts
    -v, --version   Display version
    -h, --help      Display this help message

  Examples:
    $ out-url https://github.com
    $ out-url http://localhost:3000 --app firefox
    $ out-url http://localhost:3000 -i
    $ out-url http://localhost:3000 --json
    $ ourl --repo
    $ ourl https://github.com --wait
    $ ourl https://github.com --fallback
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
    if (json) {
      outputJson({ version: pkg.version });
    } else {
      // eslint-disable-next-line no-console
      console.log(pkg.version);
    }
    process.exit(0);
  }

  const wait = args.includes('--wait');
  const fallback = args.includes('--fallback');
  const incognito = args.includes('-i') || args.includes('--incognito');

  const appIndex = args.indexOf('--app');
  let app = null;
  if (appIndex !== -1 && args[appIndex + 1] && !args[appIndex + 1].startsWith('-')) {
    app = args[appIndex + 1];
  }

  let url = args.find((arg, idx) => !arg.startsWith('-') && (appIndex === -1 || idx !== appIndex + 1));

  if (args.includes('--repo')) {
    url = open.getGitRepoUrl();
    if (!url) {
      if (json) {
        outputJson({ status: 'error', message: 'Could not resolve git remote "origin".' });
      } else {
        // eslint-disable-next-line no-console
        console.error('Error: Could not resolve git remote "origin". Are you in a git repository with an origin remote?');
      }
      process.exit(1);
    }
  }

  if (!url) {
    url = await readStdin();
  }

  if (!url) {
    if (json) {
      outputJson({ status: 'error', message: 'No target or URL provided.' });
    } else {
      showHelp();
    }
    process.exit(1);
  }

  try {
    let isFallback = false;
    let fallbackHandler = fallback;
    if (json && fallback) {
      fallbackHandler = () => {
        isFallback = true;
      };
    } else if (fallback) {
      fallbackHandler = true;
    }

    const child = await open(url, {
      wait,
      app,
      incognito,
      fallback: fallbackHandler,
    });

    if (json) {
      if (isFallback || child === null) {
        outputJson({
          status: 'headless_fallback',
          target: url,
          resolvedTarget: open.resolveTarget(url),
          message: 'Headless environment detected. Display not available.',
        });
      } else {
        outputJson({
          status: 'success',
          target: url,
          resolvedTarget: open.resolveTarget(url),
          pid: child ? child.pid : null,
          platform: process.platform,
        });
      }
    }
  } catch (err) {
    if (json) {
      outputJson({ status: 'error', message: err.message });
    } else {
      // eslint-disable-next-line no-console
      console.error(err);
    }
    process.exit(1);
  }
};

run();
