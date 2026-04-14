import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

/**
 * API Key Guard — validates Bearer token or x-api-key header.
 *
 * Usage (controller or route level):
 *   @UseGuards(new ApiKeyGuard(['key1', 'key2']))
 *
 * Accepts key from:
 *   - Header: Authorization: Bearer <key>
 *   - Header: x-api-key: <key>
 *   - Query:  ?api_key=<key>
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly validKeys: Set<string>;

  constructor(apiKeys: string[]) {
    this.validKeys = new Set(apiKeys.filter(Boolean));
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const key = this.extractKey(request);

    if (!key || !this.validKeys.has(key)) {
      throw new UnauthorizedException('Invalid or missing API key');
    }

    return true;
  }

  private extractKey(request: Record<string, unknown>): string | undefined {
    const headers = request['headers'] as Record<string, string> | undefined;
    const query = request['query'] as Record<string, string> | undefined;

    // Authorization: Bearer <key>
    const authHeader = headers?.['authorization'];
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.slice(7).trim();
    }

    // x-api-key: <key>
    const xApiKey = headers?.['x-api-key'];
    if (xApiKey) return xApiKey.trim();

    // ?api_key=<key>
    return query?.['api_key'];
  }
}
