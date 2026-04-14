import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';

export interface ApiKeyPayload {
  id: string;
  userId: string;
  services: string[];
  scopes: string[];
  isActive: boolean;
  expiresAt: string | null;
}

/**
 * Interface that api-gateway's ApiKeyService must implement.
 * Each service injects a validator that calls api-gateway internally.
 */
export interface IApiKeyValidator {
  validate(rawKey: string): Promise<ApiKeyPayload | null>;
}

export const API_KEY_VALIDATOR = 'API_KEY_VALIDATOR';

/**
 * DbApiKeyGuard — validates API key via IApiKeyValidator.
 * Attaches decoded payload to request as `request.apiKey`.
 *
 * @param serviceName — name of the current service for scope check
 *                      e.g. 'ai-service', 'customer-service'
 */
@Injectable()
export class DbApiKeyGuard implements CanActivate {
  constructor(
    private readonly validator: IApiKeyValidator,
    private readonly serviceName: string,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Record<string, unknown>>();
    const rawKey = this.extractKey(request);

    if (!rawKey) throw new UnauthorizedException('Missing API key');

    const payload = await this.validator.validate(rawKey);
    if (!payload) throw new UnauthorizedException('Invalid or expired API key');

    if (!payload.services.includes(this.serviceName) && !payload.services.includes('*')) {
      throw new ForbiddenException(`Key not authorized for service: ${this.serviceName}`);
    }

    // Attach to request for downstream use
    request['apiKey'] = payload;
    return true;
  }

  private extractKey(request: Record<string, unknown>): string | undefined {
    const headers = request['headers'] as Record<string, string> | undefined;
    const query = request['query'] as Record<string, string> | undefined;

    const auth = headers?.['authorization'];
    if (auth?.startsWith('Bearer ')) return auth.slice(7).trim();

    const xApiKey = headers?.['x-api-key'];
    if (xApiKey) return xApiKey.trim();

    return query?.['api_key'];
  }
}
