import type { ChildProcess } from 'child_process';

export interface OpenOptions {
  /**
   * Wait for the browser/app process to terminate.
   * @default false
   */
  wait?: boolean;

  /**
   * Target a specific browser or application.
   * Built-in aliases: 'chrome', 'firefox', 'edge', 'safari', 'brave', or custom app name/path.
   */
  app?: string;

  /**
   * Open the target in private / incognito browsing mode.
   * @default false
   */
  incognito?: boolean;

  /**
   * Additional command-line flags or arguments to pass to the browser.
   * Useful for AI agents and automation scripts (e.g. `['--remote-debugging-port=9222']` or `'--remote-debugging-port=9222'`).
   */
  browserArgs?: string[] | string;

  /**
   * Gracefully handle headless/CI environments without a display server.
   * If true, logs the URL. Can also be a custom callback `(url: string) => void`.
   * @default false
   */
  fallback?: boolean | ((url: string) => void);
}

declare function open(url: string, options?: OpenOptions): Promise<ChildProcess | null>;

declare namespace open {
  export function isHeadless(): boolean;
  export function parseGitRemoteUrl(remoteUrl: string): string | null;
  export function getGitRepoUrl(remote?: string): string | null;
  export function resolveTarget(target: string): string;
  export function normalizeBrowserArgs(browserArgs?: string[] | string): string[];
}

export { open };
export default open;
