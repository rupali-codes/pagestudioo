import { test, expect } from '@playwright/test';

test.describe('Home page', () => {
  test('renders the home page with correct heading', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Page Studio' })).toBeVisible();
  });

  test('has a skip navigation link', async ({ page }) => {
    await page.goto('/');
    const skipLink = page.getByRole('link', { name: 'Skip to main content' });
    await expect(skipLink).toBeInViewport({ ratio: 0 }); // sr-only by default
  });

  test('navigates to studio', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Open Studio' }).click();
    await expect(page).toHaveURL('/studio');
  });
});
