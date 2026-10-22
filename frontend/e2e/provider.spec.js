import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('**/api/frontend/session/', (route) =>
    route.fulfill({
      json: {
        user: null,
        permissions: {},
        csrf_token: 'test-only',
        login_label: 'Username',
      },
    }),
  );
});

test('login validates input and protects clinical routes', async ({ page }) => {
  await page.goto('/pets/42');
  await expect(page).toHaveURL(/\/login$/);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(
    page.getByText('Enter your username and password.'),
  ).toBeVisible();
  await page.screenshot({
    path: 'test-results/login-desktop.png',
    fullPage: true,
  });
});

test('sample workflow stays read-only and makes unknown findings explicit', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/preview/');
  await expect(
    page.getByRole('heading', { name: 'Welcome, sample provider' }),
  ).toBeVisible();
  await page.screenshot({
    path: 'test-results/dashboard-desktop.png',
    fullPage: true,
  });
  await page.getByRole('link', { name: /Mochi Dog/ }).click();
  await expect(
    page.getByRole('heading', { name: 'Critical Medical Information' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Chronic conditions' }).locator('..'),
  ).toContainText('Not recorded');
  await page.screenshot({
    path: 'test-results/pet-desktop.png',
    fullPage: true,
  });
  await page.getByRole('link', { name: /Sample scheduled.*Oct/ }).click();
  await page.getByRole('link', { name: 'Edit documentation' }).click();
  await page.getByLabel('Examination findings').fill('Sample findings');
  await page.getByRole('button', { name: 'Check form' }).click();
  await expect(
    page.getByRole('button', { name: 'Save record' }),
  ).toBeDisabled();
  await expect(page.getByLabel('Examination findings')).toHaveValue(
    'Sample findings',
  );
  await expect(page.getByText(/record was saved/)).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('mobile navigation and forms fit the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of [
    '/login',
    '/register',
    '/preview/',
    '/preview/owners',
    '/preview/pets/sample-pet',
    '/preview/visits/new',
    '/preview/medications/new',
  ]) {
    await page.goto(path);
    await expect(page.locator('main')).toBeVisible();
    const sizes = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      width: window.innerWidth,
    }));
    expect(sizes.scroll, path).toBeLessThanOrEqual(sizes.width);
  }
  await page.goto('/preview/pets/sample-pet');
  await page.screenshot({
    path: 'test-results/pet-mobile.png',
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Toggle navigation' }).click();
  await expect(
    page.getByRole('navigation', { name: 'Main navigation' }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Pet owners', exact: true }).click();
  await expect(page).toHaveURL(/\/preview\/owners$/);
  await expect(
    page.getByRole('navigation', { name: 'Main navigation' }),
  ).toBeHidden();
});

test('network failures give an actionable sign-in error', async ({ page }) => {
  await page.route('**/api/frontend/login/', (route) =>
    route.fulfill({
      status: 400,
      json: { message: 'Sign-in failed. Check your account details.' },
    }),
  );
  await page.goto('/login');
  await page.getByLabel('Username').fill('test-provider');
  await page.getByLabel(/^Password/).fill('bad-password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(
    page.getByText('Sign-in failed. Check your account details.'),
  ).toBeVisible();
});
