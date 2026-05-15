/**
 * Role-based access control types.
 *
 * Roles form a hierarchy: each role includes all permissions of the roles
 * below it. The ROLE_PERMISSIONS map is the single source of truth —
 * both server-side guards and client-side UI checks derive from it.
 */

export type Role = 'viewer' | 'editor' | 'publisher';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

/**
 * Session shape stored in the auth cookie and returned by /api/auth/me.
 * Kept minimal — only what the server needs to make access decisions.
 */
export interface Session {
  userId: string;
  role: Role;
  name: string;
}

/** Maps roles to the permissions they grant */
export const ROLE_PERMISSIONS = {
  viewer:    ['page:read'],
  editor:    ['page:read', 'page:edit'],
  publisher: ['page:read', 'page:edit', 'page:publish'],
} as const satisfies Record<Role, readonly string[]>;

export type Permission = (typeof ROLE_PERMISSIONS)[Role][number];

/** Check whether a role grants a specific permission. */
export function hasPermission(role: Role, permission: Permission): boolean {
  return (ROLE_PERMISSIONS[role] as readonly string[]).includes(permission);
}

/** Check whether a role grants ALL of the listed permissions. */
export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

/**
 * Minimum role required for each protected area.
 * Used by middleware and server-side guards — single place to change policy.
 */
export const ROUTE_PERMISSIONS = {
  studio:  'page:read'    as Permission,
  publish: 'page:publish' as Permission,
  preview: 'page:read'    as Permission,
} as const;

/** All mock users available for role simulation in development. */
export const MOCK_USERS: Record<Role, User> = {
  viewer: {
    id: 'mock-viewer',
    name: 'Alice Viewer',
    email: 'viewer@example.com',
    role: 'viewer',
  },
  editor: {
    id: 'mock-editor',
    name: 'Bob Editor',
    email: 'editor@example.com',
    role: 'editor',
  },
  publisher: {
    id: 'mock-publisher',
    name: 'Carol Publisher',
    email: 'publisher@example.com',
    role: 'publisher',
  },
};
