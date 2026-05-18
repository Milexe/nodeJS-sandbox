import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
  } from '@nestjs/common';
  import { Reflector } from '@nestjs/core';
  import { ROLES_KEY } from '../decorators/roles.decorator';
  
  @Injectable()
  export class RolesGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
      const reflector = new Reflector();
      const requiredRoles = reflector.getAllAndOverride<string[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
  
      if (!requiredRoles) {
        return true;
      }
  
      const { user } = context.switchToHttp().getRequest();
  
      if (!requiredRoles.includes(user.role)) {
        throw new ForbiddenException('Недостаточно прав');
      }
  
      return true;
    }
  }