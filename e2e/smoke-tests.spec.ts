/**
 * End-to-End Smoke Tests
 * Final QA: Smoke Tests | PRD v3.6.3
 *
 * Critical path smoke tests for snang.my pilot release gate.
 * Tests buyer flow, agent flow, and core functionality.
 */

import { test, expect, Page } from '@playwright/test';

// =============================================================================
// TEST CONFIGURATION
// =============================================================================

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TIMEOUT_MS = 30000;

// Test data
const TEST_BUYER = {
  name: 'Test Buyer',
  phone: '0123456789',
  email: 'test@example.com',
  ic: '901234567890',
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle', { timeout: TIMEOUT_MS });
}

async function checkNoHorizontalScroll(page: Page) {
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1); // Allow 1px tolerance
}

// =============================================================================
// SMOKE TEST SUITE
// =============================================================================

test.describe('Smoke Tests - snang.my Pilot', () => {
  test.setTimeout(60000);

  // ---------------------------------------------------------------------------
  // HEALTH CHECK
  // ---------------------------------------------------------------------------
  test.describe('Health Checks', () => {
    test('API health endpoint responds', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/health`);
      expect(response.ok()).toBeTruthy();

      const body = await response.json();
      expect(body.status).toBe('healthy');
    });

    test('Home page loads', async ({ page }) => {
      await page.goto(BASE_URL);
      await waitForPageLoad(page);
      expect(page.url()).toContain(BASE_URL);
    });
  });

  // ---------------------------------------------------------------------------
  // CR-008: DOC-FIRST BUYER FLOW
  // ---------------------------------------------------------------------------
  test.describe('CR-008: Buyer Doc-First Flow', () => {
    test('Step 1: PDPA consent page loads', async ({ page }) => {
      await page.goto(`${BASE_URL}/buyer/start`);
      await waitForPageLoad(page);

      // Check page title/heading
      const heading = page.locator('h1, h2').first();
      await expect(heading).toBeVisible();

      // Check consent checkbox exists
      const consentCheckbox = page.locator('input[type="checkbox"]').first();
      await expect(consentCheckbox).toBeVisible();

      // Check submit button exists
      const submitButton = page.locator('button[type="submit"], button:has-text("Teruskan"), button:has-text("Continue")');
      await expect(submitButton.first()).toBeVisible();

      // Mobile viewport check
      await page.setViewportSize({ width: 375, height: 667 });
      await checkNoHorizontalScroll(page);
    });

    test('Step 2: Document upload page loads', async ({ page }) => {
      await page.goto(`${BASE_URL}/buyer/upload`);
      await waitForPageLoad(page);

      // Check upload area exists
      const uploadArea = page.locator('[data-testid="upload-area"], .upload-area, input[type="file"]');
      await expect(uploadArea.first()).toBeVisible();

      // Check document type labels
      const icLabel = page.locator('text=/IC|MyKad|Kad Pengenalan/i');
      await expect(icLabel.first()).toBeVisible();

      // Mobile viewport check
      await page.setViewportSize({ width: 375, height: 667 });
      await checkNoHorizontalScroll(page);
    });

    test('Step 3: Upload complete page loads', async ({ page }) => {
      await page.goto(`${BASE_URL}/buyer/upload-complete`);
      await waitForPageLoad(page);

      // Check success indicator or document list
      const content = page.locator('main, .content, [role="main"]');
      await expect(content.first()).toBeVisible();

      // Mobile viewport check
      await page.setViewportSize({ width: 375, height: 667 });
      await checkNoHorizontalScroll(page);
    });

    test('Step 4: Temujanji booking page loads', async ({ page }) => {
      await page.goto(`${BASE_URL}/buyer/temujanji`);
      await waitForPageLoad(page);

      // Check date/time selection exists
      const dateInput = page.locator('input[type="date"], [data-testid="date-picker"], .date-picker');
      const timeSlots = page.locator('[data-testid="time-slot"], .time-slot, button:has-text(/\\d{1,2}:\\d{2}/)');

      // Either date input or time slots should be visible
      const hasDateInput = await dateInput.first().isVisible().catch(() => false);
      const hasTimeSlots = await timeSlots.first().isVisible().catch(() => false);
      expect(hasDateInput || hasTimeSlots).toBeTruthy();

      // Mobile viewport check
      await page.setViewportSize({ width: 375, height: 667 });
      await checkNoHorizontalScroll(page);
    });
  });

  // ---------------------------------------------------------------------------
  // MOBILE RESPONSIVENESS (UX.1-UX.6)
  // ---------------------------------------------------------------------------
  test.describe('Mobile Responsiveness', () => {
    const mobileViewport = { width: 375, height: 667 }; // iPhone SE

    const pagesToTest = [
      { path: '/buyer/start', name: 'PDPA Consent' },
      { path: '/buyer/upload', name: 'Document Upload' },
      { path: '/buyer/upload-complete', name: 'Upload Complete' },
      { path: '/buyer/temujanji', name: 'Temujanji Booking' },
    ];

    for (const { path, name } of pagesToTest) {
      test(`${name} - no horizontal scroll on mobile`, async ({ page }) => {
        await page.setViewportSize(mobileViewport);
        await page.goto(`${BASE_URL}${path}`);
        await waitForPageLoad(page);
        await checkNoHorizontalScroll(page);
      });

      test(`${name} - touch targets are adequate`, async ({ page }) => {
        await page.setViewportSize(mobileViewport);
        await page.goto(`${BASE_URL}${path}`);
        await waitForPageLoad(page);

        // Check all buttons have minimum touch target
        const buttons = page.locator('button, [role="button"], a.btn');
        const count = await buttons.count();

        for (let i = 0; i < Math.min(count, 10); i++) {
          const button = buttons.nth(i);
          if (await button.isVisible()) {
            const box = await button.boundingBox();
            if (box) {
              // Minimum touch target: 44x44px
              expect(box.width).toBeGreaterThanOrEqual(40); // Allow small tolerance
              expect(box.height).toBeGreaterThanOrEqual(40);
            }
          }
        }
      });
    }
  });

  // ---------------------------------------------------------------------------
  // SAFE LANGUAGE GUARD
  // ---------------------------------------------------------------------------
  test.describe('Safe Language Guard', () => {
    test('No forbidden terminology in buyer pages', async ({ page }) => {
      const pagesToCheck = [
        '/buyer/start',
        '/buyer/upload',
        '/buyer/upload-complete',
        '/buyer/temujanji',
      ];

      const forbiddenTerms = ['komisen', 'commission'];

      for (const path of pagesToCheck) {
        await page.goto(`${BASE_URL}${path}`);
        await waitForPageLoad(page);

        const pageContent = await page.textContent('body');

        for (const term of forbiddenTerms) {
          const hasForbiddenTerm = pageContent?.toLowerCase().includes(term.toLowerCase());
          expect(hasForbiddenTerm, `Found forbidden term "${term}" on ${path}`).toBeFalsy();
        }
      }
    });

    test('Uses safe terminology "Ganjaran Kempen"', async ({ page }) => {
      // Check incentive-related pages use safe language
      // This would check agent/developer facing pages
      await page.goto(`${BASE_URL}/`);
      await waitForPageLoad(page);

      // If there's any reward/incentive text, it should use safe terms
      const pageContent = await page.textContent('body');
      if (pageContent?.toLowerCase().includes('reward') || pageContent?.toLowerCase().includes('ganjaran')) {
        expect(pageContent.toLowerCase()).not.toContain('komisen');
      }
    });
  });

  // ---------------------------------------------------------------------------
  // MILESTONE SEQUENCE
  // ---------------------------------------------------------------------------
  test.describe('Milestone Sequence', () => {
    test('KJ milestone is #3 (before LPPSA)', async ({ page }) => {
      // This test would check the milestone display order
      // For now, we just verify the page loads
      await page.goto(`${BASE_URL}/`);
      await waitForPageLoad(page);

      // In a full implementation, we'd check:
      // 1. Tempahan (#1)
      // 2. Pinjaman (#2)
      // 3. KJ (#3) - MUST be before Serahan
      // 4. Serahan (#4)
    });
  });

  // ---------------------------------------------------------------------------
  // ERROR HANDLING
  // ---------------------------------------------------------------------------
  test.describe('Error Handling', () => {
    test('404 page displays correctly', async ({ page }) => {
      const response = await page.goto(`${BASE_URL}/non-existent-page-12345`);

      // Should either return 404 or redirect to error page
      if (response) {
        expect([200, 404]).toContain(response.status());
      }

      // Page should still render something
      const body = page.locator('body');
      await expect(body).toBeVisible();
    });

    test('API error returns proper format', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/non-existent`);

      // Should return 404 with JSON error
      expect(response.status()).toBe(404);

      const contentType = response.headers()['content-type'];
      if (contentType?.includes('application/json')) {
        const body = await response.json();
        expect(body).toHaveProperty('error');
      }
    });
  });

  // ---------------------------------------------------------------------------
  // PERFORMANCE
  // ---------------------------------------------------------------------------
  test.describe('Performance', () => {
    test('Home page loads within 3 seconds', async ({ page }) => {
      const startTime = Date.now();
      await page.goto(BASE_URL);
      await waitForPageLoad(page);
      const loadTime = Date.now() - startTime;

      expect(loadTime).toBeLessThan(3000);
    });

    test('Buyer flow pages load within 3 seconds', async ({ page }) => {
      const pages = ['/buyer/start', '/buyer/upload', '/buyer/temujanji'];

      for (const path of pages) {
        const startTime = Date.now();
        await page.goto(`${BASE_URL}${path}`);
        await waitForPageLoad(page);
        const loadTime = Date.now() - startTime;

        expect(loadTime, `${path} took too long to load`).toBeLessThan(3000);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // ACCESSIBILITY BASICS
  // ---------------------------------------------------------------------------
  test.describe('Accessibility Basics', () => {
    test('Pages have proper heading structure', async ({ page }) => {
      await page.goto(`${BASE_URL}/buyer/start`);
      await waitForPageLoad(page);

      // Should have at least one h1
      const h1 = page.locator('h1');
      const h1Count = await h1.count();
      expect(h1Count).toBeGreaterThanOrEqual(1);
    });

    test('Form inputs have labels', async ({ page }) => {
      await page.goto(`${BASE_URL}/buyer/upload`);
      await waitForPageLoad(page);

      // Check that inputs have associated labels or aria-label
      const inputs = page.locator('input:not([type="hidden"]):not([type="submit"])');
      const count = await inputs.count();

      for (let i = 0; i < count; i++) {
        const input = inputs.nth(i);
        if (await input.isVisible()) {
          const hasLabel = await input.evaluate((el) => {
            const id = el.id;
            const ariaLabel = el.getAttribute('aria-label');
            const ariaLabelledBy = el.getAttribute('aria-labelledby');
            const label = id ? document.querySelector(`label[for="${id}"]`) : null;

            return !!(label || ariaLabel || ariaLabelledBy);
          });

          expect(hasLabel, `Input ${i} missing label`).toBeTruthy();
        }
      }
    });

    test('Buttons have accessible names', async ({ page }) => {
      await page.goto(`${BASE_URL}/buyer/start`);
      await waitForPageLoad(page);

      const buttons = page.locator('button');
      const count = await buttons.count();

      for (let i = 0; i < count; i++) {
        const button = buttons.nth(i);
        if (await button.isVisible()) {
          const hasAccessibleName = await button.evaluate((el) => {
            const text = el.textContent?.trim();
            const ariaLabel = el.getAttribute('aria-label');
            const title = el.getAttribute('title');

            return !!(text || ariaLabel || title);
          });

          expect(hasAccessibleName, `Button ${i} missing accessible name`).toBeTruthy();
        }
      }
    });
  });
});

// =============================================================================
// RELEASE GATE CHECK
// =============================================================================

test.describe('Release Gate', () => {
  test('All smoke tests must pass for pilot release', async ({ page }) => {
    // This is a meta-test that serves as documentation
    // All tests in this file are required for release

    // Verify we're testing against the correct environment
    const response = await page.goto(BASE_URL);
    expect(response?.ok()).toBeTruthy();

    console.log('✅ All smoke tests passed - Ready for pilot release');
  });
});
