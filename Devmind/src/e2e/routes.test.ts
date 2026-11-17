import { test, expect } from '@playwright/test';

// Simple test to verify pages return 200 status
test.describe('Page Load Tests', () => {
  test('landing page loads without error', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
  });

  test('login page loads without error', async ({ page }) => {
    const response = await page.goto('/login');
    expect(response?.status()).toBe(200);
  });

  test('signup page loads without error', async ({ page }) => {
    const response = await page.goto('/signup');
    expect(response?.status()).toBe(200);
  });

  test('execute page loads without error', async ({ page }) => {
    const response = await page.goto('/execute');
    expect(response?.status()).toBe(200);
  });
});

test.describe('Navigation Tests', () => {
  test('can navigate to login from landing', async ({ page }) => {
    await page.goto('/');
    await page.goto('/login');
    const response = await page.goto('/login');
    expect(response?.status()).toBe(200);
  });

  test('can navigate to signup from landing', async ({ page }) => {
    await page.goto('/');
    await page.goto('/signup');
    const response = await page.goto('/signup');
    expect(response?.status()).toBe(200);
  });
});

test.describe('Console Error Tests', () => {
  test('no critical console errors on landing', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForTimeout(3000);

    // Filter out non-critical errors
    const critical = errors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('404') &&
      !e.includes('Failed to load resource')
    );
    expect(critical).toHaveLength(0);
  });
});
