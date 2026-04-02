export class BackendTimeoutError extends Error {
  constructor(
    public readonly url: string,
    public readonly timeoutMs: number,
  ) {
    super(`Backend request to ${url} timed out after ${timeoutMs}ms`);
    this.name = 'BackendTimeoutError';
  }
}
