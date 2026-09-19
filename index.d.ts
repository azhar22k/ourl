import type { ChildProcess } from 'child_process';

export interface OpenOptions {
  /**
   * Wait for the browser/app process to terminate.
   * @default false
   */
  wait?: boolean;
}

declare function open(url: string, options?: OpenOptions): Promise<ChildProcess>;

declare namespace open {
  export function parseGitRemoteUrl(remoteUrl: string): string | null;
  export function getGitRepoUrl(remote?: string): string | null;
}

export { open };
export default open;
