import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

export const ADMIN_ROLES = ['admin', 'super_admin'] as const;

/** Restrict a controller or route to the given user roles (used with RolesGuard). */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
