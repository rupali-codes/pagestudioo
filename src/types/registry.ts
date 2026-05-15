import type { ComponentType } from 'react';
import type { ZodType } from 'zod';
import type { SectionType } from './page';

// ─── Per-component props ──────────────────────────────────────────────────────

/**
 * Every section component receives these props.
 *
 * `props` is kept as `Record<string, unknown>` at the registry boundary so
 * the renderer stays generic. Each component is responsible for validating
 * its own props against its schema — that validation is what produces the
 * typed value the component actually uses.
 */
export interface SectionComponentProps {
  id: string;
  props: Record<string, unknown>;
  isPreview?: boolean;
}

// ─── Registry entry ───────────────────────────────────────────────────────────

/**
 * A registry entry binds three things together for a single section type:
 *  - `component`  the React component that renders it
 *  - `schema`     the Zod schema that validates its props
 *  - `displayName` human-readable label used in the Studio UI
 *
 * Keeping the schema here (rather than only inside the component) lets the
 * renderer validate props *before* mounting the component, and lets the
 * Studio enumerate all known types with their metadata without importing
 * every component.
 */
export interface RegistryEntry {
  component: ComponentType<SectionComponentProps>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: ZodType<any>;
  displayName: string;
}

// ─── Registry map ─────────────────────────────────────────────────────────────

/**
 * The full registry is a Record keyed by SectionType.
 *
 * `Record<SectionType, RegistryEntry>` means TypeScript will error at compile
 * time if a new SectionType is added to the union but not registered here.
 * No switch statements needed anywhere — the registry IS the dispatch table.
 */
export type SectionRegistry = Record<SectionType, RegistryEntry>;

// ─── Render result ────────────────────────────────────────────────────────────

/**
 * Discriminated union returned by the renderer utility.
 * Callers can pattern-match on `status` to decide what to render.
 */
export type RenderResult =
  | { status: 'ok' }
  | { status: 'invalid-props'; issues: string[] }
  | { status: 'unregistered'; type: string };
