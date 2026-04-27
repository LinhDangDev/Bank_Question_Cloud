import { test, expect } from '@playwright/test';

test('app shows login screen', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Đăng nhập' })).toBeVisible();
});

