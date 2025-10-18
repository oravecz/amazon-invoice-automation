/**
 * Tests for Configuration & CLI Module (lib/config.js)
 *
 * Following minimal testing approach - only testing critical behaviors:
 * 1. CLI argument parsing (--from, --to, --debug)
 * 2. Default date range (current year)
 * 3. Environment variable loading
 */

const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

// Test 1: CLI argument parsing with flags
test('should parse CLI arguments correctly', async () => {
  // Save original process.argv
  const originalArgv = process.argv;

  // Mock CLI arguments
  process.argv = [
    'node',
    'index.js',
    '--from', '2025-01-01',
    '--to', '2025-06-30',
    '--debug'
  ];

  // Mock environment variables
  process.env.AMAZON_EMAIL = 'test@example.com';
  process.env.AMAZON_PASSWORD = 'test-password';

  // Clear require cache to reload module with new args
  delete require.cache[require.resolve('../lib/config.js')];

  const config = require('../lib/config.js');

  expect(config.email).toBe('test@example.com');
  expect(config.password).toBe('test-password');
  expect(config.from).toBe('2025-01-01');
  expect(config.to).toBe('2025-06-30');
  expect(config.debug).toBe(true);
  expect(config.headless).toBe(false);

  // Restore original process.argv
  process.argv = originalArgv;
  delete process.env.AMAZON_EMAIL;
  delete process.env.AMAZON_PASSWORD;
});

// Test 2: Default date range (current year)
test('should use current year as default date range', async () => {
  // Save original process.argv
  const originalArgv = process.argv;

  // Mock CLI arguments without dates
  process.argv = ['node', 'index.js'];

  // Mock environment variables
  process.env.AMAZON_EMAIL = 'test@example.com';
  process.env.AMAZON_PASSWORD = 'test-password';

  // Clear require cache
  delete require.cache[require.resolve('../lib/config.js')];

  const config = require('../lib/config.js');

  const currentYear = new Date().getFullYear();
  expect(config.from).toBe(`${currentYear}-01-01`);
  expect(config.to).toBe(`${currentYear}-12-31`);

  // Restore
  process.argv = originalArgv;
  delete process.env.AMAZON_EMAIL;
  delete process.env.AMAZON_PASSWORD;
});

// Test 3: Environment variable loading from .env file
test('should load environment variables from .env file', async () => {
  // Create temporary .env file
  const envPath = path.join(__dirname, '..', '.env.test');
  const envContent = 'AMAZON_EMAIL=envfile@example.com\nAMAZON_PASSWORD=envfile-password';
  fs.writeFileSync(envPath, envContent);

  // Save original process.argv and env
  const originalArgv = process.argv;
  const originalEmail = process.env.AMAZON_EMAIL;
  const originalPassword = process.env.AMAZON_PASSWORD;

  // Clear env vars
  delete process.env.AMAZON_EMAIL;
  delete process.env.AMAZON_PASSWORD;

  // Mock CLI arguments
  process.argv = ['node', 'index.js'];

  // Clear require cache and reload with dotenv pointing to test file
  delete require.cache[require.resolve('../lib/config.js')];
  delete require.cache[require.resolve('dotenv')];

  // Load dotenv with test file
  require('dotenv').config({ path: envPath });

  const config = require('../lib/config.js');

  expect(config.email).toBe('envfile@example.com');
  expect(config.password).toBe('envfile-password');

  // Cleanup
  fs.unlinkSync(envPath);
  process.argv = originalArgv;
  if (originalEmail) process.env.AMAZON_EMAIL = originalEmail;
  else delete process.env.AMAZON_EMAIL;
  if (originalPassword) process.env.AMAZON_PASSWORD = originalPassword;
  else delete process.env.AMAZON_PASSWORD;
});

// Test 4: Headless mode defaults to true without debug flag
test('should set headless to true when debug flag not provided', async () => {
  // Save original process.argv
  const originalArgv = process.argv;

  // Mock CLI arguments without debug flag
  process.argv = ['node', 'index.js'];

  // Mock environment variables
  process.env.AMAZON_EMAIL = 'test@example.com';
  process.env.AMAZON_PASSWORD = 'test-password';

  // Clear require cache
  delete require.cache[require.resolve('../lib/config.js')];

  const config = require('../lib/config.js');

  expect(config.debug).toBe(false);
  expect(config.headless).toBe(true);

  // Restore
  process.argv = originalArgv;
  delete process.env.AMAZON_EMAIL;
  delete process.env.AMAZON_PASSWORD;
});

// Test 5: Manual auth flag parsing sets manualAuth to true
test('should parse --manual-auth flag and set manualAuth to true', async () => {
  // Save original process.argv
  const originalArgv = process.argv;

  // Mock CLI arguments with --manual-auth flag
  process.argv = ['node', 'index.js', '--manual-auth'];

  // Mock environment variables (not required for manual auth, but set for consistency)
  process.env.AMAZON_EMAIL = 'test@example.com';
  process.env.AMAZON_PASSWORD = 'test-password';

  // Clear require cache
  delete require.cache[require.resolve('../lib/config.js')];

  const config = require('../lib/config.js');

  expect(config.manualAuth).toBe(true);

  // Restore
  process.argv = originalArgv;
  delete process.env.AMAZON_EMAIL;
  delete process.env.AMAZON_PASSWORD;
});

// Test 6: Manual auth automatically forces headless to false
test('should force headless to false when --manual-auth is enabled', async () => {
  // Save original process.argv
  const originalArgv = process.argv;

  // Mock CLI arguments with --manual-auth flag
  process.argv = ['node', 'index.js', '--manual-auth'];

  // Mock environment variables
  process.env.AMAZON_EMAIL = 'test@example.com';
  process.env.AMAZON_PASSWORD = 'test-password';

  // Clear require cache
  delete require.cache[require.resolve('../lib/config.js')];

  const config = require('../lib/config.js');

  expect(config.manualAuth).toBe(true);
  expect(config.headless).toBe(false);

  // Restore
  process.argv = originalArgv;
  delete process.env.AMAZON_EMAIL;
  delete process.env.AMAZON_PASSWORD;
});

// Test 7: Credentials validation is skipped when manualAuth is true
test('should skip credential validation when --manual-auth is enabled', async () => {
  // Save original process.argv and env
  const originalArgv = process.argv;
  const originalEmail = process.env.AMAZON_EMAIL;
  const originalPassword = process.env.AMAZON_PASSWORD;

  // Mock CLI arguments with --manual-auth flag
  process.argv = ['node', 'index.js', '--manual-auth'];

  // Clear environment variables to simulate missing credentials
  delete process.env.AMAZON_EMAIL;
  delete process.env.AMAZON_PASSWORD;

  // Clear require cache and dotenv cache
  delete require.cache[require.resolve('../lib/config.js')];
  delete require.cache[require.resolve('dotenv')];

  // Mock dotenv to not load .env file
  const Module = require('module');
  const originalRequire = Module.prototype.require;
  Module.prototype.require = function(id) {
    if (id === 'dotenv') {
      return { config: () => {} }; // Mock dotenv.config to do nothing
    }
    return originalRequire.apply(this, arguments);
  };

  // This should NOT throw an error or exit the process despite missing credentials
  const config = require('../lib/config.js');

  expect(config.manualAuth).toBe(true);
  // Credentials may be undefined when manual auth is used and .env is not loaded
  expect(config.email).toBeUndefined();
  expect(config.password).toBeUndefined();

  // Restore
  Module.prototype.require = originalRequire;
  process.argv = originalArgv;
  if (originalEmail) process.env.AMAZON_EMAIL = originalEmail;
  if (originalPassword) process.env.AMAZON_PASSWORD = originalPassword;
});

// Test 8: Combining manual auth with from and to flags
test('should allow combining --manual-auth with --from and --to flags', async () => {
  // Save original process.argv and env
  const originalArgv = process.argv;
  const originalEmail = process.env.AMAZON_EMAIL;
  const originalPassword = process.env.AMAZON_PASSWORD;

  // Mock CLI arguments with --manual-auth and date range flags
  process.argv = [
    'node',
    'index.js',
    '--manual-auth',
    '--from', '2025-01-01',
    '--to', '2025-06-30'
  ];

  // Clear environment variables to simulate missing credentials
  delete process.env.AMAZON_EMAIL;
  delete process.env.AMAZON_PASSWORD;

  // Clear require cache and dotenv cache
  delete require.cache[require.resolve('../lib/config.js')];
  delete require.cache[require.resolve('dotenv')];

  // Mock dotenv to not load .env file
  const Module = require('module');
  const originalRequire = Module.prototype.require;
  Module.prototype.require = function(id) {
    if (id === 'dotenv') {
      return { config: () => {} }; // Mock dotenv.config to do nothing
    }
    return originalRequire.apply(this, arguments);
  };

  const config = require('../lib/config.js');

  expect(config.manualAuth).toBe(true);
  expect(config.from).toBe('2025-01-01');
  expect(config.to).toBe('2025-06-30');
  expect(config.headless).toBe(false);

  // Restore
  Module.prototype.require = originalRequire;
  process.argv = originalArgv;
  if (originalEmail) process.env.AMAZON_EMAIL = originalEmail;
  if (originalPassword) process.env.AMAZON_PASSWORD = originalPassword;
});
