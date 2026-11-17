import { test, expect } from '@playwright/test';

test.describe('Links Tests', () => {
  test('landing page returns 200', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
  });

  test('login page returns 200', async ({ page }) => {
    const response = await page.goto('/login');
    expect(response?.status()).toBe(200);
  });

  test('signup page returns 200', async ({ page }) => {
    const response = await page.goto('/signup');
    expect(response?.status()).toBe(200);
  });
});

test.describe('Performance', () => {
  test('pages load within reasonable time', async ({ page }) => {
    const start = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - start;

    expect(loadTime).toBeLessThan(10000);
  });
});
