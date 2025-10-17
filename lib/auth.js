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
  await page.goto('https://www.amazon.com/', { waitUntil: 'networkidle' });

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

module.exports = {
  login,
  detect2FA,
  waitFor2FA,
  verifyAuthentication,
};
