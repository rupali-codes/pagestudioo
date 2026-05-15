'use client';

/**
 * SectionEditorPanel — routes to the correct typed editor for the selected section.
 *
 * This is the registry pattern applied to editors: a plain object maps
 * SectionType → editor component. No switch statements.
 *
 * Adding a new editor:
 *   1. Create `<Type>Editor.tsx` in this folder
 *   2. Add it to `editorRegistry` below
 *   TypeScript will not enforce completeness here (editors are optional —
 *   GenericEditor is the fallback), but the pattern is consistent.
 */

import type { SectionType } from '@/types/page';
import type { ComponentType } from 'react';
import { HeroEditor } from './HeroEditor';
import { CtaEditor } from './CtaEditor';
import { GenericEditor } from './GenericEditor';

interface EditorProps {
  sectionId: string;
}

// Partial registry — types without a dedicated editor fall back to GenericEditor
const editorRegistry: Partial<Record<SectionType, ComponentType<EditorProps>>> =
  {
    hero: HeroEditor,
    cta: CtaEditor,
  };

interface SectionEditorPanelProps {
  sectionId: string;
  sectionType: SectionType;
}

export function SectionEditorPanel({
  sectionId,
  sectionType,
}: SectionEditorPanelProps) {
  const Editor = editorRegistry[sectionType] ?? GenericEditor;
  // key=sectionId forces a remount on section switch so local editor state
  // always reflects the newly selected section without a sync effect.
  return <Editor key={sectionId} sectionId={sectionId} />;
}
