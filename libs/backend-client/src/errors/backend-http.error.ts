export class BackendHttpError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly responseBody: unknown,
    message?: string,
  ) {
    super(
      message ??
        `Backend HTTP error ${statusCode}: ${typeof responseBody === 'string' ? responseBody : JSON.stringify(responseBody)}`,
    );
    this.name = 'BackendHttpError';
  }
}
