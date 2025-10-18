/**
 * Authentication Module
 * Handles Amazon.com login, 2FA detection, and authentication verification
 */

/**
 * Executes Amazon login flow
 * @param {import('playwright').Page} page - Playwright page instance
 * @param {string} email - Amazon account email
 * @param {string} password - Amazon account password
 * @returns {Promise<void>}
 */
async function login(page, email, password) {
  // Navigate to Amazon.com
  await page.goto('https://www.amazon.com/', { waitUntil: 'domcontentloaded' });

  console.log('Logging in to Amazon.com...');

  // Click the "Sign in" button in the navigation bar
  // Selector strategy: Use ID attribute (most stable)
  await page.click('#nav-link-accountList');

  // Wait for email input field to be visible
  // Fallback selectors: #ap_email, input[name="email"], input[type="email"]
  try {
    await page.waitForSelector('#ap_email', { state: 'visible', timeout: 10000 });
  } catch (error) {
    // Try fallback selector
    await page.waitForSelector('input[name="email"]', { state: 'visible', timeout: 5000 });
  }

  // Fill in email address
  await page.fill('#ap_email', email);

  // Click the "Continue" button
  // Fallback selectors: #continue, input[type="submit"], button[type="submit"]
  await page.click('#continue');

  // Wait for password input field
  // Selector: #ap_password is Amazon's standard ID for password field
  await page.waitForSelector('#ap_password', { state: 'visible', timeout: 10000 });

  // Fill in password
  await page.fill('#ap_password', password);

  // Click "Sign in" button
  // Selector: #signInSubmit is Amazon's standard ID for sign-in submit button
  await page.click('#signInSubmit');

  // Wait for navigation to complete
  await page.waitForLoadState('networkidle');
}

/**
 * Detects if Amazon is requesting 2FA/CAPTCHA authentication
 * @param {import('playwright').Page} page - Playwright page instance
 * @returns {Promise<boolean>} True if 2FA/CAPTCHA detected
 */
async function detect2FA(page) {
  // Check for multiple 2FA indicators
  const indicators = [
    '#auth-mfa-otpcode', // OTP code input field
    'input[name="otpCode"]', // Alternative OTP field
    'input[name="code"]', // Generic code field
    'form[name="signIn"]', // 2FA sign-in form
  ];

  // Also check for text indicators
  const textIndicators = [
    'Two-Step Verification',
    'Enter OTP',
    'Authentication required',
    'Verification code',
  ];

  // Check for element-based indicators
  for (const selector of indicators) {
    const element = await page.$(selector);
    if (element) {
      return true;
    }
  }

  // Check for text-based indicators
  const pageContent = await page.content();
  for (const text of textIndicators) {
    if (pageContent.includes(text)) {
      return true;
    }
  }

  // Check for CAPTCHA
  const captchaSelectors = [
    '#captchacharacters', // Amazon CAPTCHA input
    'img[src*="captcha"]', // CAPTCHA image
    'img[alt*="captcha"]', // CAPTCHA image by alt text
  ];

  for (const selector of captchaSelectors) {
    const element = await page.$(selector);
    if (element) {
      return true;
    }
  }

  return false;
}

/**
 * Waits indefinitely for user to manually complete 2FA
 * Displays clear console instructions
 * @param {import('playwright').Page} page - Playwright page instance
 * @returns {Promise<void>}
 */
async function waitFor2FA(page) {
  console.log('\n==========================================');
  console.log('2FA REQUIRED: Please complete the two-factor authentication in the browser');
  console.log('Waiting for manual 2FA completion...');
  console.log('(Press Ctrl+C to cancel)');
  console.log('==========================================\n');

  // Poll for successful authentication every 2 seconds
  const pollInterval = 2000;
  const maxWaitTime = 5 * 60 * 1000; // 5 minutes maximum
  const startTime = Date.now();

  while (true) {
    // Check if we've exceeded maximum wait time
    if (Date.now() - startTime > maxWaitTime) {
      throw new Error('2FA timeout: Maximum wait time of 5 minutes exceeded');
    }

    // Check if authentication is now successful
    const isAuthenticated = await verifyAuthentication(page);
    if (isAuthenticated) {
      console.log('2FA completed successfully!\n');
      return;
    }

    // Wait before checking again
    await page.waitForTimeout(pollInterval);
  }
}

/**
 * Verifies that user is successfully authenticated to Amazon
 * @param {import('playwright').Page} page - Playwright page instance
 * @returns {Promise<boolean>} True if authenticated
 */
async function verifyAuthentication(page) {
  // Check for authenticated user indicators
  // Amazon shows "Hello, [Name]" when logged in
  const accountMenu = await page.$('#nav-link-accountList');

  if (!accountMenu) {
    return false;
  }

  // Check if the account menu contains user greeting (not "Sign in")
  const accountText = await accountMenu.textContent();

  // If it says "Sign in", user is not authenticated
  if (accountText && accountText.includes('Sign in')) {
    return false;
  }

  // If it contains "Hello" or user name, user is authenticated
  if (accountText && (accountText.includes('Hello') || accountText.includes('Account'))) {
    return true;
  }

  // Additional check: look for orders link (only visible when authenticated)
  const ordersLink = await page.$('#nav-orders');
  if (ordersLink) {
    return true;
  }

  return false;
}

/**
 * Manual authentication workflow
 *
 * Navigates to Amazon.com home page and waits for the user to manually complete
 * authentication in the visible browser window. The function polls every 3 seconds
 * to detect when authentication is complete, then returns control to the caller.
 *
 * This function is designed for users who prefer to enter credentials manually,
 * encounter automated login failures, or have complex 2FA requirements.
 *
 * @param {import('playwright').Page} page - Playwright page instance
 * @returns {Promise<void>} Resolves when user successfully authenticates
 * @throws {Error} If authentication not completed within 10 minutes (timeout)
 * @throws {Error} If browser is closed before authentication completes
 *
 * @example
 * // Basic usage with manual authentication
 * await manualLogin(page);
 * console.log('User authenticated successfully!');
 *
 * @see {@link verifyAuthentication} for the authentication detection logic
 *
 * Polling Configuration:
 * - Poll interval: 3 seconds (balances responsiveness with resource usage)
 * - Maximum wait time: 10 minutes (generous timeout for complex 2FA scenarios)
 * - Console feedback: Status message printed on each poll iteration
 *
 * User Workflow:
 * 1. Browser opens showing Amazon.com home page
 * 2. User clicks "Sign in" and enters credentials manually
 * 3. User completes any 2FA/CAPTCHA challenges
 * 4. Script detects authenticated state via polling
 * 5. Function returns and script continues to download invoices
 */
async function manualLogin(page) {
  // Navigate to Amazon home page
  await page.goto('https://www.amazon.com/', { waitUntil: 'domcontentloaded' });

  // Display clear instructions to the user
  console.log('\n=================================================');
  console.log('MANUAL AUTHENTICATION REQUIRED');
  console.log('=================================================');
  console.log('Please complete the following steps:\n');
  console.log('1. The browser window is now open showing Amazon.com');
  console.log('2. Click "Sign in" in the browser');
  console.log('3. Enter your email and password manually');
  console.log('4. Complete any 2FA/CAPTCHA challenges');
  console.log('5. Wait for the Amazon home page to fully load');
  console.log('6. Do NOT close the browser window\n');
  console.log('The script will automatically detect when you\'re logged in');
  console.log('and continue downloading invoices.\n');
  console.log('Waiting for authentication... (Press Ctrl+C to cancel)');
  console.log('=================================================\n');

  // Polling configuration
  // 3 seconds provides good balance between responsiveness and resource usage
  const pollInterval = 3000;
  // 10 minutes allows for complex 2FA scenarios (SMS delays, authenticator app lookups)
  const maxWaitTime = 10 * 60 * 1000; // 10 minutes maximum
  const startTime = Date.now();

  // Polling loop: Check authentication status every 3 seconds
  while (true) {
    // Check if maximum wait time has been exceeded
    if (Date.now() - startTime > maxWaitTime) {
      throw new Error('Manual authentication timeout: Maximum wait time of 10 minutes exceeded');
    }

    // Check if user has successfully authenticated
    // verifyAuthentication() checks for authenticated user indicators on the page
    console.log('Checking authentication status...');
    const isAuthenticated = await verifyAuthentication(page);

    if (isAuthenticated) {
      console.log('Authentication detected!');
      return; // Exit function - authentication successful
    }

    // Wait 3 seconds before checking again
    // This prevents excessive resource usage while still feeling responsive
    await page.waitForTimeout(pollInterval);
  }
}

module.exports = {
  login,
  manualLogin,
  detect2FA,
  waitFor2FA,
  verifyAuthentication,
};
