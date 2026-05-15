import type { Section } from '@/types/page';
import { getRegistryEntry } from '@/registry/sectionRegistry';
import { renderSection } from '@/lib/renderSection';
import { SectionErrorBoundary } from './SectionErrorBoundary';
import { SectionError } from '@/components/ui/SectionError';
import { UnsupportedSection } from '@/components/sections/UnsupportedSection';

interface SectionRendererProps {
  section: Section;
  isPreview?: boolean;
}

/**
 * SectionRenderer — the single entry point for rendering any section.
 *
 * Responsibilities:
 *   1. Call `renderSection()` to get a typed decision (ok / invalid / unknown)
 *   2. Route to the correct fallback UI for non-ok results
 *   3. Wrap the component in a `SectionErrorBoundary` so a thrown error
 *      during render does not propagate to the page level
 *
 * What this component does NOT do:
 *   - No switch statements — dispatch is handled by the registry map
 *   - No inline validation logic — that lives in `renderSection()`
 *   - No business logic — it is a pure view router
 *
 * Server Component: this file has no 'use client' directive. It can run on
 * the server. `SectionErrorBoundary` is a Client Component (class component),
 * but Next.js handles the boundary correctly when a Server Component renders
 * a Client Component as a child.
 */
export function SectionRenderer({ section, isPreview }: SectionRendererProps) {
  const decision = renderSection(section);

  // ── Unregistered type ────────────────────────────────────────────────────
  if (decision.status === 'unregistered') {
    return (
      <UnsupportedSection
        id={section.id}
        // Inject the unknown type as a prop hint so UnsupportedSection can
        // display it without needing a separate prop — keeps the interface
        // consistent with SectionComponentProps.
        props={{ ...section.props, _type: decision.type }}
        isPreview={isPreview}
      />
    );
  }

  // ── Invalid props ────────────────────────────────────────────────────────
  if (decision.status === 'invalid-props') {
    return (
      <SectionError
        sectionId={section.id}
        sectionType={section.type}
        issues={decision.issues}
        isPreview={isPreview}
      />
    );
  }

  // ── Registered + valid — look up and render the component ────────────────
  // `getRegistryEntry` is called again here (after the pre-flight in
  // `renderSection`). The double lookup is intentional: `renderSection` is a
  // pure utility that returns a plain object, not a component reference.
  // Keeping component references out of `RenderResult` means that utility
  // stays framework-agnostic and testable without React.
  const entry = getRegistryEntry(section.type);

  // This branch is unreachable if `renderSection` returned 'ok', but the
  // type system doesn't know that — guard defensively.
  if (!entry) return null;

  const { component: Component } = entry;

  return (
    // Each section gets its own error boundary so a thrown error during
    // render is isolated to that section and does not unmount siblings.
    <SectionErrorBoundary
      sectionId={section.id}
      sectionType={section.type}
      isPreview={isPreview}
    >
      <Component id={section.id} props={section.props} isPreview={isPreview} />
    </SectionErrorBoundary>
  );
}
