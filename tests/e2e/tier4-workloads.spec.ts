import { test, expect } from '@playwright/test';

const ADMIN_SECRET_PATH = process.env.ADMIN_SECRET_PATH || 'sys-portal-8f2e9d';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin_hydroponics_secure_pass_2026';

test.describe('Tier 4: Real-World Grower & Admin Workloads', () => {

  // =========================================================================
  // Scenario 1: Commercial Lettuce Grower Operational Workflow
  // =========================================================================
  test('Scenario 1: Commercial Lettuce Grower Journey', async ({ page }) => {
    test.setTimeout(60_000);

    // Step 1: Navigate to homepage
    await page.goto('/');

    // Step 2: Filter by Leafy Greens
    const leafyPill = page.getByTestId('category-leafy-greens')
      .or(page.getByRole('button', { name: /leafy greens/i }));
    await leafyPill.click();

    // Verify counter shows leafy greens
    const counter = page.getByTestId('active-crop-count')
      .or(page.getByText(/\b\d+\s+(crops?|plants?)\b/i));
    await expect(counter).toContainText(/2/);

    // Step 3: Switch to Table view for dense comparison
    const tableBtn = page.getByTestId('view-table-btn')
      .or(page.getByRole('button', { name: /table/i }));
    await tableBtn.click();

    // Verify Lettuce row metrics in table
    const lettuceRow = page.getByTestId('plant-table-row')
      .or(page.locator('tbody tr'))
      .filter({ hasText: /Lettuce/i });
    await expect(lettuceRow.first()).toBeVisible();
    await expect(lettuceRow.first()).toContainText(/5\.5\s*-\s*6\.5/); // pH
    await expect(lettuceRow.first()).toContainText(/0\.8\s*-\s*1\.2/); // EC

    // Step 4: Click into Lettuce detail page
    const detailLink = lettuceRow.first().getByRole('link').or(lettuceRow.first().locator('a'));
    await detailLink.first().click();
    await expect(page).toHaveURL(/\/plants\/crop-lettuce/);

    // Step 5: Verify Photoperiod and DLI requirements
    const lightReq = page.getByTestId('metric-light')
      .or(page.locator('.metric-light, [data-metric="light"]'))
      .or(page.locator(':has-text("Light")'));
    await expect(lightReq.first()).toContainText(/12\s*-\s*14\s*hours\/day|14\s*-\s*17\s*DLI/i);

    // Step 6: Review Common Issues for Tip Burn preventive measures
    const tipBurnIssue = page.getByTestId('issue-card')
      .or(page.locator('.issue-card'))
      .filter({ hasText: /Tip Burn/i });
    await expect(tipBurnIssue.first()).toBeVisible();
    await expect(tipBurnIssue.first()).toContainText(/airflow|calcium/i);

    // Step 7: Open Unit Converter to tune reservoir target EC 1.1 -> 550 PPM
    const converterBtn = page.getByTestId('unit-converter-btn')
      .or(page.getByRole('button', { name: /unit converter|calculator/i }));
    await converterBtn.click();

    const ecInput = page.getByTestId('converter-ec-input')
      .or(page.getByLabel(/^ec\b/i));
    await ecInput.fill('1.1');

    const ppm500 = page.getByTestId('converter-ppm500-input')
      .or(page.getByLabel(/500|hanna/i));
    await expect(ppm500).toHaveValue('550');

    // Step 8: Close converter and return to directory
    const closeBtn = page.getByTestId('converter-close-btn')
      .or(page.getByRole('button', { name: /close|×/i }));
    await closeBtn.first().click();

    const backLink = page.getByTestId('back-to-directory-link')
      .or(page.getByRole('link', { name: /back/i }));
    await backLink.first().click();
    await expect(page).toHaveURL(/\/(#.*)?$/);
  });

  // =========================================================================
  // Scenario 2: Fruiting Crop Pest & Deficiency Diagnostic Journey
  // =========================================================================
  test('Scenario 2: Fruiting Crop Pest Diagnosis', async ({ page }) => {
    test.setTimeout(60_000);

    // Step 1: Grower searches for "tomato" on homepage
    await page.goto('/');
    const searchInput = page.getByTestId('search-input')
      .or(page.getByPlaceholder(/search/i));
    await searchInput.fill('tomato');

    // Step 2: Open Tomato detail page
    const tomatoCard = page.getByTestId('plant-card')
      .or(page.locator('article'))
      .filter({ hasText: /Tomato/i });
    await expect(tomatoCard.first()).toBeVisible();

    const tomatoLink = tomatoCard.first().getByRole('link').or(tomatoCard.first().locator('a'));
    await tomatoLink.first().click();
    await expect(page).toHaveURL(/\/plants\/crop-tomato/);

    // Step 3: Scroll to Common Issues and inspect Blossom End Rot
    const berIssue = page.getByTestId('issue-card')
      .or(page.locator('.issue-card'))
      .filter({ hasText: /Blossom End Rot/i });
    await expect(berIssue.first()).toBeVisible();

    // Step 4: Verify detailed Cause explanation
    const causeText = berIssue.first().getByTestId('issue-cause')
      .or(berIssue.first().locator(':has-text("Cause")'))
      .or(berIssue.first());
    await expect(causeText.first()).toContainText(/calcium deficiency|transpiration/i);

    // Step 5: Verify detailed Resolution steps
    const resText = berIssue.first().getByTestId('issue-resolution')
      .or(berIssue.first().locator(':has-text("Resolution")'))
      .or(berIssue.first());
    await expect(resText.first()).toContainText(/stabilize rootzone|150-200 ppm|lower EC/i);

    // Step 6: Verify optimal nutrient target range displayed at top
    const ecRange = page.getByTestId('metric-ec')
      .or(page.locator('.metric-ec, [data-metric="ec"]'))
      .or(page.locator(':has-text("EC")'));
    await expect(ecRange.first()).toContainText(/2\.0\s*-\s*3\.5/);
  });

  // =========================================================================
  // Scenario 3: Administrator Custom Crop Lifecycle & Override
  // =========================================================================
  test('Scenario 3: Admin Custom Crop Lifecycle', async ({ page }) => {
    test.setTimeout(60_000);

    // Step 1: Navigate to secret admin URL and login
    await page.goto(`/${ADMIN_SECRET_PATH}`);
    const passwordInput = page.getByTestId('admin-password-input')
      .or(page.locator('input[type="password"]'));
    if (await passwordInput.isVisible()) {
      await passwordInput.fill(ADMIN_PASSWORD);
      await page.getByTestId('admin-login-btn').or(page.getByRole('button', { name: /log in|sign in|login/i })).click();
    }

    // Step 2: Click Add Crop to open modal
    const addBtn = page.getByTestId('add-plant-btn')
      .or(page.getByRole('button', { name: /add (crop|plant)|new (crop|plant)/i }));
    await addBtn.click();

    // Step 3: Fill crop details for Japanese Strawberry with photo and calculation override
    const cropName = `Tochiotome Strawberry ${Date.now()}`;
    await page.getByTestId('plant-name-input').or(page.getByLabel(/name/i)).fill(cropName);
    
    const categorySelect = page.getByTestId('plant-category-select').or(page.getByLabel(/category/i));
    await expect(categorySelect.first()).toBeVisible();
    await categorySelect.first().selectOption('Fruiting');

    const imageInput = page.getByTestId('plant-image-input').or(page.getByLabel(/image/i));
    if (await imageInput.count() > 0 && await imageInput.first().isVisible()) {
      await imageInput.first().fill('/images/strawberry.jpg');
    }

    await page.getByTestId('plant-ph-min-input').or(page.getByLabel(/ph min/i)).fill('5.6');
    await page.getByTestId('plant-ph-max-input').or(page.getByLabel(/ph max/i)).fill('6.2');
    await page.getByTestId('plant-ec-min-input').or(page.getByLabel(/ec min/i)).fill('0.9');
    await page.getByTestId('plant-ec-max-input').or(page.getByLabel(/ec max/i)).fill('1.3');

    // Step 4: Toggle Override Calculations ON to set custom PPM targets
    const overrideToggle = page.getByTestId('override-calculations-toggle')
      .or(page.getByLabel(/override|custom calculations/i))
      .or(page.locator('input[type="checkbox"][name*="Custom"]'));
    await expect(overrideToggle.first()).toBeVisible();
    await overrideToggle.first().check();

    const ppm500Min = page.getByTestId('plant-ppm500-min-input').or(page.locator('input[name="ppm500Min"]'));
    await expect(ppm500Min.first()).toBeVisible();
    await ppm500Min.first().fill('480');

    // Step 5: Save crop
    const saveBtn = page.getByTestId('plant-submit-btn').or(page.getByRole('button', { name: /save|create/i }));
    await saveBtn.click();

    // Step 6: Verify crop appears in admin list
    await expect(page.getByText(cropName).first()).toBeVisible();

    // Step 7: Verify public discovery in directory and custom calculation override on detail page
    await page.goto('/');
    const searchInput = page.getByTestId('search-input').or(page.getByPlaceholder(/search/i));
    await searchInput.fill(cropName);
    const card = page.getByTestId('plant-card').or(page.locator('article')).filter({ hasText: cropName });
    await expect(card.first()).toBeVisible();

    const cardLink = card.first().getByRole('link').or(card.first().locator('a'));
    await cardLink.first().click();
    await expect(page).toHaveURL(/\/plants\/.+/);

    const ppmMetric = page.getByTestId('metric-ppm500')
      .or(page.locator('.metric-ppm500, [data-metric="ppm500"]'))
      .or(page.locator(':has-text("PPM")'));
    await expect(ppmMetric.first()).toContainText(/480/);

    // Step 8: Return to admin portal, edit pH range
    await page.goto(`/${ADMIN_SECRET_PATH}`);
    const cropRow = page.getByTestId('admin-plant-row')
      .or(page.locator('tr'))
      .filter({ hasText: cropName });
    const editBtn = cropRow.first().getByTestId('edit-plant-btn')
      .or(cropRow.first().getByRole('button', { name: /edit/i }));
    await editBtn.first().click();

    const phMaxInput = page.getByTestId('plant-ph-max-input').or(page.getByLabel(/ph max/i));
    await expect(phMaxInput.first()).toBeVisible();
    await phMaxInput.first().fill('6.4');

    const updateBtn = page.getByTestId('plant-submit-btn').or(page.getByRole('button', { name: /save|update/i }));
    await updateBtn.first().click();

    // Step 9: Delete the test crop
    await cropRow.first().getByTestId('delete-plant-btn')
      .or(cropRow.first().getByRole('button', { name: /delete/i })).first().click();

    // Confirm delete dialog
    const confirmBtn = page.getByTestId('confirm-delete-btn')
      .or(page.getByRole('button', { name: /confirm delete/i }));
    await expect(confirmBtn.first()).toBeVisible({ timeout: 5000 });
    await confirmBtn.first().click();

    // Step 10: Verify public search no longer shows crop
    await page.goto('/');
    await searchInput.fill(cropName);
    const counter = page.getByTestId('active-crop-count').or(page.getByText(/\b\d+\s+(crops?|plants?)\b/i));
    await expect(counter).toContainText(/0/);
  });

  // =========================================================================
  // Scenario 4: Admin Common Issue Management Workflow
  // =========================================================================
  test('Scenario 4: Admin Common Issue Management', async ({ page }) => {
    test.setTimeout(60_000);

    // Step 1: Login to admin portal
    await page.goto(`/${ADMIN_SECRET_PATH}`);
    const passwordInput = page.getByTestId('admin-password-input')
      .or(page.locator('input[type="password"]'));
    if (await passwordInput.isVisible()) {
      await passwordInput.fill(ADMIN_PASSWORD);
      await page.getByTestId('admin-login-btn').or(page.getByRole('button', { name: /log in|sign in|login/i })).click();
    }

    // Step 2: Manage issues for Cucumber
    const cucumberRow = page.getByTestId('admin-plant-row')
      .or(page.locator('tr'))
      .filter({ hasText: /Cucumber/i });
    const manageIssuesBtn = cucumberRow.first().getByTestId('manage-issues-btn')
      .or(cucumberRow.first().getByRole('button', { name: /issues/i }));
    await manageIssuesBtn.first().click();

    // Step 3: Add new issue with symptom photo
    const newIssueTitle = `Spider Mites ${Date.now()}`;
    const titleInput = page.getByTestId('issue-title-input').or(page.getByLabel(/title/i));
    await titleInput.fill(newIssueTitle);

    const causeInput = page.getByTestId('issue-cause-input').or(page.getByLabel(/cause/i));
    await causeInput.fill('Warm, dry canopy conditions promote two-spotted spider mites.');

    const resInput = page.getByTestId('issue-resolution-input').or(page.getByLabel(/resolution/i));
    await resInput.fill('Introduce predatory mites and increase canopy relative humidity.');

    const imageInput = page.getByTestId('issue-image-input').or(page.getByLabel(/image/i));
    if (await imageInput.count() > 0 && await imageInput.first().isVisible()) {
      await imageInput.first().fill('/images/cucumber.jpg');
    }

    const saveIssueBtn = page.getByTestId('issue-submit-btn').or(page.getByRole('button', { name: /save issue|add issue|save/i }));
    await saveIssueBtn.first().click();

    // Step 4: Verify issue displays on public Cucumber detail page
    await page.goto('/plants/crop-cucumber');
    const issueCard = page.getByTestId('issue-card')
      .or(page.locator('.issue-card'))
      .filter({ hasText: newIssueTitle });
    await expect(issueCard.first()).toBeVisible();
    await expect(issueCard.first()).toContainText(/Warm, dry canopy conditions/i);

    // Step 5: Return to admin portal and edit the resolution
    await page.goto(`/${ADMIN_SECRET_PATH}`);
    await cucumberRow.first().getByTestId('manage-issues-btn')
      .or(cucumberRow.first().getByRole('button', { name: /issues/i })).first().click();

    const targetIssueItem = page.locator('.issue-card, [data-testid="issue-card"], [data-testid="admin-issue-item"], tr, li')
      .filter({ hasText: newIssueTitle });
    await expect(targetIssueItem.first()).toBeVisible();

    const editIssueBtn = targetIssueItem.first().getByTestId('edit-issue-btn')
      .or(targetIssueItem.first().getByRole('button', { name: /edit/i }));
    await expect(editIssueBtn.first()).toBeVisible();
    await editIssueBtn.first().click();
    const updatedRes = 'Updated resolution: Introduce predatory mites and increase humidity.';
    const resEditInput = page.getByTestId('issue-resolution-input').or(page.getByLabel(/resolution/i));
    await resEditInput.first().fill(updatedRes);
    await page.getByTestId('issue-submit-btn').or(page.getByRole('button', { name: /save|update/i })).first().click();

    // Wait for updated resolution to appear in modal list before navigating away
    await expect(page.getByText(updatedRes)).toBeVisible({ timeout: 10000 });

    // Verify edited resolution on public page
    await page.goto('/plants/crop-cucumber');
    await expect(page.getByText('Updated resolution: Introduce predatory mites')).toBeVisible();

    // Return to admin to delete
    await page.goto(`/${ADMIN_SECRET_PATH}`);
    await cucumberRow.first().getByTestId('manage-issues-btn')
      .or(cucumberRow.first().getByRole('button', { name: /issues/i })).first().click();

    // Step 6: Delete only the test issue (scope strictly to container containing newIssueTitle)
    const issueToDelete = page.locator('.issue-card, [data-testid="issue-card"], [data-testid="admin-issue-item"], tr, li')
      .filter({ hasText: newIssueTitle });
    await expect(issueToDelete.first()).toBeVisible();

    const deleteIssueBtn = issueToDelete.first().getByTestId('delete-issue-btn')
      .or(issueToDelete.first().getByRole('button', { name: /delete/i }));
    await expect(deleteIssueBtn.first()).toBeVisible();
    await deleteIssueBtn.first().click();

    // Confirm delete issue dialog - strictly target confirm button
    const confirmBtn = page.getByTestId('confirm-delete-btn')
      .or(page.getByRole('button', { name: /confirm delete/i }));
    await expect(confirmBtn.first()).toBeVisible({ timeout: 5000 });
    await confirmBtn.first().click();
    await expect(issueToDelete).not.toBeVisible({ timeout: 5000 });

    // Step 7: Verify removal on public page and ensure seed issue remains
    await page.goto('/plants/crop-cucumber');
    await expect(page.getByText(newIssueTitle)).not.toBeVisible();
    await expect(page.getByText(/Powdery Mildew/i)).toBeVisible();
  });

  // =========================================================================
  // Scenario 5: Full Disaster Recovery & Migration
  // =========================================================================
  test('Scenario 5: Disaster Recovery & Migration', async ({ page, request }) => {
    test.setTimeout(60_000);

    // Step 1: Login via API
    await request.post('/api/admin/auth/login', { data: { password: ADMIN_PASSWORD } });

    // Step 2: Trigger Seed Database to ensure reference dataset is present
    const seedRes = await request.post('/api/admin/seed', { data: {} });
    expect(seedRes.status()).toBe(200);

    // Step 3: Export full JSON disaster recovery backup
    const exportRes = await request.get('/api/admin/export?format=json');
    expect(exportRes.status()).toBe(200);
    const backupData = await exportRes.json();

    // Step 4: Verify backup payload structure
    expect(Array.isArray(backupData.plants || backupData)).toBe(true);
    const plantsList = backupData.plants || backupData;
    expect(plantsList.length).toBeGreaterThanOrEqual(8);

    // Check that Lettuce has expected nutrient fields
    const lettuce = plantsList.find((p: any) => p.name.includes('Lettuce'));
    expect(lettuce).toBeDefined();
    expect(lettuce.phMin).toBe(5.5);
    expect(lettuce.phMax).toBe(6.5);
    expect(lettuce.ecMin).toBe(0.8);
    expect(lettuce.ecMax).toBe(1.2);

    // Step 5: Test bulk import validation endpoint
    const importRes = await request.post('/api/admin/import', {
      data: backupData,
    });
    expect([200, 201]).toContain(importRes.status());
    const importSummary = await importRes.json();
    expect(importSummary.errors || []).toHaveLength(0);
  });
});
