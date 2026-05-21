import {
    Injectable, CanActivate, SetMetadata,
    ExecutionContext, ForbiddenException,
} from '@nestjs/common';

import { Reflector } from '@nestjs/core';

export const Public = () => SetMetadata('isPublic', true);
const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
import { IS_PUBLIC_KEY } from '../decorators/public.decorators';
// Import UserRole type or enum from its definition file
import { UserRole } from '../../users/user.entity'; // Adjust the path as needed


@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isPublic) {
      return true;
    }

    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    return requiredRoles.includes(user.role);
  }
}
