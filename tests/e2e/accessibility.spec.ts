/**
 * @a11y
 * Accessibility tests using axe-core via @axe-core/playwright.
 * Tag: @a11y — run with: npm run test:a11y
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility @a11y', () => {
  test('home page has no critical accessibility violations', async ({ page }) => {
    await page.goto('/');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('studio page has no critical accessibility violations', async ({ page }) => {
    await page.goto('/studio');
    // Wait for the page to fully render
    await page.waitForSelector('[role="toolbar"]');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
