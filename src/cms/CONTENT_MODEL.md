# Contentful Content Model

This document describes the exact content types, fields, and validations to
configure in your Contentful space. The TypeScript skeleton types in
`contentfulTypes.ts` mirror this model — keep them in sync when you make
changes here.

---

## Content type: `page`

**Name:** Page  
**API identifier:** `page`  
**Description:** A landing page composed of ordered sections.

| Field ID   | Name     | Field type        | Required | Validations                        |
| ---------- | -------- | ----------------- | -------- | ---------------------------------- |
| `slug`     | Slug     | Short text        | ✓        | Unique; pattern `^[a-z0-9-/]+$`   |
| `title`    | Title    | Short text        | ✓        | Min length 1                       |
| `sections` | Sections | References (many) | ✓        | Accept only `section` content type |

**Notes:**
- Set `slug` as the **Entry title** field so it appears in the Contentful UI.
- Enable **Unique field** validation on `slug` to prevent duplicate pages.
- The `sections` field should use **Reference, many** (not a single reference).
- Order of sections in the `sections` array determines render order.

---

## Content type: `section`

**Name:** Section  
**API identifier:** `section`  
**Description:** A single renderable block within a page.

| Field ID      | Name         | Field type  | Required | Validations                                              |
| ------------- | ------------ | ----------- | -------- | -------------------------------------------------------- |
| `sectionType` | Section type | Short text  | ✓        | Predefined values: `hero`, `featureGrid`, `testimonial`, `cta` |
| `props`       | Props        | JSON object | ✓        | —                                                        |

**Notes:**
- Add a **Predefined values** validation on `sectionType` matching the
  `SectionType` union in `src/types/page.ts`. This prevents typos in the CMS.
- The `props` field is a free-form JSON object. Its shape is validated by the
  per-section Zod schemas in `src/schemas/props/` at render time.
- Set `sectionType` as the **Entry title** field for readability in the UI.

---

## Props shape per section type

These are the expected JSON structures for the `props` field. The Zod schemas
in `src/schemas/props/` are the authoritative source — this is a reference for
content authors.

### `hero`

```json
{
  "heading": "Welcome to Page Studio",
  "subheading": "Optional subtitle text",
  "ctaLabel": "Get started",
  "ctaHref": "/signup",
  "imageUrl": "https://images.ctfassets.net/...",
  "imageAlt": "Descriptive alt text"
}
```

Required: `heading`  
Optional: `subheading`, `ctaLabel`, `ctaHref`, `imageUrl`, `imageAlt`

---

### `featureGrid`

```json
{
  "heading": "Why choose us",
  "features": [
    {
      "id": "f1",
      "icon": "🚀",
      "title": "Fast",
      "description": "Loads in under a second."
    }
  ]
}
```

Required: `features` (array, min 1 item), each item requires `id`, `title`, `description`  
Optional: `heading`, `icon` per feature

---

### `testimonial`

```json
{
  "heading": "What our customers say",
  "testimonials": [
    {
      "id": "t1",
      "quote": "This product changed everything.",
      "author": "Jane Smith",
      "role": "CTO at Acme",
      "avatarUrl": "https://images.ctfassets.net/...",
      "avatarAlt": "Jane Smith"
    }
  ]
}
```

Required: `testimonials` (array, min 1 item), each item requires `id`, `quote`, `author`  
Optional: `heading`, `role`, `avatarUrl`, `avatarAlt` per testimonial

---

### `cta`

```json
{
  "heading": "Ready to get started?",
  "body": "Join thousands of teams already using Page Studio.",
  "primaryLabel": "Start free trial",
  "primaryHref": "/signup",
  "secondaryLabel": "View pricing",
  "secondaryHref": "/pricing"
}
```

Required: `heading`, `primaryLabel`, `primaryHref`  
Optional: `body`, `secondaryLabel`, `secondaryHref`

---

## Preview URL configuration

In Contentful → Settings → Content preview, add a preview URL for the `page`
content type:

```
https://your-domain.com/api/preview?secret={CONTENTFUL_PREVIEW_SECRET}&slug={entry.fields.slug}
```

Replace `your-domain.com` with your Vercel deployment URL or `localhost:3000`
for local development.

---

## Adding a new section type

1. Add the new type to the `SectionType` union in `src/types/page.ts`
2. Add it to the `SectionTypeSchema` enum in `src/schemas/section.ts`
3. Create a props schema in `src/schemas/props/<type>.ts`
4. Create the React component in `src/components/sections/<Type>Section.tsx`
5. Register it in `src/registry/sectionRegistry.ts`
6. Add the new value to the `sectionType` predefined values in Contentful
7. Update this document

TypeScript will error at step 5 if you forget step 4 — the registry type
enforces that every `SectionType` has a registered component.
