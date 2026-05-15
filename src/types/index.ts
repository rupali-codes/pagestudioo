/**
 * Types barrel export.
 *
 * Only domain types live here. Framework types (Next.js PageProps, etc.)
 * stay local to the files that use them.
 */
export type { Page, Section, SectionType, PageRelease } from './page';
export type { User, Role, Permission } from './auth';
export { hasPermission, ROLE_PERMISSIONS } from './auth';
export type { SectionComponentProps, SectionRegistry } from './registry';
export type { CmsFetchOptions, CmsEntryMeta } from './cms';
