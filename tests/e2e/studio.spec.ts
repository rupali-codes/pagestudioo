import { test, expect } from '@playwright/test';

test.describe('Studio', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/studio');
  });

  test('renders the studio toolbar', async ({ page }) => {
    await expect(
      page.getByRole('toolbar', { name: 'Studio toolbar' }),
    ).toBeVisible();
  });

  test('renders the section editor sidebar', async ({ page }) => {
    await expect(
      page.getByRole('complementary', { name: 'Section editor' }),
    ).toBeVisible();
  });

  test('renders the release history sidebar', async ({ page }) => {
    await expect(
      page.getByRole('complementary', { name: 'Release history' }),
    ).toBeVisible();
  });

  test('shows demo page sections in preview', async ({ page }) => {
    // Wait for Redux to hydrate the demo page
    await expect(
      page.getByRole('heading', { name: 'Welcome to Page Studio' }),
    ).toBeVisible({ timeout: 5000 });
  });

  test('shows preview mode banner', async ({ page }) => {
    await expect(
      page.getByRole('status'),
    ).toContainText('Preview mode');
  });

  test('save draft button is disabled when no changes', async ({ page }) => {
    const saveBtn = page.getByRole('button', { name: 'Save draft' });
    await expect(saveBtn).toBeDisabled();
  });
});
