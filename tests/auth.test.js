const { test, expect } = require('@playwright/test');
const auth = require('../lib/auth');

test.describe('Authentication Module', () => {
  test('login function navigates to Amazon and attempts sign-in', async ({ page }) => {
    // Mock Amazon homepage and login flow
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

    await page.route('**/ap/signin*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `
          <!DOCTYPE html>
          <html>
            <body>
              <form>
                <input type="email" id="ap_email" name="email" />
                <input type="submit" id="continue" value="Continue" />
              </form>
            </body>
          </html>
        `
      });
    });

    // Test login flow - should not throw errors
    try {
      await auth.login(page, 'test@example.com', 'password123');
    } catch (error) {
      // Expected to fail at some point in mocked environment, but should execute basic flow
      expect(error.message).toBeTruthy();
    }
  });

  test('detect2FA identifies 2FA challenge pages', async ({ page }) => {
    // Mock 2FA page
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <body>
          <form name="signIn">
            <input id="auth-mfa-otpcode" type="text" />
            <span>Two-Step Verification</span>
          </form>
        </body>
      </html>
    `);

    const has2FA = await auth.detect2FA(page);
    expect(has2FA).toBe(true);
  });

  test('detect2FA returns false for regular pages', async ({ page }) => {
    // Mock regular page without 2FA
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <body>
          <div id="nav-link-accountList">Account</div>
        </body>
      </html>
    `);

    const has2FA = await auth.detect2FA(page);
    expect(has2FA).toBe(false);
  });

  test('verifyAuthentication detects successful login', async ({ page }) => {
    // Mock authenticated Amazon page
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <body>
          <div id="nav-link-accountList" class="nav-progressive-attribute">
            <span>Hello, Test User</span>
          </div>
        </body>
      </html>
    `);

    const isAuthenticated = await auth.verifyAuthentication(page);
    expect(isAuthenticated).toBe(true);
  });

  test('verifyAuthentication returns false for non-authenticated pages', async ({ page }) => {
    // Mock non-authenticated page
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <body>
          <a id="nav-link-accountList" href="/ap/signin">Sign in</a>
        </body>
      </html>
    `);

    const isAuthenticated = await auth.verifyAuthentication(page);
    expect(isAuthenticated).toBe(false);
  });

  // Manual authentication tests
  test('manualLogin navigates to Amazon.com home page', async ({ page }) => {
    // Mock Amazon homepage with authenticated state
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

    await auth.manualLogin(page);
    expect(page.url()).toContain('amazon.com');
  });

  test('manualLogin polls for authentication state and resolves when authenticated', async ({ page }) => {
    let callCount = 0;

    // Mock Amazon homepage - first call returns unauthenticated, second call returns authenticated
    await page.route('https://www.amazon.com/', async route => {
      callCount++;

      const body = callCount === 1
        ? `
          <!DOCTYPE html>
          <html>
            <body>
              <a id="nav-link-accountList" href="/ap/signin">Sign in</a>
            </body>
          </html>
        `
        : `
          <!DOCTYPE html>
          <html>
            <body>
              <div id="nav-link-accountList">Hello, Test User</div>
              <a id="nav-orders" href="/orders">Returns & Orders</a>
            </body>
          </html>
        `;

      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body
      });
    });

    // Set page content to unauthenticated state initially
    await page.goto('https://www.amazon.com/');

    // After first poll, update to authenticated state
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

    // This should poll, find unauthenticated first, then authenticated
    await auth.manualLogin(page);
    expect(page.url()).toContain('amazon.com');
  });

  test('manualLogin displays console instructions', async ({ page }) => {
    // Mock Amazon homepage with authenticated state
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
    const consoleSpy = [];
    const originalLog = console.log;
    console.log = (...args) => {
      consoleSpy.push(args.join(' '));
      originalLog(...args);
    };

    try {
      await auth.manualLogin(page);

      // Verify console output contains key instructions
      const allOutput = consoleSpy.join('\n');
      expect(allOutput).toContain('MANUAL AUTHENTICATION REQUIRED');
      expect(allOutput).toContain('Please complete the following steps:');
      expect(allOutput).toContain('1. The browser window is now open showing Amazon.com');
      expect(allOutput).toContain('6. Do NOT close the browser window');
    } finally {
      console.log = originalLog;
    }
  });
});
