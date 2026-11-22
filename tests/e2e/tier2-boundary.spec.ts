import { test, expect } from '@playwright/test';

const ADMIN_SECRET_PATH = process.env.ADMIN_SECRET_PATH || 'sys-portal-8f2e9d';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin_hydroponics_secure_pass_2026';

test.describe('Tier 2: Boundary Value Analysis & Error Handling', () => {

  // =========================================================================
  // 1. Search Query Edge Cases & Security Inputs
  // =========================================================================
  test.describe('Search Edge Cases & Security', () => {

    test('T2.1: submitting an empty search query returns all crops', async ({ page }) => {
      await page.goto('/');
      const searchInput = page.getByTestId('search-input')
        .or(page.getByPlaceholder(/search/i));
      
      await searchInput.fill('');
      const counter = page.getByTestId('active-crop-count')
        .or(page.getByText(/\b\d+\s+(crops?|plants?)\b/i));
      await expect(counter).toContainText(/8/);
    });

    test('T2.2: submitting whitespace-only query trims and returns all crops', async ({ page }) => {
      await page.goto('/');
      const searchInput = page.getByTestId('search-input')
        .or(page.getByPlaceholder(/search/i));
      
      await searchInput.fill('     ');
      const counter = page.getByTestId('active-crop-count')
        .or(page.getByText(/\b\d+\s+(crops?|plants?)\b/i));
      await expect(counter).toContainText(/8/);
    });

    test('T2.3: no-match search query displays clean empty state message and 0 counter', async ({ page }) => {
      await page.goto('/');
      const searchInput = page.getByTestId('search-input')
        .or(page.getByPlaceholder(/search/i));
      
      await searchInput.fill('xyznonexistentcrop123');
      
      const emptyNotice = page.getByText(/no crops found|no matching plants/i);
      await expect(emptyNotice.first()).toBeVisible();

      const counter = page.getByTestId('active-crop-count')
        .or(page.getByText(/\b\d+\s+(crops?|plants?)\b/i));
      await expect(counter).toContainText(/0/);
    });

    test('T2.4: SQL injection query "\' OR 1=1 --" executes safely without database crash or leakage', async ({ page }) => {
      await page.goto('/');
      const searchInput = page.getByTestId('search-input')
        .or(page.getByPlaceholder(/search/i));
      
      await searchInput.fill("' OR 1=1 --");

      // Verify page didn't throw an unhandled error and shows 0 crops or empty state
      const counter = page.getByTestId('active-crop-count')
        .or(page.getByText(/\b\d+\s+(crops?|plants?)\b/i));
      await expect(counter).toContainText(/0/);
    });

    test('T2.5: SQL injection query "; DROP TABLE plants; --" is sanitized without syntax error', async ({ page }) => {
      await page.goto('/');
      const searchInput = page.getByTestId('search-input')
        .or(page.getByPlaceholder(/search/i));
      
      await searchInput.fill('; DROP TABLE plants; --');

      const counter = page.getByTestId('active-crop-count')
        .or(page.getByText(/\b\d+\s+(crops?|plants?)\b/i));
      await expect(counter).toContainText(/0/);

      // Verify plants table still intact by clearing search
      await searchInput.fill('');
      await expect(counter).toContainText(/8/);
    });

    test('T2.6: XSS script tags in search input render safely without dialog trigger', async ({ page }) => {
      let dialogTriggered = false;
      page.on('dialog', async (dialog) => {
        dialogTriggered = true;
        await dialog.dismiss();
      });

      await page.goto('/');
      const searchInput = page.getByTestId('search-input')
        .or(page.getByPlaceholder(/search/i));
      
      await searchInput.fill('<script>alert("xss")</script>');
      const counter = page.getByTestId('active-crop-count')
        .or(page.getByText(/\b\d+\s+(crops?|plants?)\b/i));
      await expect(counter).toContainText(/0/);

      expect(dialogTriggered).toBe(false);
    });
  });

  // =========================================================================
  // 2. Route Boundary & Route Guard Protection
  // =========================================================================
  test.describe('Route Guards & 404 Not Found', () => {

    test('T2.7: navigating to non-existent plant detail route returns 404 page', async ({ page }) => {
      const response = await page.goto('/plants/invalid-nonexistent-id-999');
      // Should return 404 status code or render 404 heading, never 500
      const is404Status = response?.status() === 404;
      const is404Heading = await page.getByRole('heading', { name: /404|not found/i }).first().isVisible().catch(() => false);
      expect(is404Status || is404Heading).toBe(true);
      expect(response?.status()).not.toBe(500);
      await expect(page.locator('body')).not.toContainText(/Internal Server Error|Traceback|ReferenceError|TypeError/i);
    });

    test('T2.8: direct access to /admin is blocked by middleware and returns 404', async ({ page }) => {
      const response = await page.goto('/admin');
      expect(response?.status()).toBe(404);
    });

    test('T2.9: direct access to /dashboard is blocked by middleware and returns 404', async ({ page }) => {
      const response = await page.goto('/dashboard');
      expect(response?.status()).toBe(404);
    });

    test('T2.10: robots.txt disallows /api/admin/ and /*portal* paths', async ({ request }) => {
      const response = await request.get('/robots.txt');
      expect(response.status()).toBe(200);
      const body = await response.text();
      expect(body).toContain('Disallow: /api/admin/');
      expect(body).toMatch(/Disallow:\s*\/\*portal\*/);
    });
  });

  // =========================================================================
  // 3. Unit Converter Boundary Cases & Numeric Precision
  // =========================================================================
  test.describe('Unit Converter Numeric Boundaries', () => {

    test('T2.11: entering 0 into EC field updates all scales to 0 without NaN', async ({ page }) => {
      await page.goto('/');
      const converterBtn = page.getByTestId('unit-converter-btn')
        .or(page.getByRole('button', { name: /unit converter|calculator/i }));
      await converterBtn.click();

      const ecInput = page.getByTestId('converter-ec-input').or(page.getByLabel(/^ec\b/i));
      await ecInput.fill('0');

      const cfInput = page.getByTestId('converter-cf-input').or(page.getByLabel(/^cf\b/i));
      await expect(cfInput).toHaveValue(/^0(\.0+)?$/);

      const ppm500 = page.getByTestId('converter-ppm500-input').or(page.getByLabel(/500|hanna/i));
      await expect(ppm500).toHaveValue(/^0(\.0+)?$/);

      const ppm700 = page.getByTestId('converter-ppm700-input').or(page.getByLabel(/700|eutech/i));
      await expect(ppm700).toHaveValue(/^0(\.0+)?$/);
    });

    test('T2.12: entering negative EC value is clamped to 0 or flagged invalid', async ({ page }) => {
      await page.goto('/');
      const converterBtn = page.getByTestId('unit-converter-btn')
        .or(page.getByRole('button', { name: /unit converter|calculator/i }));
      await converterBtn.click();

      const ecInput = page.getByTestId('converter-ec-input').or(page.getByLabel(/^ec\b/i));
      await ecInput.fill('-1.5');

      const cfInput = page.getByTestId('converter-cf-input').or(page.getByLabel(/^cf\b/i));
      const cfVal = await cfInput.inputValue();
      const isClamped = cfVal === '0' || cfVal === '0.0' || cfVal === '' || Number(cfVal) === 0;
      const isInvalid = await ecInput.getAttribute('aria-invalid') === 'true' || await ecInput.evaluate((el: HTMLInputElement) => !el.checkValidity());
      expect(isClamped || isInvalid).toBe(true);
    });

    test('T2.13: floating point precision: EC 1.15 produces exact cF=11.5, PPM500=575, PPM700=805', async ({ page }) => {
      await page.goto('/');
      const converterBtn = page.getByTestId('unit-converter-btn')
        .or(page.getByRole('button', { name: /unit converter|calculator/i }));
      await converterBtn.click();

      const ecInput = page.getByTestId('converter-ec-input').or(page.getByLabel(/^ec\b/i));
      await ecInput.fill('1.15');

      const cfInput = page.getByTestId('converter-cf-input').or(page.getByLabel(/^cf\b/i));
      await expect(cfInput).toHaveValue('11.5');

      const ppm500 = page.getByTestId('converter-ppm500-input').or(page.getByLabel(/500|hanna/i));
      await expect(ppm500).toHaveValue('575');

      const ppm700 = page.getByTestId('converter-ppm700-input').or(page.getByLabel(/700|eutech/i));
      await expect(ppm700).toHaveValue('805');
    });
  });

  // =========================================================================
  // 4. Plant Form Validation Boundaries
  // =========================================================================
  test.describe('Plant Form Input Validation Boundaries', () => {

    test.beforeEach(async ({ page }) => {
      await page.goto(`/${ADMIN_SECRET_PATH}`);
      const passwordInput = page.getByTestId('admin-password-input')
        .or(page.locator('input[type="password"]'));
      if (await passwordInput.isVisible()) {
        await passwordInput.fill(ADMIN_PASSWORD);
        await page.getByTestId('admin-login-btn').or(page.getByRole('button', { name: /log in|sign in|login/i })).click();
      }
      const addCropBtn = page.getByTestId('add-plant-btn')
        .or(page.getByRole('button', { name: /add (crop|plant)|new (crop|plant)/i }));
      await addCropBtn.click();
    });

    test('T2.14: inverted pH range (phMin > phMax) triggers validation error', async ({ page }) => {
      const nameInput = page.getByTestId('plant-name-input').or(page.getByLabel(/name/i));
      await nameInput.fill('Invalid pH Crop');

      const phMinInput = page.getByTestId('plant-ph-min-input').or(page.getByLabel(/ph min/i));
      const phMaxInput = page.getByTestId('plant-ph-max-input').or(page.getByLabel(/ph max/i));
      await phMinInput.fill('6.8');
      await phMaxInput.fill('5.5');

      const submitBtn = page.getByTestId('plant-submit-btn').or(page.getByRole('button', { name: /save|create/i }));
      await submitBtn.click();

      const errorAlert = page.getByTestId('form-error-alert')
        .or(page.getByRole('alert'))
        .or(page.getByText(/ph.*must be less than|invalid ph|minimum cannot exceed/i));
      await expect(errorAlert.first()).toBeVisible();
    });

    test('T2.15: out-of-bounds pH (< 0 or > 14) triggers validation error', async ({ page }) => {
      const nameInput = page.getByTestId('plant-name-input').or(page.getByLabel(/name/i));
      await nameInput.fill('Extreme pH Crop');

      const phMaxInput = page.getByTestId('plant-ph-max-input').or(page.getByLabel(/ph max/i));
      await phMaxInput.fill('15.5');

      const submitBtn = page.getByTestId('plant-submit-btn').or(page.getByRole('button', { name: /save|create/i }));
      await submitBtn.click();

      const errorAlert = page.getByTestId('form-error-alert')
        .or(page.getByRole('alert'))
        .or(page.getByText(/between 0 and 14|maximum 14/i));
      await expect(errorAlert.first()).toBeVisible();
    });

    test('T2.16: inverted EC range (ecMin > ecMax) triggers validation error', async ({ page }) => {
      const nameInput = page.getByTestId('plant-name-input').or(page.getByLabel(/name/i));
      await nameInput.fill('Inverted EC Crop');

      const ecMinInput = page.getByTestId('plant-ec-min-input').or(page.getByLabel(/ec min/i));
      const ecMaxInput = page.getByTestId('plant-ec-max-input').or(page.getByLabel(/ec max/i));
      await ecMinInput.fill('3.5');
      await ecMaxInput.fill('1.5');

      const submitBtn = page.getByTestId('plant-submit-btn').or(page.getByRole('button', { name: /save|create/i }));
      await submitBtn.click();

      const errorAlert = page.getByTestId('form-error-alert')
        .or(page.getByRole('alert'))
        .or(page.getByText(/ec.*must be less than|minimum cannot exceed/i));
      await expect(errorAlert.first()).toBeVisible();
    });

    test('T2.17: negative EC value triggers validation error', async ({ page }) => {
      const nameInput = page.getByTestId('plant-name-input').or(page.getByLabel(/name/i));
      await nameInput.fill('Negative EC Crop');

      const ecMinInput = page.getByTestId('plant-ec-min-input').or(page.getByLabel(/ec min/i));
      await ecMinInput.fill('-0.8');

      const submitBtn = page.getByTestId('plant-submit-btn').or(page.getByRole('button', { name: /save|create/i }));
      await submitBtn.click();

      const errorAlert = page.getByTestId('form-error-alert')
        .or(page.getByRole('alert'))
        .or(page.getByText(/must be greater than or equal to 0|non-negative/i));
      await expect(errorAlert.first()).toBeVisible();
    });

    test('T2.18: inverted temperature range (tempMinC > tempMaxC) triggers validation error', async ({ page }) => {
      const nameInput = page.getByTestId('plant-name-input').or(page.getByLabel(/name/i));
      await nameInput.fill('Inverted Temp Crop');

      const tempMin = page.getByTestId('plant-temp-min-input').or(page.getByLabel(/temp.*min/i));
      const tempMax = page.getByTestId('plant-temp-max-input').or(page.getByLabel(/temp.*max/i));
      await expect(tempMin.first()).toBeVisible();
      await expect(tempMax.first()).toBeVisible();
      await tempMin.first().fill('30');
      await tempMax.first().fill('15');

      const submitBtn = page.getByTestId('plant-submit-btn').or(page.getByRole('button', { name: /save|create/i }));
      await submitBtn.click();

      const errorAlert = page.getByTestId('form-error-alert')
        .or(page.getByRole('alert'))
        .or(page.getByText(/temperature.*must be less than|cannot exceed/i));
      await expect(errorAlert.first()).toBeVisible();
    });

    test('T2.19: submitting empty crop name fails validation', async ({ page }) => {
      const nameInput = page.getByTestId('plant-name-input').or(page.getByLabel(/name/i));
      await nameInput.fill('');

      const submitBtn = page.getByTestId('plant-submit-btn').or(page.getByRole('button', { name: /save|create/i }));
      await submitBtn.click();

      const errorAlert = page.getByTestId('form-error-alert')
        .or(page.getByRole('alert'))
        .or(page.getByText(/name is required|cannot be empty/i));
      await expect(errorAlert.first()).toBeVisible();
    });
  });

  // =========================================================================
  // 5. Unauthenticated API Mutations & File Upload Boundaries
  // =========================================================================
  test.describe('API Security & File Upload Boundaries', () => {

    test('T2.20: unauthenticated POST to /api/admin/plants returns 401 Unauthorized', async ({ request }) => {
      const response = await request.post('/api/admin/plants', {
        data: {
          name: 'Hacker Crop',
          category: 'Herbs',
          phMin: 5.5,
          phMax: 6.5,
          ecMin: 1.0,
          ecMax: 1.5,
          cfMin: 10,
          cfMax: 15,
          ppm500Min: 500,
          ppm500Max: 750,
          ppm700Min: 700,
          ppm700Max: 1050,
        },
      });
      expect(response.status()).toBe(401);
    });

    test('T2.21: unauthenticated POST to /api/admin/issues returns 401 Unauthorized', async ({ request }) => {
      const response = await request.post('/api/admin/issues', {
        data: {
          plantId: 'crop-tomato',
          title: 'Unauthorized Issue',
          causeDescription: 'Test cause',
          resolutionDescription: 'Test resolution',
        },
      });
      expect(response.status()).toBe(401);
    });

    test('T2.22: unauthenticated POST to /api/admin/seed returns 401 Unauthorized', async ({ request }) => {
      const response = await request.post('/api/admin/seed', { data: {} });
      expect(response.status()).toBe(401);
    });

    test('T2.23: file upload exceeding 5MB to /api/admin/upload returns 400 Bad Request', async ({ request }) => {
      // First login to get session
      const loginRes = await request.post('/api/admin/auth/login', {
        data: { password: ADMIN_PASSWORD },
      });
      expect(loginRes.status()).toBe(200);

      // Create a 6MB dummy buffer
      const largeBuffer = Buffer.alloc(6 * 1024 * 1024, 0);
      const uploadRes = await request.post('/api/admin/upload', {
        multipart: {
          file: {
            name: 'large-image.png',
            mimeType: 'image/png',
            buffer: largeBuffer,
          },
        },
      });
      expect(uploadRes.status()).toBe(400);
      const body = await uploadRes.json();
      expect(body.error).toMatch(/5MB|size/i);
    });

    test('T2.24: non-image file upload to /api/admin/upload returns 400 Bad Request', async ({ request }) => {
      await request.post('/api/admin/auth/login', {
        data: { password: ADMIN_PASSWORD },
      });

      const scriptBuffer = Buffer.from('console.log("hello malicious executable");');
      const uploadRes = await request.post('/api/admin/upload', {
        multipart: {
          file: {
            name: 'script.exe',
            mimeType: 'application/octet-stream',
            buffer: scriptBuffer,
          },
        },
      });
      expect(uploadRes.status()).toBe(400);
      const body = await uploadRes.json();
      expect(body.error).toMatch(/image|type|format/i);
    });
  });
});
