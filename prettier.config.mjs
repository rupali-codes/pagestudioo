/**
 * Prettier configuration.
 *
 * prettier-plugin-tailwindcss automatically sorts Tailwind class names
 * according to the recommended order, keeping class strings consistent
 * across the codebase without manual effort.
 */

/** @type {import('prettier').Config} */
const config = {
  // Consistent with most TypeScript projects
  semi: true,
  singleQuote: true,
  trailingComma: 'all',
  printWidth: 90,
  tabWidth: 2,
  useTabs: false,

  // Sort Tailwind classes automatically
  plugins: ['prettier-plugin-tailwindcss'],

  // Per-file overrides
  overrides: [
    {
      files: ['*.json', '*.jsonc'],
      options: { printWidth: 120 },
    },
    {
      files: ['*.md'],
      options: { proseWrap: 'always' },
    },
  ],
};

export default config;
