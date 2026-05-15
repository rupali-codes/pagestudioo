import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettierConfig from 'eslint-config-prettier';

/**
 * ESLint configuration.
 *
 * Layer order matters:
 *  1. next/core-web-vitals  — Next.js + React rules
 *  2. next/typescript       — TypeScript-aware rules
 *  3. eslint-config-prettier — disables formatting rules that conflict with Prettier
 *
 * Prettier handles all formatting; ESLint handles correctness only.
 */
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Must come last — turns off ESLint rules that Prettier owns
  prettierConfig,
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'playwright-report/**',
  ]),
]);

export default eslintConfig;
