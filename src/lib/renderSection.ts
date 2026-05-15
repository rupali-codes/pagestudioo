import type { Section } from '@/types/page';
import type { RenderResult } from '@/types/registry';
import { getRegistryEntry } from '@/registry/sectionRegistry';
import { validate, zodIssues } from './validate';

/**
 * renderSection — pure utility that decides *how* a section should be rendered.
 *
 * It does NOT return JSX. It returns a discriminated `RenderResult` that the
 * React component layer (`SectionRenderer`) acts on. This separation means:
 *   - The rendering decision is testable without React or a DOM.
 *   - `SectionRenderer` stays a thin view layer with no logic.
 *   - The registry lookup and schema validation happen in one place.
 *
 * Decision tree:
 *   1. Is the type registered?  → No  → `{ status: 'unregistered' }`
 *   2. Do the props pass schema? → No  → `{ status: 'invalid-props', issues }`
 *   3. Everything OK            →      → `{ status: 'ok' }`
 */
export function renderSection(section: Section): RenderResult {
  const entry = getRegistryEntry(section.type);

  // Unknown type — no registry entry
  if (!entry) {
    return { status: 'unregistered', type: section.type };
  }

  // Validate props against the schema bound to this registry entry.
  // Validation here is intentionally redundant with the per-component
  // validation — it acts as a pre-flight check so the component receives
  // only valid data, and the renderer (not the component) owns the error UI.
  const result = validate(entry.schema, section.props);
  if (!result.ok) {
    return { status: 'invalid-props', issues: zodIssues(result.error) };
  }

  return { status: 'ok' };
}
