import { chromium } from '@playwright/test';

async function screenshotPages() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Landing page
  await page.goto('https://b0a12d5c.devmind-e8h.pages.dev');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: '/tmp/landing.png', fullPage: true });
  console.log('Landing page: ✓');

  // Login page
  await page.goto('https://b0a12d5c.devmind-e8h.pages.dev/login');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: '/tmp/login.png' });
  console.log('Login page: ✓');

  // Signup page
  await page.goto('https://b0a12d5c.devmind-e8h.pages.dev/signup');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: '/tmp/signup.png' });
  console.log('Signup page: ✓');

  // Execute page
  await page.goto('https://b0a12d5c.devmind-e8h.pages.dev/execute');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: '/tmp/execute.png', fullPage: true });
  console.log('Execute page: ✓');

  console.log('\nAll screenshots saved to /tmp/');
  await browser.close();
}

screenshotPages();
