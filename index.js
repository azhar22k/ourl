const { spawn } = require('child_process');
const { isWsl, isHeadless } = require('./lib/platform');
const {
  getCommands,
  formatUrl,
  normalizeBrowserArgs,
} = require('./lib/browser');
const { parseGitRemoteUrl, getGitRepoUrl } = require('./lib/git');
const { resolveTarget, validateUrl } = require('./lib/validate');
const { toolDefinition, getToolDefinition } = require('./lib/tool-definition');
const { startMcpServer } = require('./lib/mcp');

const open = (url, options = {}) => new Promise((resolve, reject) => {
  if (options.validate) {
    const validateOpts = typeof options.validate === 'object' ? options.validate : {};
    const validation = validateUrl(url, validateOpts);
    if (!validation.valid) {
      reject(new Error(validation.error || `Invalid target URL: ${url}`));
      return;
    }
  }

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

  if (options.dryRun) {
    resolve({
      dryRun: true,
      command,
      args,
      target: url,
      resolvedTarget: target,
      formattedUrl,
      platform: process.platform,
    });
    return;
  }

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
open.normalizeBrowserArgs = normalizeBrowserArgs;
open.toolDefinition = toolDefinition;
open.getToolDefinition = getToolDefinition;
open.startMcpServer = (serverOptions) => startMcpServer(serverOptions, open);
open.validateUrl = validateUrl;

module.exports = open;
