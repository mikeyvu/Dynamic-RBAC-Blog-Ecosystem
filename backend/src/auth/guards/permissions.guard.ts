import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { Request } from 'express';

interface AuthenticatedUser {
  userId: number;
  email: string;
  role: string;
  permissions: string[];
}

interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

@Injectable()
export class PermissionGuard implements CanActivate {
  //Reflector used to read tags from Metadata
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Read permissions from Decorator
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If API does not have the @RequirePermission tag, auto pass
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    // 2. Get user information from request(added by JwtAuthGuard before)
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user || !user.permissions) {
      throw new ForbiddenException('Access denied. No user permissions found!');
    }

    // 3. Check to see if User have Admin role or have enough permissions or not
    const hasAdminRole = user.role === 'Admin';
    if (hasAdminRole) return true;

    // Check if the permissions user has satisfy one of the requirements or not
    const hasRequiredPermission = requiredPermissions.some((permission) =>
      user.permissions.includes(permission),
    );

    if (!hasRequiredPermission) {
      throw new ForbiddenException(
        `You are missing some required permissions: ${requiredPermissions.join(', ')}`,
      );
    }

    return true;
  }
}
