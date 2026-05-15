# Page Studio

A production-grade, schema-driven landing page builder built with Next.js 16 (App Router), Contentful CMS, and Redux Toolkit. Features a visual studio editor, role-based access control, deterministic semver versioning, and an immutable release history.

---

## 1. Architecture Overview

```
src/
├── app/                          # Next.js App Router
│   ├── pages/[slug]/             # Public published pages (no auth)
│   ├── preview/[slug]/           # Preview with Draft Mode gate
│   ├── studio/                   # Studio editor index
│   ├── studio/[slug]/            # Per-page studio editor
│   ├── auth/                     # Login + unauthorized pages
│   └── api/
│       ├── auth/session/         # Session create/read/delete
│       ├── auth/me/              # Current user endpoint
│       ├── preview/              # Enable / disable Draft Mode
│       ├── publish/              # Create versioned releases
│       └── releases/[slug]/      # Release history endpoint
├── cms/                          # Contentful adapter layer
│   ├── contentfulClient.ts       # Client factory (delivery + preview)
│   ├── mappers.ts                # Raw CMS → domain types
│   └── pageRepository.ts         # Data access: fetch, list slugs
├── components/
│   ├── page/                     # PageRenderer, SectionRenderer
│   ├── sections/                 # Hero, FeatureGrid, Testimonial, CTA
│   ├── studio/                   # StudioToolbar, EditorSidebar, ReleaseHistory
│   │   └── editors/              # HeroEditor, CtaEditor, GenericEditor
│   ├── providers/                # ReduxProvider, SessionHydrator
│   └── ui/                       # Button, Badge, Input, FormField, etc.
├── features/                     # Vertical-slice feature modules
│   ├── page-viewer/              # Public page rendering
│   ├── page-editor/              # Studio editing (Redux driven)
│   └── releases/                 # Publish flow + release history
├── hooks/                        # Shared React hooks
│   ├── usePublishDraft.ts        # Draft-based publish flow
│   ├── usePermission.ts          # RBAC permission check
│   ├── useDebounce.ts            # Debounced value hook
│   ├── useMediaQuery.ts          # Responsive breakpoints
│   └── useReleaseHistory.ts      # Fetch release list
├── lib/                          # Pure utilities
│   ├── auth/                     # Session management, guards, edge session
│   ├── versioning/               # SemVer diff, changelog, snapshot, publish
│   │   └── __tests__/            # Unit tests (7 test files)
│   ├── semver.ts                 # Low-level semver primitives
│   ├── validate.ts               # Zod validate wrapper
│   ├── result.ts                 # Result<T, E> type
│   └── cn.ts                     # Tailwind class merging (clsx + twMerge)
├── registry/
│   └── sectionRegistry.ts        # Typed section → component + schema map
├── schemas/                      # Zod validation schemas
│   ├── section.ts                # SectionTypeSchema, SectionSchema
│   ├── page.ts                   # PageSchema, PageReleaseSchema
│   ├── props/                    # Per-section prop schemas (hero, cta, etc.)
│   └── __tests__/                # Schema validation unit tests
├── store/                        # Redux Toolkit
│   ├── slices/                   # draftPage, page, auth, release, publish, ui
│   ├── persistMiddleware.ts      # localStorage draft persistence
│   ├── hooks.ts                  # Typed useAppDispatch / useAppSelector
│   ├── selectors.ts              # All selectors
│   ├── store.ts                  # configureStore with middleware
│   └── index.ts                  # Barrel exports
├── types/                        # Domain TypeScript types
│   ├── page.ts                   # Page, Section, PageRelease, ChangelogEntry
│   ├── auth.ts                   # Role, Permission, User, Session
│   ├── registry.ts               # SectionRegistry types
│   └── cms.ts                    # Raw Contentful response types
├── constants/
│   └── index.ts                  # SECTION_TYPES and other constants
└── middleware.ts                  # Edge middleware — route protection
```

### Key architectural decisions

- **Schema-driven rendering**: Every section type is registered with a React component + Zod schema. The renderer validates props before mounting the component, keeping validation logic out of individual sections. Adding a new section type is a single entry in the registry.
- **Immutable releases**: Every publish creates an immutable `PageRelease` snapshot with a deterministic semver version. Releases are never mutated — the release history is an append-only log.
- **Draft separation**: The editor uses a dedicated `draftPageSlice` that is independent of the CMS snapshot in `pageSlice`. This allows instant discard (revert to original) and diff-based dirty detection without re-fetching from the CMS.
- **Defence in depth**: Route protection happens at three levels — edge middleware (fast cookie check), server component guards (cryptographic session verification), and API route guards. Viewers see a read-only studio with editing controls hidden.

---

## 2. Redux Slice Responsibilities

| Slice | State | Purpose |
|---|---|---|
| `draftPage` | `{ present, original, isDirty, isSaving, error }` | The editor's working copy. `present` is what the user sees in preview; `original` is the last-published baseline. Every mutation sets `isDirty = true`. `markClean()` resets it after save/publish. |
| `page` | `{ current, isDirty, isSaving, error }` | Legacy CMS snapshot slice (read-only reference, not used by the new editor flow). |
| `publish` | `{ isPublishing, lastPublishedRelease, error }` | Tracks the in-flight publish operation. `startPublish` → `publishSuccess` / `publishFailure`. |
| `release` | `{ releases, isPublishing, error }` | Cached release history. Populated on mount via `/api/releases/[slug]` and appended to after each publish. |
| `ui` | `{ selectedSectionId, activePanel, isAddSectionOpen, isDiscardDialogOpen, draftRestored }` | Transient editor UI state. No persistence. |
| `auth` | `{ user, isLoading }` | Current authenticated user. Hydrated on mount via `/api/auth/me`. |

### Middleware

`persistMiddleware.ts` writes `draftPage.present` to `localStorage` on every mutation action so drafts survive page reloads. It skips persistence during `loadDraft` to prevent the CMS baseline from overwriting the user's saved draft.

---

## 3. Contentful Model and Adapter

### Required content model

**Page** content type:

| Field | Type | Required |
|---|---|---|
| `title` | Short text | ✓ |
| `slug` | Short text (URL-safe) | ✓ |
| `sections` | References (many Section) | ✓ |

**Section** content type:

| Field | Type | Required |
|---|---|---|
| `sectionType` | Short text (enum: `hero`, `featureGrid`, `testimonial`, `cta`) | ✓ |
| `props` | JSON object | ✓ |

The `props` field stores typed configuration per section type. Each type has a corresponding Zod schema in `src/schemas/props/` that validates the JSON at render time.

### Adapter layer (`src/cms/`)

The CMS adapter abstracts Contentful behind a stable domain interface:

- **`contentfulClient.ts`** — Creates both Delivery (published) and Preview (draft) API clients from environment variables. Falls back to stubs when credentials are missing so the app works without a CMS configured (using the demo page).
- **`mappers.ts`** — Transforms raw Contentful API responses (with system fields, locale wrappers, and reference resolution) into the clean domain types defined in `src/types/page.ts`. This is the only file that knows about Contentful's response shape.
- **`pageRepository.ts`** — High-level data access: `fetchPageBySlug(slug, opts?)`, `fetchAllSlugs()`. Returns `Result<T, AppError>` for typed error handling.

This isolation means switching to a different CMS (or adding one) only requires replacing the adapter layer — the rest of the app never imports Contentful directly.

---

## 4. Publish Flow and SemVer Logic

### Publish pipeline (`POST /api/publish`)

```
draft → diff vs. latest release → semver calculation → changelog → snapshot → persist → return release
```

1. **Load previous state** — reads the latest snapshot for this slug from disk.
2. **Diff** — `diffPages(previous, draft)` produces a `PageDiff` with all structural changes (sections added/removed/reordered/type-changed, props changed, title changed).
3. **Idempotency check** — if content is identical (hash match), returns the existing release with `status: 'noop'`.
4. **Semver calculation** — `calculateNextVersion()` maps each diff change to a bump:
   | Change | Bump | Rationale |
   |---|---|---|
   | Section removed | **major** | Breaking — content disappears |
   | Section type changed | **major** | Breaking — different component renders |
   | Section added | **minor** | New feature — backward compatible |
   | Section props changed | **patch** | Content update |
   | Section reordered | **patch** | Layout change, same content |
   | Page title changed | **patch** | Meta update |
   | First publish | `0.1.0` | Initial release |
5. **Changelog generation** — `generateChangelog()` produces human-readable entries (e.g. "Added testimonial section", "Updated hero heading").
6. **Snapshot build** — `buildSnapshot()` creates an immutable `PageRelease` with a SHA-256 content hash for deterministic identity.
7. **Persistence** — the snapshot is written to disk at `releases/{pageId}/{version}.json`.
8. **Response** — returns the new release and a session cookie with the current version.

### Determinism guarantee

Given the same page content and same previous release, the pipeline always produces the same `version`, `contentHash`, and `changelog`. The only non-deterministic field is `publishedAt`, injected by the caller.

---

## 5. Accessibility Approach and Evidence

### Tooling

- **axe-core** via `@axe-core/playwright` — runs WCAG 2.1 AA rules against every page in CI.
- Tests are tagged `@a11y` and run via `npm run test:a11y`.
- CI fails on `critical` and `serious` violations. `moderate` and `minor` violations are reported but non-blocking.

### CI enforcement

The `a11y` job in GitHub Actions:
1. Builds the application.
2. Installs Playwright Chromium.
3. Runs `npm run test:a11y -- --project=chromium` against the home page and studio page.
4. Generates `a11y-report.json` with per-page violation summaries.
5. Uploads the report as a CI artifact (30-day retention).

### Manual evidence

To run locally:
```bash
npm run build && npm run test:a11y
cat a11y-report.json
```

### Current results

- **Home page**: passes all WCAG 2.1 AA checks (0 critical/serious violations).
- **Studio page**: passes all WCAG 2.1 AA checks (0 critical/serious violations).

### Accessibility patterns used

- Skip-to-content link as the first focusable element.
- ARIA labels on all interactive controls (`aria-label`, `aria-describedby`).
- Role attributes on dynamic regions (`role="alert"`, `role="status"`, `aria-live="polite"`).
- Focus management in modals and section editors.
- `aria-expanded`, `aria-current`, `aria-pressed` for state communication.
- Keyboard navigation via `tabIndex`, `onKeyDown` handlers, and `focus-visible` ring styles.

---

## 6. Testing and Quality Gates

### Unit tests (Vitest)

```
src/
├── lib/versioning/__tests__/    (7 files — diff, semver, changelog, snapshot, publish pipeline)
├── schemas/__tests__/           (1 file — schema validation for all Zod schemas)
```

**Run**: `npm test` (108 tests across 8 files)

### E2E tests (Playwright)

```
tests/e2e/
├── home.spec.ts          # Home page rendering, skip link, navigation
├── studio.spec.ts        # Toolbar, sidebar, preview, save draft
├── preview.spec.ts       # Preview page, mode banner, all sections
├── cta.spec.ts           # CTA link rendering and navigation
├── publish-api.spec.ts   # Publish endpoint, semver bumps, error cases
└── accessibility.spec.ts # axe-core WCAG 2.1 AA checks, report generation
```

**Run**: `npm run build && npm run test:e2e`

### CI pipeline (GitHub Actions)

| Job | Runs | Depends on |
|---|---|---|
| `lint-and-typecheck` | `tsc --noEmit`, `eslint`, `prettier --check` | — |
| `unit` | `vitest run` + coverage upload | — |
| `build` | `npm run build` | lint, unit |
| `e2e` | Playwright (Chromium) + report upload | build |
| `a11y` | axe-core checks + `a11y-report.json` upload | build |

---

## 7. What Is Incomplete and Why

| Area | Status | Rationale |
|---|---|---|
| **Drag-and-drop reorder** | Not implemented | Section reorder uses up/down buttons. A DnD library (e.g. dnd-kit) was omitted to keep the dependency footprint small. The `reorderSections` Redux action is already wired and ready for a DnD frontend. |
| **Undo/redo** | Not implemented | Undo/redo would require maintaining a stack of draft snapshots. This was cut to scope because the discard flow (reset to original) covers the critical recovery case. An undo stack could be added to `draftPageSlice` without changing the architecture. |
| **Rich text editor** | Not implemented | Contentful already provides a rich text field. Sections use plain text inputs for simplicity. A future editor could swap `Input` for a rich text component without changing the schema. |
| **Image upload** | Not implemented | Images are expected to come from Contentful's asset CDN. Direct upload would require an upload API endpoint and storage integration. |
| **Multi-language / i18n** | Not implemented | Contentful has built-in locale support. The domain types and schemas are locale-agnostic — adding i18n would mainly affect the CMS adapter and section rendering. |
| **Mobile responsive editor** | The preview panel is responsive; the editor sidebar is fixed-width | The 280px sidebar is optimized for desktop editing. A mobile-responsive layout would require a different sidebar breakpoint strategy. The preview always reflects the responsive page. |
| **Real Contentful credentials** | Demo mode by default | The app runs without Contentful credentials using a hardcoded demo page. Set the environment variables in `.env.local` to connect a real Contentful space. |
| **Production auth** | Mock role selector | The login page uses a mock role selector (`auth/login/LoginForm.tsx`). In production, this would be replaced with OAuth, SSO, or a credential-based flow. The session cookie infrastructure (signed HMAC-SHA256, HttpOnly, SameSite=Lax) is production-ready — only the UI needs to change. |

### Assumptions and trade-offs

- **localStorage for draft persistence**: Drafts are persisted to `localStorage` rather than a server-side draft API. This avoids backend complexity but means drafts are device-specific. A production system would save drafts to the server for cross-device access.
- **Filesystem snapshot store**: Releases are stored on the local filesystem under `releases/`. This is suitable for single-instance deployments but would need a database or blob store for horizontal scaling.
- **Single-content-type model**: The CMS model assumes one page type and one section type. Contentful's flexible content model allows multiple types, but the current adapter only maps a single pair. Extending to multiple content types would require additions to `mappers.ts` and the diff engine.
- **No database**: The app uses the filesystem for release storage and localStorage for draft persistence. This is intentional for a demo/portfolio project — a production deployment would use PostgreSQL, SQLite, or a similar database for the release history.
