/**
 * Strategic Gap Tests for Manual Authentication Feature
 * Testing-engineer Task Group 5.3
 *
 * These tests cover critical edge cases and scenarios not covered by
 * the initial implementation tests (Task Groups 1-4).
 *
 * Focus areas:
 * - Timeout handling after 10 minutes
 * - Already-authenticated browser sessions
 * - Error message clarity
 */

const { test, expect } = require('@playwright/test');
const auth = require('../lib/auth');

test.describe('Manual Authentication Edge Cases', () => {
  // Test 1: Manual auth timeout after 10 minutes
  test('should timeout after 10 minutes when authentication is not completed', async ({ page }) => {
    // Mock Amazon homepage that stays unauthenticated
    await page.route('https://www.amazon.com/', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `
          <!DOCTYPE html>
          <html>
            <body>
              <a id="nav-link-accountList" href="/ap/signin">Sign in</a>
            </body>
          </html>
        `
      });
    });

    // Navigate to unauthenticated page
    await page.goto('https://www.amazon.com/');

    // Mock Date.now() to simulate time passing faster
    const originalDateNow = Date.now;
    let mockTime = Date.now();
    Date.now = () => mockTime;

    try {
      // Start manualLogin - it should timeout
      const manualLoginPromise = auth.manualLogin(page);

      // Advance time by 10 minutes + 1 second (600001ms)
      await page.waitForTimeout(100); // Let initial poll happen
      mockTime += (10 * 60 * 1000) + 1000; // 10 minutes + 1 second

      // Expect timeout error
      await expect(manualLoginPromise).rejects.toThrow(
        'Manual authentication timeout: Maximum wait time of 10 minutes exceeded'
      );
    } finally {
      // Restore original Date.now
      Date.now = originalDateNow;
    }
  });

  // Test 2: Manual auth with already-authenticated browser session
  test('should detect existing authentication and proceed immediately', async ({ page }) => {
    // Mock Amazon homepage with already-authenticated state
    await page.route('https://www.amazon.com/', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `
          <!DOCTYPE html>
          <html>
            <body>
              <div id="nav-link-accountList">Hello, Test User</div>
              <a id="nav-orders" href="/orders">Returns & Orders</a>
            </body>
          </html>
        `
      });
    });

    // Capture console output to verify no unnecessary waiting
    const consoleOutput = [];
    const originalLog = console.log;
    console.log = (...args) => {
      consoleOutput.push(args.join(' '));
      originalLog(...args);
    };

    const startTime = Date.now();

    try {
      // Should complete immediately without polling
      await auth.manualLogin(page);

      const endTime = Date.now();
      const elapsedTime = endTime - startTime;

      // Should complete in less than 1 second (no polling needed)
      expect(elapsedTime).toBeLessThan(1000);

      // Verify authentication was detected
      const output = consoleOutput.join('\n');
      expect(output).toContain('Checking authentication status...');
      expect(output).toContain('Authentication detected!');
    } finally {
      console.log = originalLog;
    }
  });

  // Test 3: Error message quality for timeout scenario
  test('should provide clear error message on timeout', async ({ page }) => {
    // Mock unauthenticated page
    await page.route('https://www.amazon.com/', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `
          <!DOCTYPE html>
          <html>
            <body>
              <a id="nav-link-accountList" href="/ap/signin">Sign in</a>
            </body>
          </html>
        `
      });
    });

    await page.goto('https://www.amazon.com/');

    // Mock time to force timeout
    const originalDateNow = Date.now;
    let mockTime = Date.now();
    Date.now = () => mockTime;

    try {
      const manualLoginPromise = auth.manualLogin(page);

      // Advance time to trigger timeout
      await page.waitForTimeout(100);
      mockTime += (10 * 60 * 1000) + 1000;

      // Verify error message is clear and helpful
      try {
        await manualLoginPromise;
        throw new Error('Should have thrown timeout error');
      } catch (error) {
        expect(error.message).toContain('timeout');
        expect(error.message).toContain('10 minutes');
        expect(error.message).toContain('Manual authentication');
      }
    } finally {
      Date.now = originalDateNow;
    }
  });

  // Test 4: Authentication polling continues despite page navigation
  test('should continue polling even if user navigates during authentication', async ({ page }) => {
    let callCount = 0;

    // Mock Amazon - first call unauthenticated, second call authenticated
    await page.route('https://www.amazon.com/', async route => {
      callCount++;
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: callCount === 1
          ? '<a id="nav-link-accountList" href="/ap/signin">Sign in</a>'
          : '<div id="nav-link-accountList">Hello, User</div><a id="nav-orders" href="/orders">Orders</a>'
      });
    });

    await page.goto('https://www.amazon.com/');

    // Simulate user navigating to login page during polling
    setTimeout(async () => {
      await page.setContent(`
        <!DOCTYPE html>
        <html>
          <body>
            <div id="nav-link-accountList">Hello, Test User</div>
            <a id="nav-orders" href="/orders">Returns & Orders</a>
          </body>
        </html>
      `);
    }, 4000);

    // Should eventually detect authentication
    await auth.manualLogin(page);
    expect(page.url()).toContain('amazon.com');
  });

  // Test 5: Verify console instructions are complete and accurate
  test('should display all 6 required steps in console instructions', async ({ page }) => {
    // Mock authenticated page for quick completion
    await page.route('https://www.amazon.com/', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `
          <!DOCTYPE html>
          <html>
            <body>
              <div id="nav-link-accountList">Hello, Test User</div>
              <a id="nav-orders" href="/orders">Returns & Orders</a>
            </body>
          </html>
        `
      });
    });

    // Capture console output
    const consoleOutput = [];
    const originalLog = console.log;
    console.log = (...args) => {
      consoleOutput.push(args.join(' '));
      originalLog(...args);
    };

    try {
      await auth.manualLogin(page);

      const output = consoleOutput.join('\n');

      // Verify all required instruction steps are present
      expect(output).toContain('1. The browser window is now open showing Amazon.com');
      expect(output).toContain('2. Click "Sign in" in the browser');
      expect(output).toContain('3. Enter your email and password manually');
      expect(output).toContain('4. Complete any 2FA/CAPTCHA challenges');
      expect(output).toContain('5. Wait for the Amazon home page to fully load');
      expect(output).toContain('6. Do NOT close the browser window');

      // Verify key messaging
      expect(output).toContain('MANUAL AUTHENTICATION REQUIRED');
      expect(output).toContain('automatically detect when you\'re logged in');
      expect(output).toContain('Press Ctrl+C to cancel');
    } finally {
      console.log = originalLog;
    }
  });
});
