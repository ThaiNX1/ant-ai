import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class SsrcAuthGuard implements CanActivate {
  private readonly whitelist: Set<string>;

  constructor(ssrcWhitelist: string[]) {
    this.whitelist = new Set(ssrcWhitelist);
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const ssrc =
      request.headers?.['x-ssrc'] ??
      request.query?.ssrc ??
      request.body?.ssrc;

    if (!ssrc || typeof ssrc !== 'string') {
      return false;
    }

    return this.whitelist.has(ssrc);
  }
}
