import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';


@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const user = req.user;

    const tenantIdFromRequest =
      req.params.tenantId || req.body.tenantId;

    if (!tenantIdFromRequest) {
      throw new ForbiddenException('Tenant context missing');
    }

    if (user.currentTenantId !== Number(tenantIdFromRequest)) {
      throw new ForbiddenException(
        'You are not operating in this tenant context',
      );
    }

    return true;
  }
}
