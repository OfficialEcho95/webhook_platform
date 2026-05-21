// import {
//   Injectable,
//   CanActivate,
//   ExecutionContext,
//   ForbiddenException,
// } from '@nestjs/common';
// import { Reflector } from '@nestjs/core';
// import { IS_PUBLIC_KEY } from '../decorators/public.decorators';
// import { SKIP_TENANT_KEY } from '../decorators/skip-tenant.decorator';

// @Injectable()
// export class TenantGuard implements CanActivate {
//   constructor(private reflector: Reflector) {}

//   canActivate(context: ExecutionContext): boolean {

//     /** 1. Public routes don't require tenant */
//     const isPublic = this.reflector.getAllAndOverride<boolean>(
//       IS_PUBLIC_KEY,
//       [context.getHandler(), context.getClass()],
//     );


//     /** 2. Skip tenant check entirely */
//     const skipTenant = this.reflector.getAllAndOverride<boolean>(
//       SKIP_TENANT_KEY,
//       [context.getHandler(), context.getClass()],
//     );

//     if (skipTenant) {
//       return true;
//     }

//     if (isPublic  || skipTenant) {
//       return true;
//     }

//     const req = context.switchToHttp().getRequest();
//     const user = req.user;

//     if (!user) {
//       throw new ForbiddenException('Authentication required');
//     }

//     /** 3. Resolve tenant context */
//     const tenantId =
//       req.params?.tenantId ??
//       req.body?.tenantId ??
//       req.headers?.['x-tenant-id'];

//     if (!tenantId) {
//       throw new ForbiddenException('Tenant context missing');
//     }

//     /** 4. Enforce tenant isolation */
//     if (Number(user.currentTenantId) !== Number(tenantId)) {
//       throw new ForbiddenException(
//         'You are not operating in this tenant context',
//       );
//     }

//     /** 5. Attach tenant to request for downstream use */
//     req.tenantId = Number(tenantId);

//     return true;
//   }
// }




import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorators';
import { SKIP_TENANT_KEY } from '../decorators/skip-tenant.decorator';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. CHECK FOR BYPASS METADATA FIRST
    // This looks for either @Public() or @SkipTenant() decorators
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const isSkipped = this.reflector.getAllAndOverride<boolean>(SKIP_TENANT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If either decorator is present, exit early and allow the request
    if (isPublic || isSkipped) {
      return true;
    }

    // 2. LOGIC A: TENANT IDENTIFICATION (The "Who")
    const request = context.switchToHttp().getRequest();
    const tenantId = request.headers['x-tenant-id'] || request.query['tenantId'];

    if (!tenantId) {
      throw new UnauthorizedException('Tenant identification failed: X-Tenant-Id header missing');
    }

    // 3. LOGIC B: TENANT VALIDATION / STATUS (The "Is Active?")
    // Assuming you attach the tenant to the request or check DB here
    const tenant = await this.fetchTenantSomehow(tenantId); 
    
    if (tenant.status !== 'active') {
      throw new ForbiddenException('Tenant account is suspended or inactive');
    }

    // Attach to request for use in controllers
    request.tenant = tenant;

    return true;
  }

  private async fetchTenantSomehow(id: string) {
    // Your actual DB logic here
    return { id, status: 'active' }; 
  }
}