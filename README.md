# Page Studio

A production-grade, schema-driven landing page builder built with Next.js 15 App Router, Contentful CMS, and Redux Toolkit.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| UI primitives | shadcn/ui + Radix UI |
| State management | Redux Toolkit |
| Validation | Zod |
| CMS | Contentful |
| Testing | Playwright + axe-core |
| CI | GitHub Actions |
| Deployment | Vercel |

## Architecture

```
src/
├── app/                    # Next.js App Router
│   ├── pages/[slug]/       # Dynamic CMS-driven pages
│   ├── preview/[slug]/     # Live preview (Draft Mode)
│   ├── studio/             # Studio editor
│   └── api/
│       ├── preview/        # Enable/disable Draft Mode
│       └── publish/        # Create versioned releases
├── cms/                    # CMS adapter (Contentful-specific)
│   ├── contentfulClient.ts
│   ├── mappers.ts          # Raw CMS → domain types
│   └── pageRepository.ts   # Data access layer
├── components/
│   ├── page/               # PageRenderer, SectionRenderer, ErrorBoundary
│   ├── providers/          # ReduxProvider
│   ├── sections/           # Hero, FeatureGrid, Testimonial, CTA
│   ├── studio/             # StudioToolbar, SectionList, ReleaseHistory
│   └── ui/                 # Button, Badge, SectionError
├── lib/                    # Pure utilities
│   ├── cn.ts               # Tailwind class merging
│   ├── result.ts           # Result<T,E> type
│   ├── semver.ts           # Deterministic versioning
│   ├── validate.ts         # Zod wrapper
│   └── releaseId.ts        # Release ID builder
├── registry/
│   └── sectionRegistry.ts  # Typed section → component map
├── schemas/                # Zod schemas
│   ├── page.ts
│   ├── section.ts
│   └── props/              # Per-section prop schemas
├── store/                  # Redux Toolkit
│   ├── slices/             # page, auth, release
│   ├── hooks.ts            # Typed useAppDispatch/useAppSelector
│   ├── selectors.ts        # Memoized selectors
│   └── store.ts
└── types/                  # Domain types
    ├── auth.ts             # User, Role, Permission
    ├── cms.ts              # Raw Contentful shapes
    ├── page.ts             # Page, Section, PageRelease
    └── registry.ts         # SectionRegistry type
```

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.local.example .env.local
# Fill in your Contentful credentials
```

### 3. Run development server

```bash
npm run dev
```

### 4. Open Studio

Navigate to [http://localhost:3000/studio](http://localhost:3000/studio) — loads with a demo page when no CMS is configured.

## Contentful Setup

Create a **Page** content type with these fields:

| Field | Type | Required |
|---|---|---|
| `slug` | Short text | ✓ |
| `title` | Short text | ✓ |
| `sections` | References (many) | ✓ |

Create a **Section** content type with:

| Field | Type | Required |
|---|---|---|
| `sectionType` | Short text (enum: hero, featureGrid, testimonial, cta) | ✓ |
| `props` | JSON object | ✓ |

## Live Preview

1. Set `CONTENTFUL_PREVIEW_SECRET` in your environment
2. Configure Contentful's preview URL to: `https://your-domain.com/api/preview?secret={CONTENTFUL_PREVIEW_SECRET}&slug={entry.fields.slug}`
3. Preview opens at `/preview/{slug}` with a yellow banner

## Publishing

`POST /api/publish` accepts a page payload and returns an immutable `PageRelease` with a deterministic semver version:

- **major** — section type removed (breaking)
- **minor** — section type added
- **patch** — content-only change

## Role-Based Access

| Role | Permissions |
|---|---|
| `viewer` | Read pages |
| `editor` | Read + edit pages |
| `publisher` | Read + edit + publish |
| `admin` | All permissions + user management |

## Testing

```bash
# E2E tests (requires built app)
npm run build && npm run test:e2e

# Accessibility tests only
npm run test:a11y

# Type checking
npm run type-check
```

## Deployment

The project is Vercel-ready. Set the following environment variables in your Vercel project:

- `CONTENTFUL_SPACE_ID`
- `CONTENTFUL_ACCESS_TOKEN`
- `CONTENTFUL_PREVIEW_TOKEN`
- `CONTENTFUL_PREVIEW_SECRET`
- `NEXT_PUBLIC_APP_URL`
