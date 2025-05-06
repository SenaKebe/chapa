import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    console.log('RolesGuard -> requiredRoles:', requiredRoles);

    if (!requiredRoles) return true;
    if (!requiredRoles) {
      console.log('RolesGuard -> No roles required, allowing access.');
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    console.log('RolesGuard -> user:', user);

    if (!user || !requiredRoles.includes(user.userType)) {
      console.error(
        'RolesGuard -> Access denied. User does not have required roles.',
      );
      throw new ForbiddenException('You do not have permission (roles)');
    }

    return true;
  }
}
