# Specification: Manual Authentication CLI Parameter

## Goal

Add a `--manual-auth` CLI parameter to the Amazon Invoice Automation tool that bypasses automated login and instead allows users to manually authenticate in a visible browser window. This feature enables users who prefer manual authentication or encounter automated login issues to complete authentication themselves while still benefiting from automated invoice downloading.

## User Stories

- As a user experiencing automated login failures, I want to manually authenticate to Amazon so that I can still use the automated invoice download functionality
- As a user with complex 2FA requirements, I want to handle authentication manually in a visible browser so that I can complete all authentication steps myself
- As a security-conscious user, I want the option to manually enter my credentials in a visible browser so that I can see exactly what's happening during authentication
- As a developer debugging authentication issues, I want to manually authenticate in headed mode so that I can observe the authentication flow and troubleshoot problems
- As a user, I want manual authentication mode to automatically show the browser so that I don't need to remember to also add the `--debug` flag

## Core Requirements

### Functional Requirements

- Add a new CLI parameter `--manual-auth` that triggers manual authentication mode
- When `--manual-auth` is set, automatically enable headed (visible) browser mode regardless of `--debug` flag status
- Skip the automated login flow entirely when `--manual-auth` is enabled
- Navigate to Amazon.com home page and pause for user to authenticate
- Display clear console instructions explaining what the user needs to do
- Poll the page to detect when the user has successfully authenticated
- Once logged-in state is detected, continue with normal program execution (order navigation and invoice downloading)
- Support combining `--manual-auth` with other CLI parameters (`--from`, `--to`)
- Provide helpful error messages if authentication is not completed within a reasonable timeout
- Log manual authentication mode status in console startup messages

### Non-Functional Requirements

- User Experience: Provide crystal-clear console instructions so users know exactly what to do
- Reliability: Robust logged-in state detection that works across Amazon's various authentication flows
- Performance: Efficient polling mechanism that doesn't consume excessive resources while waiting
- Maintainability: Modular implementation that cleanly separates manual authentication logic from existing automated login code
- Security: Never bypass security checks - users complete full Amazon authentication themselves
- Compatibility: Works seamlessly with existing date range and debug parameters

## Visual Design

No visual mockups provided. This is a CLI feature with enhanced console output.

### Console Output Design

When `--manual-auth` is used:

```
=================================================
Starting Amazon Invoice Automation...
=================================================
Loaded credentials from .env
Date range: 2025-01-01 to 2025-12-31
Browser mode: headed (manual authentication)
Authentication mode: MANUAL
=================================================

Launching browser (headed mode)...
Navigating to Amazon.com...

=================================================
MANUAL AUTHENTICATION REQUIRED
=================================================
Please complete the following steps:

1. The browser window is now open showing Amazon.com
2. Click "Sign in" in the browser
3. Enter your email and password manually
4. Complete any 2FA/CAPTCHA challenges
5. Wait for the Amazon home page to fully load
6. Do NOT close the browser window

The script will automatically detect when you're logged in
and continue downloading invoices.

Waiting for authentication... (Press Ctrl+C to cancel)
=================================================

Checking authentication status...
Still waiting for authentication...
Still waiting for authentication...
Authentication detected!
Login successful!

Navigating to order history...
Filtering orders from 2025-01-01 to 2025-12-31...
[... rest of normal flow ...]
```

## Reusable Components

### Existing Code to Leverage

**From `lib/auth.js`:**
- `verifyAuthentication(page)`: Reuse existing authentication verification logic to detect logged-in state
- `detect2FA(page)`: Can potentially reuse 2FA detection patterns for manual auth monitoring

**From `lib/config.js`:**
- CLI argument parsing infrastructure (yargs)
- `headless` configuration flag logic to extend for manual auth mode

**From `lib/reporter.js`:**
- `logStartup(config)`: Extend to show manual authentication mode status
- Console logging patterns for clear user instructions

**From `index.js`:**
- Browser launch configuration
- Context creation with downloads enabled
- Main application orchestration flow

### New Components Required

**New Functions in `lib/auth.js`:**
- `manualLogin(page)`: New function to handle manual authentication workflow
  - Navigate to Amazon.com home page
  - Display console instructions
  - Poll for logged-in state
  - Return when authentication detected
- `logManualAuthInstructions()`: Display detailed instructions for manual authentication

**Configuration Changes in `lib/config.js`:**
- Add `--manual-auth` CLI parameter using yargs
- Add logic to force `headless: false` when `manualAuth: true`
- Export `manualAuth` flag in config object

**Reporter Enhancements in `lib/reporter.js`:**
- Update `logStartup()` to show "manual" vs "automated" authentication mode
- Add console messages for manual authentication waiting status

## Technical Approach

### CLI Parameter Configuration

**Configuration Module Changes (`lib/config.js`):**

Add new yargs option:
```javascript
.option('manual-auth', {
  alias: 'm',
  type: 'boolean',
  description: 'Use manual authentication instead of automated login',
  default: false
})
```

Update headless configuration logic:
```javascript
// Force headed mode when manual auth is enabled
const manualAuth = argv['manual-auth'];
const headless = manualAuth ? false : !argv.debug;
```

Export new configuration:
```javascript
const config = {
  // ... existing config ...
  manualAuth: manualAuth,
  headless: headless,
  // ... rest of config ...
};
```

### Authentication Flow Changes

**Authentication Module Updates (`lib/auth.js`):**

Add new manual login function:
```javascript
/**
 * Manual authentication workflow
 * Navigates to Amazon.com and waits for user to complete authentication
 * @param {import('playwright').Page} page - Playwright page instance
 * @returns {Promise<void>}
 */
async function manualLogin(page) {
  // Navigate to Amazon home page
  await page.goto('https://www.amazon.com/', { waitUntil: 'domcontentloaded' });

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

  // Poll for authentication every 3 seconds
  const pollInterval = 3000;
  const maxWaitTime = 10 * 60 * 1000; // 10 minutes maximum
  const startTime = Date.now();

  while (true) {
    // Check timeout
    if (Date.now() - startTime > maxWaitTime) {
      throw new Error('Manual authentication timeout: Maximum wait time of 10 minutes exceeded');
    }

    // Check if authenticated
    console.log('Checking authentication status...');
    const isAuthenticated = await verifyAuthentication(page);

    if (isAuthenticated) {
      console.log('Authentication detected!');
      return;
    }

    // Wait before next check
    await page.waitForTimeout(pollInterval);
  }
}
```

Export the new function:
```javascript
module.exports = {
  login,
  manualLogin, // NEW
  detect2FA,
  waitFor2FA,
  verifyAuthentication,
};
```

### Main Application Integration

**Index.js Changes:**

Update authentication flow to use conditional logic:
```javascript
// Step 1: Authentication
console.log('Navigating to Amazon.com...');

if (config.manualAuth) {
  // Manual authentication mode
  console.log('Manual authentication mode enabled');
  await auth.manualLogin(page);
} else {
  // Automated authentication mode
  console.log('Logging in...');
  await auth.login(page, config.email, config.password);

  // Check for 2FA in automated mode
  const needs2FA = await auth.detect2FA(page);
  if (needs2FA) {
    reporter.log2FAInstructions();
    await auth.waitFor2FA(page);
  }
}

// Verify authentication successful (works for both modes)
const isAuthenticated = await auth.verifyAuthentication(page);
if (!isAuthenticated) {
  throw new Error('Authentication failed. Please try again.');
}

console.log('Login successful!\n');

// Continue with normal flow...
```

### Reporter Enhancements

**Reporter Module Updates (`lib/reporter.js`):**

Update `logStartup()` function:
```javascript
function logStartup(config) {
  console.log('=================================================');
  console.log('Starting Amazon Invoice Automation...');
  console.log('=================================================');

  // Only show credentials message in automated mode
  if (!config.manualAuth) {
    console.log('Loaded credentials from .env');
  }

  console.log(`Date range: ${config.from} to ${config.to}`);

  // Enhanced browser mode message
  let browserMode = config.headless ? 'headless' : 'headed';
  if (config.manualAuth) {
    browserMode += ' (manual authentication)';
  } else if (config.debug) {
    browserMode += ' (debug)';
  }
  console.log(`Browser mode: ${browserMode}`);

  // Show authentication mode
  const authMode = config.manualAuth ? 'MANUAL' : 'AUTOMATED';
  console.log(`Authentication mode: ${authMode}`);

  console.log('=================================================\n');
}
```

### Logged-In State Detection

**Detection Strategy:**

Reuse existing `verifyAuthentication()` function from `lib/auth.js` which checks:

1. Account menu element (`#nav-link-accountList`)
2. Text content does NOT contain "Sign in"
3. Text content DOES contain "Hello" or "Account"
4. Orders link is present (`#nav-orders`)

This multi-factor verification ensures reliable detection across different Amazon page states.

**Polling Configuration:**
- Poll interval: 3 seconds (balance between responsiveness and resource usage)
- Maximum wait time: 10 minutes (generous timeout for complex 2FA)
- Console feedback: Print status message every poll iteration so user knows script is still running

### Error Handling

**Timeout Scenario:**
- After 10 minutes without successful authentication
- Throw clear error: "Manual authentication timeout: Maximum wait time of 10 minutes exceeded"
- Cleanup browser and exit gracefully

**User Closes Browser:**
- Playwright will throw an error if user closes browser window
- Catch error and provide helpful message: "Browser was closed before authentication completed"

**User Cancels (CTRL+C):**
- Existing SIGINT handler will catch this
- Generate partial summary and cleanup browser
- No special handling needed

### CLI Usage Examples

```bash
# Manual authentication with default date range (current year)
node index.js --manual-auth

# Manual authentication with custom date range
node index.js --manual-auth --from 2025-01-01 --to 2025-06-30

# Manual authentication (short form)
node index.js -m

# Manual auth overrides debug flag (both produce same result: headed mode)
node index.js --manual-auth --debug
node index.js --manual-auth

# Invalid: manual-auth doesn't require credentials but they won't cause issues
# The script will simply not use them
node index.js --manual-auth
# (AMAZON_EMAIL and AMAZON_PASSWORD in .env are ignored)
```

### Credential Handling

**Important Behavior:**
- When `--manual-auth` is used, credentials from `.env` are NOT required
- Modify `lib/config.js` to skip credential validation when `manualAuth` is true:

```javascript
// Only fail fast on missing credentials in automated mode
if (!manualAuth && (!email || !password)) {
  console.error('Configuration Error: Missing credentials');
  console.error('Please create a .env file with AMAZON_EMAIL and AMAZON_PASSWORD');
  console.error('Or use --manual-auth flag to authenticate manually');
  process.exit(1);
}
```

## Out of Scope

The following features are explicitly excluded from this implementation:

- Automatic credential saving after manual authentication (session persistence across runs)
- Browser profile reuse to avoid repeated authentication
- Headless manual authentication (manual auth always requires visible browser)
- Interactive prompts to ask user if they want manual or automated mode
- Automatic fallback to manual auth if automated auth fails
- Screenshots or recording of the manual authentication process
- Browser automation hints or guidance during manual authentication (user does everything)
- Detection of specific authentication failures (CAPTCHA, wrong password, etc.)

## Success Criteria

- User can successfully invoke `--manual-auth` parameter via CLI
- When `--manual-auth` is set, browser launches in headed mode automatically
- Script navigates to Amazon.com home page without attempting automated login
- Clear console instructions are displayed explaining manual authentication requirements
- Script successfully detects when user has completed authentication
- Once authentication is detected, normal invoice downloading flow proceeds unchanged
- Script handles timeout gracefully with clear error message after 10 minutes
- Manual authentication works in combination with `--from` and `--to` parameters
- Console startup message correctly identifies "MANUAL" authentication mode
- Credentials validation is skipped when `--manual-auth` is enabled
- User can cancel manual authentication with CTRL+C and browser cleans up properly

## Implementation Notes

### Testing Manual Authentication

**Manual Testing Approach:**
1. Run script with `--manual-auth` flag
2. Verify browser opens in headed mode
3. Verify console instructions are clear and accurate
4. Manually sign in to Amazon in the browser
5. Verify script detects authentication and continues
6. Verify invoices are downloaded normally

**Test Scenarios:**
- Manual auth with default date range
- Manual auth with custom date range
- Manual auth with 2FA enabled account
- Manual auth timeout scenario (wait > 10 minutes)
- Manual auth cancellation (CTRL+C during waiting)
- Manual auth with CAPTCHA challenges

**Automated Testing:**
Not practical for manual authentication flow itself, but can test:
- Configuration parsing of `--manual-auth` flag
- Headless mode is disabled when manual auth is enabled
- Credentials validation is skipped appropriately
- Authentication detection function works correctly

### Polling Best Practices

**Why 3-second intervals:**
- Fast enough to feel responsive when user completes auth
- Slow enough to not spam console or consume unnecessary resources
- Balance between user experience and system efficiency

**Console Feedback:**
- Print status message on each poll iteration
- Prevents user from thinking script has frozen
- Provides reassurance that script is still running

**Timeout Selection:**
- 10 minutes is generous for manual authentication
- Accounts for complex 2FA (SMS delays, authenticator app lookups)
- Accounts for users who might step away briefly
- Long enough to not frustrate users, short enough to detect abandoned sessions

### Browser Behavior

**Always Headed Mode:**
- Manual authentication requires visible browser by definition
- Force `headless: false` when `--manual-auth` is true
- Ignore `--debug` flag value (redundant with manual auth)

**Browser Stays Open:**
- Browser window remains open throughout entire process
- Users can observe invoice downloading after authentication
- Closes automatically when script completes or errors

### Security Considerations

**No Credential Storage:**
- Manual auth mode doesn't save or cache credentials
- Users enter credentials fresh each time
- More secure for users with credential concerns

**Full Amazon Security:**
- Script doesn't bypass any Amazon security measures
- Users complete full Amazon authentication flow
- All 2FA, CAPTCHA, and security checks are handled by user

**Visibility:**
- Headed mode allows users to see exactly what's happening
- Transparent authentication process
- Users maintain full control over credential entry

### Edge Cases

**Multiple Authentication Attempts:**
- If user fails login, they can retry in the same browser session
- Script continues polling until success or timeout
- No limit on number of failed attempts within timeout window

**Page Navigation During Wait:**
- If user navigates away from Amazon during polling, detection continues
- `verifyAuthentication()` checks for authenticated elements anywhere on amazon.com
- User can browse Amazon while script waits (though not recommended)

**Session Already Authenticated:**
- If browser session is already authenticated (rare), script detects immediately
- No need to manually log in again
- Script proceeds directly to invoice downloading

### Code Organization

**Separation of Concerns:**
- Authentication logic stays in `lib/auth.js`
- Configuration logic stays in `lib/config.js`
- Main orchestration stays in `index.js`
- No mixing of manual/automated auth logic - clean conditional branching

**Backward Compatibility:**
- Existing automated authentication flow unchanged
- All existing CLI parameters continue to work
- No breaking changes to existing functionality
- Manual auth is purely additive feature

### Documentation Updates

**README.md additions needed:**
- Document `--manual-auth` parameter
- Explain when to use manual vs automated authentication
- Provide usage examples
- Note that credentials aren't required for manual auth mode

**Help Text:**
Already handled by yargs description field:
```bash
node index.js --help
# Shows:
# --manual-auth, -m  Use manual authentication instead of automated login
```

### Performance Considerations

**Resource Usage:**
- Polling every 3 seconds is lightweight (just DOM queries)
- No significant CPU or memory impact
- Browser window uses more resources than headless, but necessary for manual auth

**Network Impact:**
- Minimal network traffic during polling (no page reloads)
- Only checks existing page elements
- No external API calls during waiting period

### Future Enhancements (Not in Scope)

**Session Persistence:**
- Could save browser session/cookies for reuse
- Would eliminate need for repeated authentication
- Requires cookie/session management implementation

**Smart Timeout:**
- Could adapt timeout based on user activity
- Extend timeout if user is actively interacting with page
- Requires mouse/keyboard activity detection

**Progress Indicators:**
- Could show elapsed time / remaining time
- Animated waiting indicator
- Would enhance user experience

**Automatic Retry:**
- If automated auth fails, automatically offer manual auth
- Would improve robustness
- Requires error detection and user prompting
