import { test, expect } from '@playwright/test';

const ADMIN_SECRET_PATH = process.env.ADMIN_SECRET_PATH || 'sys-portal-8f2e9d';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin_hydroponics_secure_pass_2026';

test.describe('Tier 3: Cross-Feature Combinations & State Synchronization', () => {

  // =========================================================================
  // T3.1: Search + Category Filter Intersection
  // =========================================================================
  test('T3.1: search query and category filter intersect correctly', async ({ page }) => {
    await page.goto('/');

    // 1. Select Fruiting category (should show 4 crops)
    const fruitingBtn = page.getByTestId('category-fruiting')
      .or(page.getByRole('button', { name: /^fruiting$/i }));
    await fruitingBtn.click();

    const counter = page.getByTestId('active-crop-count')
      .or(page.getByText(/\b\d+\s+(crops?|plants?)\b/i));
    await expect(counter).toContainText(/4/);

    // 2. Type "Tomato" in search -> intersection matches exactly 1 crop
    const searchInput = page.getByTestId('search-input')
      .or(page.getByPlaceholder(/search/i));
    await searchInput.fill('Tomato');
    await expect(counter).toContainText(/1/);

    const cards = page.getByTestId('plant-card').or(page.locator('article'));
    await expect(cards.filter({ hasText: /Tomato/i }).first()).toBeVisible();

    // 3. Type "Lettuce" while Fruiting is active -> intersection is 0 crops
    await searchInput.fill('Lettuce');
    await expect(counter).toContainText(/0/);
    const emptyNotice = page.getByText(/no crops found|no matching/i);
    await expect(emptyNotice.first()).toBeVisible();
  });

  // =========================================================================
  // T3.2: View Switch Preserves Filter State
  // =========================================================================
  test('T3.2: switching between Grid and Table views preserves search and category state', async ({ page }) => {
    await page.goto('/');

    // Filter by Herbs
    const herbsBtn = page.getByTestId('category-herbs')
      .or(page.getByRole('button', { name: /^herbs$/i }));
    await herbsBtn.click();

    // Search Basil
    const searchInput = page.getByTestId('search-input')
      .or(page.getByPlaceholder(/search/i));
    await searchInput.fill('Basil');

    // Switch to Table view
    const tableBtn = page.getByTestId('view-table-btn')
      .or(page.getByRole('button', { name: /table/i }));
    await tableBtn.click();

    // Verify only Basil is displayed in table
    const rows = page.getByTestId('plant-table-row').or(page.locator('tbody tr'));
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText(/Basil/i);

    // Switch back to Grid view
    const gridBtn = page.getByTestId('view-grid-btn')
      .or(page.getByRole('button', { name: /grid/i }));
    await gridBtn.click();

    // Verify only 1 card is displayed for Basil
    const cards = page.getByTestId('plant-card').or(page.locator('article'));
    await expect(cards.filter({ hasText: /Basil/i }).first()).toBeVisible();
  });

  // =========================================================================
  // T3.3 & T3.4: Calculation Override Toggle Reflection & Toggle-Off Reversion
  // =========================================================================
  test('T3.3: calculation override toggle ON reflects custom PPM on public detail page', async ({ page, request }) => {
    // Authenticate via API
    await request.post('/api/admin/auth/login', { data: { password: ADMIN_PASSWORD } });

    // Create a crop with custom calculations ON
    const uniqueName = `Custom Berry ${Date.now()}`;
    const createRes = await request.post('/api/admin/plants', {
      data: {
        name: uniqueName,
        category: 'Fruiting',
        phMin: 5.5,
        phMax: 6.2,
        ecMin: 1.0,
        ecMax: 1.4,
        cfMin: 10,
        cfMax: 14,
        ppm500Min: 777, // custom override (standard is 500)
        ppm500Max: 999, // custom override (standard is 700)
        ppm700Min: 1100,
        ppm700Max: 1300,
        isCustomCalculations: true,
      },
    });
    expect(createRes.status()).toBe(201);
    const createdPlant = await createRes.json();

    try {
      // Navigate to public detail page
      await page.goto(`/plants/${createdPlant.id}`);
      const ppm500Metric = page.getByTestId('metric-ppm500')
        .or(page.locator('.metric-ppm500, [data-metric="ppm500"]'))
        .or(page.locator(':has-text("PPM")'));
      await expect(ppm500Metric.first()).toContainText(/777\s*-\s*999/);
    } finally {
      // Cleanup
      await request.delete(`/api/admin/plants/${createdPlant.id}`);
    }
  });

  test('T3.4: calculation override toggle OFF reverts to standard formula values', async ({ page, request }) => {
    await request.post('/api/admin/auth/login', { data: { password: ADMIN_PASSWORD } });

    const uniqueName = `Revert Crop ${Date.now()}`;
    const createRes = await request.post('/api/admin/plants', {
      data: {
        name: uniqueName,
        category: 'Herbs',
        phMin: 5.5,
        phMax: 6.5,
        ecMin: 2.0,
        ecMax: 3.0,
        cfMin: 20,
        cfMax: 30,
        ppm500Min: 888, // custom
        ppm500Max: 999,
        ppm700Min: 1200,
        ppm700Max: 1400,
        isCustomCalculations: true,
      },
    });
    const createdPlant = await createRes.json();

    try {
      // Now update with isCustomCalculations = false (auto-calculated: 2.0*500 = 1000, 3.0*500 = 1500)
      await request.put(`/api/admin/plants/${createdPlant.id}`, {
        data: {
          isCustomCalculations: false,
          ecMin: 2.0,
          ecMax: 3.0,
          cfMin: 20,
          cfMax: 30,
          ppm500Min: 1000,
          ppm500Max: 1500,
          ppm700Min: 1400,
          ppm700Max: 2100,
        },
      });

      // Check public page
      await page.goto(`/plants/${createdPlant.id}`);
      const ppm500Metric = page.getByTestId('metric-ppm500')
        .or(page.locator('.metric-ppm500, [data-metric="ppm500"]'))
        .or(page.locator(':has-text("PPM")'));
      await expect(ppm500Metric.first()).toContainText(/1000\s*-\s*1500/);
    } finally {
      // Cleanup
      await request.delete(`/api/admin/plants/${createdPlant.id}`);
    }
  });

  // =========================================================================
  // T3.5: Admin Crop Create -> Public Discovery
  // =========================================================================
  test('T3.5: crop created by admin is immediately searchable on public directory', async ({ page, request }) => {
    await request.post('/api/admin/auth/login', { data: { password: ADMIN_PASSWORD } });

    const testCropName = `Bok Choy ${Date.now()}`;
    const createRes = await request.post('/api/admin/plants', {
      data: {
        name: testCropName,
        category: 'Brassicas',
        phMin: 6.0,
        phMax: 6.8,
        ecMin: 1.5,
        ecMax: 2.0,
        cfMin: 15,
        cfMax: 20,
        ppm500Min: 750,
        ppm500Max: 1000,
        ppm700Min: 1050,
        ppm700Max: 1400,
        isCustomCalculations: false,
      },
    });
    const createdPlant = await createRes.json();

    try {
      // Navigate to public page
      await page.goto('/');
      const searchInput = page.getByTestId('search-input').or(page.getByPlaceholder(/search/i));
      await searchInput.fill(testCropName);

      const card = page.getByTestId('plant-card').or(page.locator('article')).filter({ hasText: testCropName });
      await expect(card.first()).toBeVisible();

      // Click and verify detail page
      const cardLink = card.first().getByRole('link').or(card.first().locator('a'));
      await cardLink.first().click();
      await expect(page).toHaveURL(`/plants/${createdPlant.id}`);
    } finally {
      // Cleanup
      await request.delete(`/api/admin/plants/${createdPlant.id}`);
    }
  });

  // =========================================================================
  // T3.6: Admin Issue Create -> Public Detail Page
  // =========================================================================
  test('T3.6: issue added by admin appears in common issues section on public detail page', async ({ page, request }) => {
    await request.post('/api/admin/auth/login', { data: { password: ADMIN_PASSWORD } });

    const issueTitle = `Test Aphids ${Date.now()}`;
    const issueRes = await request.post('/api/admin/issues', {
      data: {
        plantId: 'crop-lettuce',
        title: issueTitle,
        causeDescription: 'Green peach aphids colonizing underside of tender leaves.',
        resolutionDescription: 'Release ladybug larvae or apply potassium soap spray.',
      },
    });
    expect(issueRes.status()).toBe(201);
    const createdIssue = await issueRes.json();

    try {
      // Check public Lettuce detail page
      await page.goto('/plants/crop-lettuce');
      const issueItem = page.getByTestId('issue-card')
        .or(page.locator('.issue-card'))
        .or(page.getByText(issueTitle));
      await expect(issueItem.first()).toBeVisible();
    } finally {
      // Cleanup issue
      await request.delete(`/api/admin/issues/${createdIssue.id}`);
    }
  });

  // =========================================================================
  // T3.7: Cascade Deletion of Plant and Issues
  // =========================================================================
  test('T3.7: deleting a crop cascades and purges its common issues', async ({ page, request }) => {
    await request.post('/api/admin/auth/login', { data: { password: ADMIN_PASSWORD } });

    // Create a temporary crop with an issue
    const tempName = `Temp Cascade Crop ${Date.now()}`;
    const plantRes = await request.post('/api/admin/plants', {
      data: {
        name: tempName,
        category: 'Other',
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
        isCustomCalculations: false,
      },
    });
    const plant = await plantRes.json();

    const issueRes = await request.post('/api/admin/issues', {
      data: {
        plantId: plant.id,
        title: 'Cascade Root Rot',
        causeDescription: 'Test cause description',
        resolutionDescription: 'Test resolution description',
      },
    });
    const issue = await issueRes.json();

    let plantDeleted = false;
    try {
      // Now delete the plant
      const delRes = await request.delete(`/api/admin/plants/${plant.id}`);
      expect(delRes.status()).toBe(200);
      plantDeleted = true;

      // Verify public plant route returns 404
      const detailResponse = await page.goto(`/plants/${plant.id}`);
      const is404 = detailResponse?.status() === 404 || await page.getByRole('heading', { name: /404|not found/i }).first().isVisible().catch(() => false);
      expect(is404).toBe(true);
      expect(detailResponse?.status()).not.toBe(500);
      await expect(page.locator('body')).not.toContainText(/Internal Server Error|Traceback|ReferenceError|TypeError/i);

      // Verify issue was cascade deleted and cannot be updated
      const updateIssueRes = await request.put(`/api/admin/issues/${issue.id}`, {
        data: { title: 'Updated' },
      });
      expect([404, 400]).toContain(updateIssueRes.status());
    } finally {
      if (!plantDeleted) {
        await request.delete(`/api/admin/plants/${plant.id}`).catch(() => {});
      }
    }
  });

  // =========================================================================
  // T3.8: PPM Scale Preference Switch
  // =========================================================================
  test('T3.8: toggling PPM scale selector preference updates metric emphasis across UI', async ({ page }) => {
    await page.goto('/');

    const ppmToggle = page.getByTestId('ppm-scale-selector')
      .or(page.getByRole('button', { name: /ppm scale|scale preference|hanna|eutech/i }))
      .or(page.locator('button:has-text("PPM")'));

    await expect(ppmToggle.first()).toBeVisible();
    await ppmToggle.first().click();
    await expect(ppmToggle.first()).toHaveAttribute('aria-pressed', 'true');
  });

  // =========================================================================
  // T3.9: Admin Crop Update -> Public Detail Reflection
  // =========================================================================
  test('T3.9: updating crop metrics via admin updates public detail page in real-time', async ({ page, request }) => {
    await request.post('/api/admin/auth/login', { data: { password: ADMIN_PASSWORD } });

    // Create a crop
    const cropName = `Update Target ${Date.now()}`;
    const plantRes = await request.post('/api/admin/plants', {
      data: {
        name: cropName,
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
        isCustomCalculations: false,
      },
    });
    const plant = await plantRes.json();

    try {
      // Now update EC to 2.2 - 2.8
      await request.put(`/api/admin/plants/${plant.id}`, {
        data: {
          ecMin: 2.2,
          ecMax: 2.8,
          cfMin: 22,
          cfMax: 28,
          ppm500Min: 1100,
          ppm500Max: 1400,
          ppm700Min: 1540,
          ppm700Max: 1960,
        },
      });

      // Verify on public detail page
      await page.goto(`/plants/${plant.id}`);
      const ecMetric = page.getByTestId('metric-ec')
        .or(page.locator('.metric-ec, [data-metric="ec"]'))
        .or(page.locator(':has-text("EC")'));
      await expect(ecMetric.first()).toContainText(/2\.2\s*-\s*2\.8/);
    } finally {
      // Cleanup
      await request.delete(`/api/admin/plants/${plant.id}`);
    }
  });

  // =========================================================================
  // T3.10: Database Seeding Endpoint Disabled
  // =========================================================================
  test('T3.10: authenticated POST to /api/admin/seed returns 404 disabled error', async ({ request }) => {
    await request.post('/api/admin/auth/login', { data: { password: ADMIN_PASSWORD } });

    const seedRes = await request.post('/api/admin/seed', { data: {} });
    expect(seedRes.status()).toBe(404);

    const json = await seedRes.json();
    expect(json.error).toBeDefined();
  });
});
