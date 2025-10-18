/**
 * Configuration & CLI Module
 *
 * Responsibilities:
 * - Load environment variables from .env file
 * - Parse CLI arguments (--from, --to, --debug, --manual-auth)
 * - Validate date ranges and set defaults (current year)
 * - Export configuration object for use by other modules
 */

const dotenv = require('dotenv');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

// Load environment variables from .env file
dotenv.config();

/**
 * Get default date range for current year
 * @returns {Object} Object with from and to dates in ISO format (YYYY-MM-DD)
 */
function getDefaultDateRange() {
  const currentYear = new Date().getFullYear();
  return {
    from: `${currentYear}-01-01`,
    to: `${currentYear}-12-31`
  };
}

/**
 * Validate date range
 * @param {string} from - Start date in ISO format (YYYY-MM-DD)
 * @param {string} to - End date in ISO format (YYYY-MM-DD)
 * @returns {boolean} True if valid, throws error if invalid
 */
function validateDateRange(from, to) {
  const fromDate = new Date(from);
  const toDate = new Date(to);

  if (isNaN(fromDate.getTime())) {
    throw new Error(`Invalid 'from' date: ${from}. Use format YYYY-MM-DD`);
  }

  if (isNaN(toDate.getTime())) {
    throw new Error(`Invalid 'to' date: ${to}. Use format YYYY-MM-DD`);
  }

  if (fromDate > toDate) {
    throw new Error(`'from' date (${from}) must be before 'to' date (${to})`);
  }

  return true;
}

/**
 * Parse CLI arguments using yargs
 */
const argv = yargs(hideBin(process.argv))
  .option('from', {
    alias: 'f',
    type: 'string',
    description: 'Start date for invoice download (YYYY-MM-DD)',
    default: null
  })
  .option('to', {
    alias: 't',
    type: 'string',
    description: 'End date for invoice download (YYYY-MM-DD)',
    default: null
  })
  .option('debug', {
    alias: 'd',
    type: 'boolean',
    description: 'Run browser in headed mode for debugging',
    default: false
  })
  .option('manual-auth', {
    alias: 'm',
    type: 'boolean',
    description: 'Use manual authentication instead of automated login',
    default: false
  })
  .help()
  .alias('help', 'h')
  .argv;

// Get default date range if not provided
const defaultDates = getDefaultDateRange();
const fromDate = argv.from || defaultDates.from;
const toDate = argv.to || defaultDates.to;

// Validate date range
try {
  validateDateRange(fromDate, toDate);
} catch (error) {
  console.error(`Configuration Error: ${error.message}`);
  process.exit(1);
}

// Extract manual auth flag
const manualAuth = argv['manual-auth'];

// Load credentials from environment variables
const email = process.env.AMAZON_EMAIL;
const password = process.env.AMAZON_PASSWORD;

// Only fail fast on missing credentials in automated mode
if (!manualAuth && (!email || !password)) {
  console.error('Configuration Error: Missing credentials');
  console.error('Please create a .env file with AMAZON_EMAIL and AMAZON_PASSWORD');
  console.error('Or use --manual-auth flag to authenticate manually');
  process.exit(1);
}

/**
 * Configuration object
 * Contains all settings needed to run the Amazon invoice automation
 */
const config = {
  // Credentials
  email,
  password,

  // Date range
  from: fromDate,
  to: toDate,

  // Authentication mode
  manualAuth: manualAuth,

  // Browser settings
  debug: argv.debug,
  headless: manualAuth ? false : !argv.debug, // Force headed mode for manual auth

  // Helper functions
  getDefaultDateRange,
  validateDateRange
};

// Export configuration object
module.exports = config;
