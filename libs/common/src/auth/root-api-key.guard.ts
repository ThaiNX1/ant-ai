import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

/**
 * RootApiKeyGuard — protects internal/admin endpoints.
 *
 * The root key is declared in environment variables and only distributed
 * to services within the core ecosystem (inter-service communication,
 * admin operations, api-gateway management endpoints).
 *
 * Configure via env:
 *   ROOT_API_KEY=your-strong-secret-key
 *
 * Usage:
 *   @UseGuards(RootApiKeyGuard)
 *   @Controller('api-keys')
 *   export class ApiKeyController { ... }
 */
@Injectable()
export class RootApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const rootKey = process.env['ROOT_API_KEY'];

    if (!rootKey) {
      throw new UnauthorizedException('Root API key not configured');
    }

    const request = context.switchToHttp().getRequest<Record<string, unknown>>();
    const provided = this.extractKey(request);

    if (!provided || provided !== rootKey) {
      throw new UnauthorizedException('Invalid root API key');
    }

    return true;
  }

  private extractKey(request: Record<string, unknown>): string | undefined {
    const headers = request['headers'] as Record<string, string> | undefined;
    const query = request['query'] as Record<string, string> | undefined;

    // Authorization: Bearer <key>
    const auth = headers?.['authorization'];
    if (auth?.startsWith('Bearer ')) return auth.slice(7).trim();

    // x-root-api-key: <key>  (preferred for internal calls — distinct from user keys)
    const rootHeader = headers?.['x-root-api-key'];
    if (rootHeader) return rootHeader.trim();

    // x-api-key: <key>
    const xApiKey = headers?.['x-api-key'];
    if (xApiKey) return xApiKey.trim();

    return query?.['api_key'];
  }
}
