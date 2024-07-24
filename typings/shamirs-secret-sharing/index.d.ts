declare module 'shamirs-secret-sharing' {
  export interface SplitOptions {
    shares: number;
    threshold: number;
  }

  export function split(secret: Buffer, opts: SplitOptions): Buffer[];
  export function combine(shares: Buffer[]): Buffer;
}
