/**
 * Role-based access control types.
 */

export type Role = 'viewer' | 'editor' | 'publisher' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

/** Maps roles to the permissions they grant */
export const ROLE_PERMISSIONS = {
  viewer: ['page:read'],
  editor: ['page:read', 'page:edit'],
  publisher: ['page:read', 'page:edit', 'page:publish'],
  admin: ['page:read', 'page:edit', 'page:publish', 'page:delete', 'user:manage'],
} as const satisfies Record<Role, readonly string[]>;

export type Permission = (typeof ROLE_PERMISSIONS)[Role][number];

export function hasPermission(role: Role, permission: Permission): boolean {
  return (ROLE_PERMISSIONS[role] as readonly string[]).includes(permission);
}
