import type { ChildProcess } from 'child_process';

export interface OpenOptions {
  /**
   * Wait for the browser/app process to terminate.
   * @default false
   */
  wait?: boolean;

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
}

declare namespace open {
  export function parseGitRemoteUrl(remoteUrl: string): string | null;
  export function getGitRepoUrl(remote?: string): string | null;
}

export { open };
export default open;
