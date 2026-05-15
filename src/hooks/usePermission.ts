'use client';

import { useAppSelector } from '@store/hooks';
import { selectUserRole } from '@store/selectors';
import { hasPermission, type Permission } from '@/types/auth';

/**
 * Returns whether the current user has the given permission.
 *
 * Usage:
 *   const canPublish = usePermission('page:publish');
 *
 * Returns false when no user is authenticated.
 */
export function usePermission(permission: Permission): boolean {
  const role = useAppSelector(selectUserRole);
  if (!role) return false;
  return hasPermission(role, permission);
}
