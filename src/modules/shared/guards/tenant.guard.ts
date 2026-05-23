import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorators';
import { SKIP_TENANT_KEY } from '../decorators/skip-tenant.decorator';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // allow public routes
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    );

    const isSkipped = this.reflector.getAllAndOverride<boolean>(
      SKIP_TENANT_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isPublic || isSkipped) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    // 🧠 CRITICAL: identity MUST already exist from ApiKeyGuard
    const tenant = request.tenant;
    const plan = request.plan;

    if (!tenant) {
      throw new ForbiddenException(
        'Tenant context missing. ApiKeyGuard must run before TenantGuard.',
      );
    }

    if (tenant.status !== 'active') {
      throw new ForbiddenException('Tenant account is inactive or suspended');
    }

    // yet to be implemented, but we can also check if the tenant's plan is still valid (e.g. not expired) here as well
    if (!plan) {
      throw new ForbiddenException('Tenant plan not found');
    }

    return true;
  }
}