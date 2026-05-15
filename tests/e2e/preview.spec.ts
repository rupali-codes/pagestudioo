import { test, expect } from '@playwright/test';

test.describe('Preview page', () => {
  test('renders the demo preview page with correct heading', async ({ page }) => {
    await page.goto('/preview/demo');

    await expect(
      page.getByRole('heading', { name: 'Welcome to Page Studio' }),
    ).toBeVisible({ timeout: 10000 });
  });

  test('shows preview mode banner', async ({ page }) => {
    await page.goto('/preview/demo');

    await expect(
      page.getByRole('status'),
    ).toContainText('Preview mode');
  });

  test('renders all demo sections in preview', async ({ page }) => {
    await page.goto('/preview/demo');

    await expect(
      page.getByRole('heading', { name: 'Features' }),
    ).toBeVisible();

    await expect(
      page.getByRole('heading', { name: 'Ready to build?' }),
    ).toBeVisible();
  });
});
