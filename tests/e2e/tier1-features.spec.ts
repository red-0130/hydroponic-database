import { test, expect } from '@playwright/test';

const ADMIN_SECRET_PATH = process.env.ADMIN_SECRET_PATH || 'sys-portal-8f2e9d';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin_hydroponics_secure_pass_2026';

test.describe('Tier 1: Feature Coverage (Category-Partition Testing)', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to homepage before each test
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  // =========================================================================
  // Feature Area 1: Plant Search by Name (Text Matching)
  // =========================================================================
  test.describe('1. Plant Search by Name', () => {

    test('T1.1.1: typing "Lettuce" filters displayed crops to show Head/Bibb Lettuce and updates counter', async ({ page }) => {
      const searchInput = page.getByTestId('search-input')
        .or(page.getByPlaceholder(/search/i))
        .or(page.getByRole('textbox', { name: /search/i }));
      
      await expect(searchInput).toBeVisible();
      await searchInput.fill('Lettuce');

      // Wait for debounce and filtered state
      const plantCards = page.getByTestId('plant-card')
        .or(page.locator('article'))
        .or(page.locator('.plant-card'));
      
      await expect(plantCards.filter({ hasText: /Lettuce/i }).first()).toBeVisible();
      // Negative assertion: non-matching crops must not be visible
      await expect(plantCards.filter({ hasText: /Basil/i })).not.toBeVisible();
      await expect(plantCards.filter({ hasText: /Tomato/i })).not.toBeVisible();

      // Check counter
      const counter = page.getByTestId('active-crop-count')
        .or(page.getByText(/\b\d+\s+(crops?|plants?)\b/i));
      await expect(counter).toContainText(/1/);
    });

    test('T1.1.2: search is case-insensitive ("tomato", "TOMATO", "tOmAtO")', async ({ page }) => {
      const searchInput = page.getByTestId('search-input')
        .or(page.getByPlaceholder(/search/i));

      for (const term of ['tomato', 'TOMATO', 'tOmAtO']) {
        await searchInput.fill(term);
        const card = page.getByTestId('plant-card')
          .or(page.locator('article'))
          .filter({ hasText: /Tomato/i });
        await expect(card.first()).toBeVisible();

        // Negative assertion: non-matching crop must not be visible
        const nonMatchingCard = page.getByTestId('plant-card')
          .or(page.locator('article'))
          .filter({ hasText: /Lettuce/i });
        await expect(nonMatchingCard).not.toBeVisible();
      }
    });

    test('T1.1.3: substring search matches partial crop names (e.g. "bell" -> "Bell Pepper")', async ({ page }) => {
      const searchInput = page.getByTestId('search-input')
        .or(page.getByPlaceholder(/search/i));
      
      await searchInput.fill('bell');
      const card = page.getByTestId('plant-card')
        .or(page.locator('article'))
        .filter({ hasText: /Bell Pepper/i });
      await expect(card.first()).toBeVisible();

      // Negative assertion: non-matching crop must not be visible
      const nonMatchingCard = page.getByTestId('plant-card')
        .or(page.locator('article'))
        .filter({ hasText: /Strawberry/i });
      await expect(nonMatchingCard).not.toBeVisible();
    });

    test('T1.1.4: searching by scientific name ("Ocimum basilicum") returns Basil', async ({ page }) => {
      const searchInput = page.getByTestId('search-input')
        .or(page.getByPlaceholder(/search/i));
      
      await searchInput.fill('Ocimum basilicum');
      const card = page.getByTestId('plant-card')
        .or(page.locator('article'))
        .filter({ hasText: /Basil/i });
      await expect(card.first()).toBeVisible();

      // Negative assertion: non-matching crop must not be visible
      const nonMatchingCard = page.getByTestId('plant-card')
        .or(page.locator('article'))
        .filter({ hasText: /Cucumber/i });
      await expect(nonMatchingCard).not.toBeVisible();
    });

    test('T1.1.5: clearing search resets crop list to all crops and restores counter', async ({ page }) => {
      const searchInput = page.getByTestId('search-input')
        .or(page.getByPlaceholder(/search/i));
      
      await searchInput.fill('Spinach');
      const clearBtn = page.getByTestId('clear-search-btn')
        .or(page.getByRole('button', { name: /clear/i }))
        .or(page.locator('button[aria-label="Clear search"]'));

      if (await clearBtn.isVisible()) {
        await clearBtn.click();
      } else {
        await searchInput.fill('');
      }

      const counter = page.getByTestId('active-crop-count')
        .or(page.getByText(/\b\d+\s+(crops?|plants?)\b/i));
      await expect(counter).toContainText(/8/);
    });
  });

  // =========================================================================
  // Feature Area 2: Category Filter Pills & Active Crop Counter
  // =========================================================================
  test.describe('2. Category Filter Pills & Active Counter', () => {

    test('T1.2.1: filtering by "Leafy Greens" displays Lettuce and Spinach', async ({ page }) => {
      const leafyBtn = page.getByTestId('category-leafy-greens')
        .or(page.getByRole('button', { name: /leafy greens/i }));
      await leafyBtn.click();

      const cards = page.getByTestId('plant-card').or(page.locator('article'));
      await expect(cards.filter({ hasText: /Lettuce/i }).first()).toBeVisible();
      await expect(cards.filter({ hasText: /Spinach/i }).first()).toBeVisible();
      // Negative assertions: non-leafy crops must not be visible
      await expect(cards.filter({ hasText: /Basil/i })).not.toBeVisible();
      await expect(cards.filter({ hasText: /Tomato/i })).not.toBeVisible();
      
      const counter = page.getByTestId('active-crop-count').or(page.getByText(/\b\d+\s+(crops?|plants?)\b/i));
      await expect(counter).toContainText(/2/);
    });

    test('T1.2.2: filtering by "Herbs" displays Basil and Mint', async ({ page }) => {
      const herbsBtn = page.getByTestId('category-herbs')
        .or(page.getByRole('button', { name: /^herbs$/i }));
      await herbsBtn.click();

      const cards = page.getByTestId('plant-card').or(page.locator('article'));
      await expect(cards.filter({ hasText: /Basil/i }).first()).toBeVisible();
      await expect(cards.filter({ hasText: /Mint/i }).first()).toBeVisible();
      // Negative assertions: non-herb crops must not be visible
      await expect(cards.filter({ hasText: /Lettuce/i })).not.toBeVisible();
      await expect(cards.filter({ hasText: /Tomato/i })).not.toBeVisible();

      const counter = page.getByTestId('active-crop-count').or(page.getByText(/\b\d+\s+(crops?|plants?)\b/i));
      await expect(counter).toContainText(/2/);
    });

    test('T1.2.3: filtering by "Fruiting" displays Tomato, Bell Pepper, Strawberry, Cucumber', async ({ page }) => {
      const fruitingBtn = page.getByTestId('category-fruiting')
        .or(page.getByRole('button', { name: /^fruiting$/i }));
      await fruitingBtn.click();

      const cards = page.getByTestId('plant-card').or(page.locator('article'));
      await expect(cards.filter({ hasText: /Tomato/i }).first()).toBeVisible();
      await expect(cards.filter({ hasText: /Pepper/i }).first()).toBeVisible();
      await expect(cards.filter({ hasText: /Strawberry/i }).first()).toBeVisible();
      await expect(cards.filter({ hasText: /Cucumber/i }).first()).toBeVisible();
      // Negative assertions: non-fruiting crops must not be visible
      await expect(cards.filter({ hasText: /Lettuce/i })).not.toBeVisible();
      await expect(cards.filter({ hasText: /Basil/i })).not.toBeVisible();

      const counter = page.getByTestId('active-crop-count').or(page.getByText(/\b\d+\s+(crops?|plants?)\b/i));
      await expect(counter).toContainText(/4/);
    });

    test('T1.2.4: filtering by category with zero crops (Root Vegetables / Brassicas) shows empty state', async ({ page }) => {
      const rootBtn = page.getByTestId('category-root-vegetables')
        .or(page.getByRole('button', { name: /root vegetables/i }))
        .or(page.getByTestId('category-brassicas'))
        .or(page.getByRole('button', { name: /brassicas/i }));

      await expect(rootBtn.first()).toBeVisible();
      await rootBtn.first().click();
      const counter = page.getByTestId('active-crop-count').or(page.getByText(/\b\d+\s+(crops?|plants?)\b/i));
      await expect(counter).toContainText(/0/);
    });

    test('T1.2.5: clicking "All" category filter resets category and shows all 8 crops', async ({ page }) => {
      const herbsBtn = page.getByTestId('category-herbs')
        .or(page.getByRole('button', { name: /^herbs$/i }));
      await herbsBtn.click();

      const allBtn = page.getByTestId('category-all')
        .or(page.getByRole('button', { name: /^all$/i }));
      await allBtn.click();

      const counter = page.getByTestId('active-crop-count').or(page.getByText(/\b\d+\s+(crops?|plants?)\b/i));
      await expect(counter).toContainText(/8/);
    });

    test('T1.2.6: active crop counter displays dynamic count matching filtered results', async ({ page }) => {
      const counter = page.getByTestId('active-crop-count').or(page.getByText(/\b\d+\s+(crops?|plants?)\b/i));
      await expect(counter).toBeVisible();
      await expect(counter).toContainText(/8/);
    });
  });

  // =========================================================================
  // Feature Area 3: Dual View Toggle (Card Grid vs Table)
  // =========================================================================
  test.describe('3. Dual View Toggle', () => {

    test('T1.3.1: default initial view renders card grid', async ({ page }) => {
      const gridCards = page.getByTestId('plant-card')
        .or(page.locator('article'))
        .or(page.locator('.plant-card'));
      await expect(gridCards.first()).toBeVisible();
      expect(await gridCards.count()).toBeGreaterThanOrEqual(1);
    });

    test('T1.3.2: clicking "Table" view toggle hides card grid and displays comparison table', async ({ page }) => {
      const tableToggleBtn = page.getByTestId('view-table-btn')
        .or(page.getByRole('button', { name: /table/i }));
      await tableToggleBtn.click();

      const plantTable = page.getByTestId('plant-table')
        .or(page.getByRole('table'))
        .or(page.locator('table'));
      await expect(plantTable).toBeVisible();
    });

    test('T1.3.3: table view displays necessary metric columns (Name, Category, pH, EC, PPM)', async ({ page }) => {
      const tableToggleBtn = page.getByTestId('view-table-btn')
        .or(page.getByRole('button', { name: /table/i }));
      await tableToggleBtn.click();

      const tableHeaders = page.locator('th');
      await expect(tableHeaders.filter({ hasText: /Name|Crop/i }).first()).toBeVisible();
      await expect(tableHeaders.filter({ hasText: /Category/i }).first()).toBeVisible();
      await expect(tableHeaders.filter({ hasText: /pH/i }).first()).toBeVisible();
      await expect(tableHeaders.filter({ hasText: /EC/i }).first()).toBeVisible();
    });

    test('T1.3.4: table body contains rows corresponding to the active crops', async ({ page }) => {
      const tableToggleBtn = page.getByTestId('view-table-btn')
        .or(page.getByRole('button', { name: /table/i }));
      await tableToggleBtn.click();

      const rows = page.getByTestId('plant-table-row')
        .or(page.locator('tbody tr'));
      await expect(rows.first()).toBeVisible();
      expect(await rows.count()).toBeGreaterThanOrEqual(1);
    });

    test('T1.3.5: clicking "Grid" view toggle restores card grid view', async ({ page }) => {
      const tableToggleBtn = page.getByTestId('view-table-btn')
        .or(page.getByRole('button', { name: /table/i }));
      await tableToggleBtn.click();

      const gridToggleBtn = page.getByTestId('view-grid-btn')
        .or(page.getByRole('button', { name: /grid/i }));
      await gridToggleBtn.click();

      const gridCards = page.getByTestId('plant-card')
        .or(page.locator('article'));
      await expect(gridCards.first()).toBeVisible();
    });
  });

  // =========================================================================
  // Feature Area 4: Dedicated Plant Detail View (/plants/[id])
  // =========================================================================
  test.describe('4. Dedicated Plant Detail View', () => {

    test('T1.4.1: clicking a plant card navigates to /plants/[id]', async ({ page }) => {
      const lettuceLink = page.getByRole('link', { name: /Lettuce/i })
        .or(page.locator('a[href*="/plants/"]').filter({ hasText: /Lettuce/i }));
      await lettuceLink.first().click();

      await expect(page).toHaveURL(/\/plants\/.+/);
      const heading = page.getByRole('heading', { level: 1 })
        .or(page.getByTestId('plant-detail-name'));
      await expect(heading.first()).toBeVisible();
      await expect(heading.first()).toContainText(/Lettuce/i);
      await expect(page.locator('body')).not.toContainText(/Internal Server Error|HTTP 500|500 Server Error|Traceback|ReferenceError|TypeError/i);
    });

    test('T1.4.2: detail page displays plant name, scientific name, and category badge', async ({ page }) => {
      await page.goto('/plants/crop-lettuce');
      
      const nameHeading = page.getByTestId('plant-detail-name')
        .or(page.getByRole('heading', { level: 1 }));
      await expect(nameHeading).toContainText(/Lettuce/i);

      const categoryBadge = page.getByTestId('plant-detail-category')
        .or(page.locator('.category-badge, [class*="badge"]'))
        .or(page.getByText(/Leafy Greens/i));
      await expect(categoryBadge.first()).toBeVisible();
    });

    test('T1.4.3: detail page displays target pH and EC nutrient ranges', async ({ page }) => {
      await page.goto('/plants/crop-lettuce');

      const phMetric = page.getByTestId('metric-ph')
        .or(page.locator('.metric-ph, [data-metric="ph"]'))
        .or(page.locator(':has-text("pH")'));
      await expect(phMetric.first()).toContainText(/5\.5\s*-\s*6\.5/);

      const ecMetric = page.getByTestId('metric-ec')
        .or(page.locator('.metric-ec, [data-metric="ec"]'))
        .or(page.locator(':has-text("EC")'));
      await expect(ecMetric.first()).toContainText(/0\.8\s*-\s*1\.2/);
    });

    test('T1.4.4: detail page displays derived metrics (cF, PPM 500, PPM 700)', async ({ page }) => {
      await page.goto('/plants/crop-lettuce');

      const cfMetric = page.getByTestId('metric-cf')
        .or(page.locator('.metric-cf, [data-metric="cf"]'))
        .or(page.locator(':has-text("cF")'));
      await expect(cfMetric.first()).toContainText(/8\s*-\s*12/);

      const ppm500Metric = page.getByTestId('metric-ppm500')
        .or(page.locator('.metric-ppm500, [data-metric="ppm500"]'))
        .or(page.locator(':has-text("500")'));
      await expect(ppm500Metric.first()).toContainText(/400\s*-\s*600/);

      const ppm700Metric = page.getByTestId('metric-ppm700')
        .or(page.locator('.metric-ppm700, [data-metric="ppm700"]'))
        .or(page.locator(':has-text("700")'));
      await expect(ppm700Metric.first()).toContainText(/560\s*-\s*840/);
    });

    test('T1.4.5: detail page displays Light Requirement (hours/day and DLI)', async ({ page }) => {
      await page.goto('/plants/crop-lettuce');

      const lightRequirement = page.getByTestId('metric-light')
        .or(page.locator('.metric-light, [data-metric="light"]'))
        .or(page.locator(':has-text("Light")'));
      await expect(lightRequirement.first()).toContainText(/hours\/day|DLI/i);
    });

    test('T1.4.6: detail page displays Temperature recommendations in °C and °F', async ({ page }) => {
      await page.goto('/plants/crop-lettuce');

      const tempMetric = page.getByTestId('metric-temp')
        .or(page.locator('.metric-temp, [data-metric="temp"]'))
        .or(page.locator(':has-text("Temp")'));
      await expect(tempMetric.first()).toContainText(/°C|°F/i);
    });

    test('T1.4.7: detail page displays practical hydroponic growth tips', async ({ page }) => {
      await page.goto('/plants/crop-lettuce');

      const tips = page.getByTestId('metric-growth-tips')
        .or(page.locator('.growth-tips, [data-metric="tips"]'))
        .or(page.locator(':has-text("Tips")'));
      await expect(tips.first()).toContainText(/tip-burn|temperature|airflow/i);
    });

    test('T1.4.8: back link navigates back to directory page', async ({ page }) => {
      await page.goto('/plants/crop-lettuce');

      const backLink = page.getByTestId('back-to-directory-link')
        .or(page.getByRole('link', { name: /back/i }));
      await backLink.first().click();

      await expect(page).toHaveURL(/\/(#.*)?$/);
    });
  });

  // =========================================================================
  // Feature Area 5: Common Growing Issues Section
  // =========================================================================
  test.describe('5. Common Growing Issues Section', () => {

    test('T1.5.1: detail page displays Common Issues section heading', async ({ page }) => {
      await page.goto('/plants/crop-tomato');

      const heading = page.getByRole('heading', { name: /common.*issues|troubleshooting/i });
      await expect(heading.first()).toBeVisible();
    });

    test('T1.5.2: displays issue title (e.g. Blossom End Rot)', async ({ page }) => {
      await page.goto('/plants/crop-tomato');

      const issueTitle = page.getByTestId('issue-title')
        .or(page.locator('.issue-title, [data-testid="issue-card"] h3, [data-testid="issue-card"] h4, .issue-card h3, .issue-card h4'))
        .or(page.getByRole('heading', { level: 3 }))
        .or(page.getByRole('heading', { level: 4 }));
      await expect(issueTitle.first()).toContainText(/Blossom End Rot/i);
    });

    test('T1.5.3: displays issue cause description', async ({ page }) => {
      await page.goto('/plants/crop-tomato');

      const cause = page.getByTestId('issue-cause')
        .or(page.locator('.issue-cause, [data-testid="issue-cause"]'))
        .or(page.locator('.issue-card, [data-testid="issue-card"]').filter({ hasText: /cause/i }));
      await expect(cause.first()).toContainText(/calcium deficiency|erratic irrigation/i);
    });

    test('T1.5.4: displays issue recommended resolution description', async ({ page }) => {
      await page.goto('/plants/crop-tomato');

      const resolution = page.getByTestId('issue-resolution')
        .or(page.locator('.issue-resolution, [data-testid="issue-resolution"]'))
        .or(page.locator('.issue-card, [data-testid="issue-card"]').filter({ hasText: /resolution/i }));
      await expect(resolution.first()).toContainText(/stabilize rootzone|calcium levels/i);
    });

    test('T1.5.5: renders issue symptom image or visual container', async ({ page }) => {
      await page.goto('/plants/crop-tomato');

      const issueImg = page.getByTestId('issue-image')
        .or(page.locator('.issue-card img, [data-testid="issue-card"] img'));
      await expect(issueImg.first()).toBeVisible();
    });
  });

  // =========================================================================
  // Feature Area 6: Interactive Unit Converter
  // =========================================================================
  test.describe('6. Interactive Unit Converter', () => {

    test('T1.6.1: clicking Unit Converter button opens converter dialog', async ({ page }) => {
      const converterBtn = page.getByTestId('unit-converter-btn')
        .or(page.getByRole('button', { name: /unit converter|calculator/i }));
      await converterBtn.click();

      const modal = page.getByTestId('unit-converter-modal')
        .or(page.getByRole('dialog'));
      await expect(modal).toBeVisible();
    });

    test('T1.6.2: entering 2.0 in EC calculates cF=20, PPM500=1000, PPM700=1400', async ({ page }) => {
      const converterBtn = page.getByTestId('unit-converter-btn')
        .or(page.getByRole('button', { name: /unit converter|calculator/i }));
      await converterBtn.click();

      const ecInput = page.getByTestId('converter-ec-input')
        .or(page.getByLabel(/^ec\b/i))
        .or(page.locator('input#ec, input[name="ec"]'));
      await ecInput.fill('2.0');

      const cfInput = page.getByTestId('converter-cf-input')
        .or(page.getByLabel(/^cf\b/i))
        .or(page.locator('input#cf, input[name="cf"]'));
      await expect(cfInput).toHaveValue(/^20(\.0+)?$/);

      const ppm500Input = page.getByTestId('converter-ppm500-input')
        .or(page.getByLabel(/500|hanna/i));
      await expect(ppm500Input).toHaveValue(/^1000$/);

      const ppm700Input = page.getByTestId('converter-ppm700-input')
        .or(page.getByLabel(/700|eutech/i));
      await expect(ppm700Input).toHaveValue(/^1400$/);
    });

    test('T1.6.3: entering 15 in cF synchronizes EC=1.5, PPM500=750, PPM700=1050', async ({ page }) => {
      const converterBtn = page.getByTestId('unit-converter-btn')
        .or(page.getByRole('button', { name: /unit converter|calculator/i }));
      await converterBtn.click();

      const cfInput = page.getByTestId('converter-cf-input')
        .or(page.getByLabel(/^cf\b/i));
      await cfInput.fill('15');

      const ecInput = page.getByTestId('converter-ec-input')
        .or(page.getByLabel(/^ec\b/i));
      await expect(ecInput).toHaveValue(/^1\.5$/);

      const ppm500Input = page.getByTestId('converter-ppm500-input')
        .or(page.getByLabel(/500|hanna/i));
      await expect(ppm500Input).toHaveValue(/^750$/);

      const ppm700Input = page.getByTestId('converter-ppm700-input')
        .or(page.getByLabel(/700|eutech/i));
      await expect(ppm700Input).toHaveValue(/^1050$/);
    });

    test('T1.6.4: entering 500 in PPM 500 synchronizes EC=1.0, cF=10, PPM700=700', async ({ page }) => {
      const converterBtn = page.getByTestId('unit-converter-btn')
        .or(page.getByRole('button', { name: /unit converter|calculator/i }));
      await converterBtn.click();

      const ppm500Input = page.getByTestId('converter-ppm500-input')
        .or(page.getByLabel(/500|hanna/i));
      await ppm500Input.fill('500');

      const ecInput = page.getByTestId('converter-ec-input').or(page.getByLabel(/^ec\b/i));
      await expect(ecInput).toHaveValue(/^1(\.0+)?$/);

      const cfInput = page.getByTestId('converter-cf-input').or(page.getByLabel(/^cf\b/i));
      await expect(cfInput).toHaveValue(/^10(\.0+)?$/);

      const ppm700Input = page.getByTestId('converter-ppm700-input').or(page.getByLabel(/700|eutech/i));
      await expect(ppm700Input).toHaveValue(/^700$/);
    });

    test('T1.6.5: entering 1260 in PPM 700 synchronizes EC=1.8, cF=18, PPM500=900', async ({ page }) => {
      const converterBtn = page.getByTestId('unit-converter-btn')
        .or(page.getByRole('button', { name: /unit converter|calculator/i }));
      await converterBtn.click();

      const ppm700Input = page.getByTestId('converter-ppm700-input')
        .or(page.getByLabel(/700|eutech/i));
      await ppm700Input.fill('1260');

      const ecInput = page.getByTestId('converter-ec-input').or(page.getByLabel(/^ec\b/i));
      await expect(ecInput).toHaveValue(/^1\.8$/);

      const cfInput = page.getByTestId('converter-cf-input').or(page.getByLabel(/^cf\b/i));
      await expect(cfInput).toHaveValue(/^18(\.0+)?$/);

      const ppm500Input = page.getByTestId('converter-ppm500-input').or(page.getByLabel(/500|hanna/i));
      await expect(ppm500Input).toHaveValue(/^900$/);
    });

    test('T1.6.6: clicking close button dismisses converter modal', async ({ page }) => {
      const converterBtn = page.getByTestId('unit-converter-btn')
        .or(page.getByRole('button', { name: /unit converter|calculator/i }));
      await converterBtn.click();

      const closeBtn = page.getByTestId('converter-close-btn')
        .or(page.getByRole('button', { name: /close|×/i }));
      await closeBtn.click();

      const modal = page.getByTestId('unit-converter-modal')
        .or(page.getByRole('dialog'));
      await expect(modal).not.toBeVisible();
    });
  });

  // =========================================================================
  // Feature Area 7: Secret Admin Portal & Authentication
  // =========================================================================
  test.describe('7. Secret Admin Portal & Authentication', () => {

    test('T1.7.1: navigating to secret path renders admin login form', async ({ page }) => {
      await page.goto(`/${ADMIN_SECRET_PATH}`);

      const passwordInput = page.getByTestId('admin-password-input')
        .or(page.locator('input[type="password"]'));
      await expect(passwordInput).toBeVisible();

      const loginBtn = page.getByTestId('admin-login-btn')
        .or(page.getByRole('button', { name: /log in|sign in|login/i }));
      await expect(loginBtn).toBeVisible();
    });

    test('T1.7.2: invalid password displays authentication error message', async ({ page }) => {
      await page.goto(`/${ADMIN_SECRET_PATH}`);

      const passwordInput = page.getByTestId('admin-password-input')
        .or(page.locator('input[type="password"]'));
      await passwordInput.fill('wrong_password_attempt');

      const loginBtn = page.getByTestId('admin-login-btn')
        .or(page.getByRole('button', { name: /log in|sign in|login/i }));
      await loginBtn.click();

      const errorMsg = page.getByTestId('admin-login-error')
        .or(page.getByRole('alert'))
        .or(page.getByText(/invalid password|incorrect/i));
      await expect(errorMsg).toBeVisible();
    });

    test('T1.7.3: valid password authenticates admin and displays Admin Dashboard', async ({ page }) => {
      await page.goto(`/${ADMIN_SECRET_PATH}`);

      const passwordInput = page.getByTestId('admin-password-input')
        .or(page.locator('input[type="password"]'));
      await passwordInput.fill(ADMIN_PASSWORD);

      const loginBtn = page.getByTestId('admin-login-btn')
        .or(page.getByRole('button', { name: /log in|sign in|login/i }));
      await loginBtn.click();

      const dashboard = page.getByTestId('admin-dashboard')
        .or(page.getByText(/admin dashboard|crop management|total crops/i));
      await expect(dashboard.first()).toBeVisible();
    });

    test('T1.7.4: direct navigation to /admin returns HTTP 404', async ({ page }) => {
      const response = await page.goto('/admin');
      expect(response?.status()).toBe(404);
    });

    test('T1.7.5: direct navigation to /dashboard returns HTTP 404', async ({ page }) => {
      const response = await page.goto('/dashboard');
      expect(response?.status()).toBe(404);
    });

    test('T1.7.6: logout action clears session and re-displays login form', async ({ page }) => {
      await page.goto(`/${ADMIN_SECRET_PATH}`);
      const passwordInput = page.getByTestId('admin-password-input')
        .or(page.locator('input[type="password"]'));
      
      if (await passwordInput.isVisible()) {
        await passwordInput.fill(ADMIN_PASSWORD);
        await page.getByTestId('admin-login-btn').or(page.getByRole('button', { name: /log in|sign in|login/i })).click();
      }

      const logoutBtn = page.getByTestId('admin-logout-btn')
        .or(page.getByRole('button', { name: /logout|sign out/i }));
      await expect(logoutBtn).toBeVisible();
      await logoutBtn.click();

      await expect(passwordInput).toBeVisible();
    });

    test('T1.7.7: clicking secretly clickable footer text navigates to secret admin portal', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      const footer = page.locator('footer');
      await expect(footer).toBeVisible();

      // Locate the secretly clickable trigger in the footer
      const secretTrigger = footer.getByTestId('footer-admin-link')
        .or(footer.getByRole('button', { name: /Hydroponic Database System/i }));
      await expect(secretTrigger).toBeVisible();

      // Verify that the footer text does not leak the secret path in href or DOM
      await expect(secretTrigger).not.toHaveAttribute('href');
      const pageContent = await page.content();
      expect(pageContent).not.toContain(ADMIN_SECRET_PATH);

      // Requirement R1: trigger appears as normal text without visible link styling or underline
      const textDecoration = await secretTrigger.evaluate((el) => {
        return window.getComputedStyle(el).textDecorationLine;
      });
      expect(textDecoration).toBe('none');

      const cursor = await secretTrigger.evaluate((el) => {
        return window.getComputedStyle(el).cursor;
      });
      expect(cursor).toBe('default');

      // Requirement R2: clicking it opens modal, fill password & submit navigates to /${ADMIN_SECRET_PATH} and shows dashboard
      await secretTrigger.click();

      const modalPasswordInput = page.getByTestId('admin-password-input');
      await expect(modalPasswordInput).toBeVisible();
      await modalPasswordInput.fill(ADMIN_PASSWORD);
      await page.getByTestId('admin-login-btn').click();

      await page.waitForURL(new RegExp(`/${ADMIN_SECRET_PATH}`));

      const adminDashboard = page.getByTestId('admin-dashboard')
        .or(page.getByText(/admin dashboard|crop management|total crops/i));
      await expect(adminDashboard.first()).toBeVisible();
    });
  });

  // =========================================================================
  // Feature Area 8: Admin CRUD, Bulk Actions & Seeding
  // =========================================================================
  test.describe('8. Admin CRUD & Bulk Actions', () => {

    test.beforeEach(async ({ page }) => {
      // Ensure admin is logged in
      await page.goto(`/${ADMIN_SECRET_PATH}`);
      const passwordInput = page.getByTestId('admin-password-input')
        .or(page.locator('input[type="password"]'));
      
      if (await passwordInput.isVisible()) {
        await passwordInput.fill(ADMIN_PASSWORD);
        await page.getByTestId('admin-login-btn').or(page.getByRole('button', { name: /log in|sign in|login/i })).click();
      }
    });

    test('T1.8.1: admin can click Add Crop and open PlantFormModal', async ({ page }) => {
      const addCropBtn = page.getByTestId('add-plant-btn')
        .or(page.getByRole('button', { name: /add (crop|plant)|new (crop|plant)/i }));
      await addCropBtn.click();

      const modal = page.getByTestId('plant-form-modal')
        .or(page.getByRole('dialog'));
      await expect(modal).toBeVisible();

      const nameInput = page.getByTestId('plant-name-input')
        .or(page.getByLabel(/plant name|crop name|name/i));
      await expect(nameInput).toBeVisible();
    });

    test('T1.8.2: live calculation preview updates derived nutrient values in modal', async ({ page }) => {
      const addCropBtn = page.getByTestId('add-plant-btn')
        .or(page.getByRole('button', { name: /add (crop|plant)|new (crop|plant)/i }));
      await addCropBtn.click();

      const ecMinInput = page.getByTestId('plant-ec-min-input')
        .or(page.getByLabel(/ec min/i));
      await ecMinInput.fill('1.5');

      const ecMaxInput = page.getByTestId('plant-ec-max-input')
        .or(page.getByLabel(/ec max/i));
      await ecMaxInput.fill('2.5');

      const preview = page.getByTestId('live-calculation-preview')
        .or(page.locator('.calc-preview, .live-preview, [data-testid="calculation-preview"]'));
      await expect(preview.first()).toContainText(/15\s*-\s*25\s*cF|750\s*-\s*1250\s*PPM/i);
    });

    test('T1.8.3: Seed Database button is not present on admin interface', async ({ page }) => {
      const seedBtn = page.getByTestId('seed-database-btn')
        .or(page.getByRole('button', { name: /seed database|seed crops/i }));
      await expect(seedBtn).toHaveCount(0);
    });

    test('T1.8.4: Export JSON button downloads crop data file', async ({ page }) => {
      const exportJsonBtn = page.getByTestId('export-json-btn')
        .or(page.getByRole('button', { name: /export json/i }));
      await expect(exportJsonBtn).toBeVisible();

      const downloadPromise = page.waitForEvent('download');
      await exportJsonBtn.click();
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.json$/i);
    });

    test('T1.8.5: Export CSV button downloads CSV data file', async ({ page }) => {
      const exportCsvBtn = page.getByTestId('export-csv-btn')
        .or(page.getByRole('button', { name: /export csv/i }));
      await expect(exportCsvBtn).toBeVisible();

      const downloadPromise = page.waitForEvent('download');
      await exportCsvBtn.click();
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.csv$/i);
    });
  });
});
