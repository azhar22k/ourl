import type { ChildProcess } from 'child_process';

export interface OpenOptions {
  /**
   * Wait for the browser/app process to terminate.
   * @default false
   */
  wait?: boolean;
}

declare function open(url: string, options?: OpenOptions): Promise<ChildProcess>;

export { open };
export default open;
