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
  await page.getByRole('link', { name: /Morgan, Mochi, 555-0104 Dog/ }).click();
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

test('shared branding and the primary slogan appear on login and sidebar', async ({ page }) => {
  await page.goto('/login');
  const logo = 'VERT Veterinary Emergency Record Transfer';
  await expect(page.getByRole('link', { name: logo })).toHaveAttribute('href', '/login');
  await expect(page.getByRole('heading', {
    name: 'Immediate remote access so your team can focus on the care ahead.',
  })).toBeVisible();
  await expect(page.locator('.brand-symbol')).toHaveCount(0);
  await page.goto('/preview/');
  await expect(page.getByRole('link', { name: logo })).toHaveAttribute('href', '/preview/');
});

test('owner hierarchy, direct pet lookup, and adoption controls stay read-only', async ({ page }) => {
  const mutations = [];
  page.on('request', (request) => {
    if (request.method() !== 'GET') mutations.push(request.url());
  });
  await page.goto('/preview/owners');
  await page.getByRole('searchbox').fill('Mochi');
  await page.getByRole('link', { name: 'View Morgan, Alex, 555-0104' }).click();
  await expect(page.getByRole('heading', { name: 'Morgan, Alex, 555-0104', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: /Morgan, Juniper, 555-0104 Cat/ })).toBeVisible();
  await page.getByRole('link', { name: /Morgan, Mochi, 555-0104 Dog/ }).click();
  await expect(page.getByRole('img', { name: 'Pet photograph unavailable' })).toBeVisible();
  await expect(page.locator('dt').filter({ hasText: /^Adopted$/ }).locator('..')).toContainText('Yes');
  await page.getByRole('link', { name: 'Edit pet', exact: true }).click();
  await expect(page.getByRole('checkbox', { name: 'Adopted' })).toBeChecked();
  await page.getByLabel(/^Species/).selectOption('Cat');
  await expect(page.getByRole('checkbox', { name: 'Adopted' })).toHaveCount(0);
  await page.getByLabel(/^Species/).selectOption('Dog');
  await expect(page.getByRole('checkbox', { name: 'Adopted' })).not.toBeChecked();
  await page.getByLabel('Pet photograph').setInputFiles({
    name: 'form-review.png', mimeType: 'image/png', buffer: Buffer.from('local test file'),
  });
  await expect(page.getByText(/No image is uploaded or saved/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save record' })).toBeDisabled();
  await page.goto('/preview/owners/sample-owner');
  await page.getByRole('link', { name: 'Add pet', exact: true }).click();
  await expect(page).toHaveURL(/pets\/new\?owner_id=sample-owner$/);
  await expect(page.getByLabel(/^Owner/)).toHaveValue('sample-owner');
  await page.goto('/preview/pets');
  await page.getByRole('searchbox').fill('555-0104');
  await page.getByRole('link', { name: 'View Morgan, Mochi, 555-0104' }).click();
  await expect(page.getByRole('heading', { name: 'Morgan, Mochi, 555-0104', level: 1 })).toBeVisible();
  expect(mutations).toEqual([]);
});

test('dragging navigation changes order without navigation and survives refresh', async ({ page }) => {
  await page.goto('/preview/');
  const nav = page.getByRole('navigation', { name: 'Main navigation' });
  await page.getByRole('button', { name: 'Drag Pet records to reorder' }).dragTo(
    nav.getByRole('link', { name: 'Dashboard', exact: true }),
  );
  await expect(nav.getByRole('link').first()).toHaveText('Pet records');
  await expect(page).toHaveURL(/\/preview\/$/);
  await page.reload();
  await expect(nav.getByRole('link').first()).toHaveText('Pet records');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('vert:navigation:preview'))))
    .toEqual(['pets', 'dashboard', 'owners', 'visits', 'clinics']);
  await nav.getByRole('link', { name: 'Pet records', exact: true }).click();
  await expect(page).toHaveURL(/\/preview\/pets$/);
});

test('keyboard reordering keeps user and preview preferences separate', async ({ page }) => {
  let userId = 11;
  await page.route('**/api/frontend/session/', (route) => route.fulfill({
    json: { user: { id: userId, name: 'Test provider' }, permissions: {}, csrf_token: 'test-only' },
  }));
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Main navigation' });
  const move = page.getByRole('button', { name: 'Move Pet records up' });
  await move.focus();
  await page.keyboard.press('Enter');
  await expect(nav.getByRole('link').nth(1)).toHaveText('Pet records');
  await expect(move).toBeFocused();
  await page.reload();
  await expect(nav.getByRole('link').nth(1)).toHaveText('Pet records');
  userId = 22;
  await page.reload();
  await expect(nav.getByRole('link').nth(1)).toHaveText('Pet owners');
  await page.getByRole('button', { name: 'Move Visits up' }).click();
  userId = 11;
  await page.reload();
  await expect(nav.getByRole('link').nth(1)).toHaveText('Pet records');
  await page.goto('/preview/');
  await expect(nav.getByRole('link').nth(1)).toHaveText('Pet owners');
  await expect(page.getByRole('link', { name: 'Account', exact: true })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Account', exact: true })).toHaveCount(0);
});

test('narrow mobile pages and keyboard reordering fit without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  for (const path of ['/login', '/preview/pets', '/preview/pets/new', '/preview/owners/new', '/preview/owners/sample-owner', '/preview/pets/sample-pet']) {
    await page.goto(path);
    await expect(page.locator('main')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth), path).toBeLessThanOrEqual(320);
  }
  await page.getByRole('button', { name: 'Toggle navigation' }).click();
  const nav = page.getByRole('navigation', { name: 'Main navigation' });
  await page.getByRole('button', { name: 'Move Pet records up' }).focus();
  await page.keyboard.press('Enter');
  await expect(nav.getByRole('link').nth(1)).toHaveText('Pet records');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await page.screenshot({ path: 'test-results/navigation-mobile.png', fullPage: true });
  await nav.getByRole('link', { name: 'Pet owners', exact: true }).click();
  await expect(page).toHaveURL(/\/preview\/owners$/);
});
