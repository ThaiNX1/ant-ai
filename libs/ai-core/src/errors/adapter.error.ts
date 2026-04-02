/**
 * Structured error class for AI adapter failures.
 * Contains error code, message, and provider name for traceability.
 */
export class AdapterError extends Error {
  public readonly code: string;
  public readonly provider: string;

  constructor(code: string, message: string, provider: string) {
    super(message);
    this.name = 'AdapterError';
    this.code = code;
    this.provider = provider;
  }
}
