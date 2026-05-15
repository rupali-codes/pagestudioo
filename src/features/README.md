# Features

Each sub-folder is a self-contained vertical slice of product functionality.

## Structure

```
features/
└── <feature-name>/
    ├── components/   UI components specific to this feature
    ├── hooks/        Hooks used only by this feature
    ├── types.ts      Feature-local types (not shared across features)
    └── index.ts      Public API — only export what other features need
```

## Rules

1. **Features may import from shared layers** (`@lib`, `@store`, `@types`,
   `@components/ui`, `@hooks`) but **never from other features**.
2. **Shared code lives in the top-level folders**, not inside a feature.
   If two features need the same thing, move it up.
3. **`index.ts` is the public API.** Other parts of the app import from
   `@features/<name>`, never from deep paths inside a feature.
4. **No business logic in components.** Components call hooks; hooks contain
   logic.

## Current features

| Feature | Description |
|---|---|
| `page-viewer` | Renders CMS pages for end users |
| `page-editor` | Studio editing experience (Redux-driven) |
| `releases` | Publish flow and release history |
