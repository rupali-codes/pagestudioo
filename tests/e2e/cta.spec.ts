import { test, expect } from '@playwright/test';

test.describe('CTA interaction', () => {
  test('renders CTA section with primary link', async ({ page }) => {
    await page.goto('/preview/demo');

    const ctaLink = page.getByRole('link', { name: 'Read the docs' });
    await expect(ctaLink).toBeVisible();
    await expect(ctaLink).toHaveAttribute('href', '/docs');
  });

  test('CTA link navigates to the correct page', async ({ page }) => {
    await page.goto('/preview/demo');

    await page.getByRole('link', { name: 'Read the docs' }).click();
    await expect(page).toHaveURL('/docs');
  });

  test('CTA section heading is visible', async ({ page }) => {
    await page.goto('/');

    await expect(
      page.getByRole('heading', { name: 'Ready to build your next landing page?' }),
    ).toBeVisible();
  });
});
