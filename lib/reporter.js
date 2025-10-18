/**
 * Reporter Module
 *
 * Responsibilities:
 * - Track download statistics (total, successful, skipped, failed)
 * - Display real-time console progress updates
 * - Generate formatted summary.txt file
 * - Provide completion summary with statistics
 */

const fs = require('fs').promises;

/**
 * Reporter state management
 */
let state = {
  downloaded: [],
  skipped: [],
  noInvoice: [],
  failed: [],
  startTime: Date.now()
};

/**
 * Reset reporter state (useful for testing)
 */
function reset() {
  state = {
    downloaded: [],
    skipped: [],
    noInvoice: [],
    failed: [],
    startTime: Date.now()
  };
}

/**
 * Track order with its processing status
 * @param {Object} orderData - Order metadata (number, date, amount, products, filePath)
 * @param {string} status - Status: 'downloaded', 'skipped', 'no_invoice', 'failed'
 */
function trackOrder(orderData, status) {
  const order = { ...orderData, status };

  switch (status) {
    case 'downloaded':
      state.downloaded.push(order);
      break;
    case 'skipped':
      state.skipped.push(order);
      break;
    case 'no_invoice':
      state.noInvoice.push(order);
      break;
    case 'failed':
      state.failed.push(order);
      break;
    default:
      console.warn(`Unknown status: ${status}`);
  }
}

/**
 * Get current statistics
 * @returns {Object} Statistics object
 */
function getStats() {
  return {
    total: state.downloaded.length + state.skipped.length + state.noInvoice.length + state.failed.length,
    downloaded: state.downloaded.length,
    skipped: state.skipped.length,
    noInvoice: state.noInvoice.length,
    failed: state.failed.length
  };
}

/**
 * Log progress for a single order
 * @param {number} orderIndex - Current order index (1-based)
 * @param {number} totalOrders - Total number of orders
 * @param {Object} orderData - Order metadata
 * @param {string} status - Processing status
 * @param {string} filePath - File path for the invoice
 */
function logProgress(orderIndex, totalOrders, orderData, status, filePath = '') {
  console.log(`\nProcessing order ${orderIndex}/${totalOrders}: #${orderData.orderNumber}`);
  console.log(`  Date: ${orderData.date}`);
  console.log(`  Amount: ${orderData.amount}`);
  console.log(`  Product: ${orderData.products}`);

  switch (status) {
    case 'downloaded':
      console.log(`  ✓ Downloaded: ${filePath}`);
      break;
    case 'skipped':
      console.log(`  ⊘ Skipped: Invoice already exists`);
      break;
    case 'no_invoice':
      console.log(`  ⊘ Skipped: No invoice available`);
      break;
    case 'failed':
      console.log(`  ✗ Failed: Error downloading invoice`);
      break;
  }
}

/**
 * Log error message
 * @param {string} message - Error message
 * @param {Error} error - Error object
 */
function logError(message, error) {
  console.error(`\n✗ Error: ${message}`);
  if (error && error.message) {
    console.error(`  Details: ${error.message}`);
  }
}

/**
 * Log 2FA instructions
 */
function log2FAInstructions() {
  console.log('\n=================================================');
  console.log('2FA REQUIRED: Please complete two-factor authentication');
  console.log('=================================================');
  console.log('Waiting for manual 2FA completion...');
  console.log('(Press Ctrl+C to cancel)');
  console.log('=================================================\n');
}

/**
 * Generate summary.txt file
 * @param {string} outputPath - Path to write summary file
 * @param {string} fromDate - Start date of range
 * @param {string} toDate - End date of range
 */
async function generateSummary(outputPath, fromDate = '', toDate = '') {
  const timestamp = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  let content = 'Amazon Invoice Download Summary\n';
  content += `Generated: ${timestamp}\n`;
  if (fromDate && toDate) {
    content += `Date Range: ${fromDate} to ${toDate}\n`;
  }
  content += '\n';

  // Add all orders
  const allOrders = [
    ...state.downloaded,
    ...state.skipped,
    ...state.noInvoice,
    ...state.failed
  ];

  for (const order of allOrders) {
    content += `Order #${order.orderNumber}\n`;
    content += `  Date: ${order.date}\n`;
    content += `  Amount: ${order.amount}\n`;
    content += `  Product: ${order.products}\n`;

    // Format status message
    let statusMessage = '';
    switch (order.status) {
      case 'downloaded':
        statusMessage = 'Downloaded';
        break;
      case 'skipped':
        statusMessage = 'Skipped (already exists)';
        break;
      case 'no_invoice':
        statusMessage = 'No invoice available';
        break;
      case 'failed':
        statusMessage = 'Failed';
        break;
    }

    content += `  Status: ${statusMessage}\n`;

    if (order.filePath) {
      content += `  File: ${order.filePath}\n`;
    }

    content += '\n';
  }

  // Add summary statistics
  const stats = getStats();
  content += 'Summary Statistics:\n';
  content += `- Total orders processed: ${stats.total}\n`;
  content += `- Successfully downloaded: ${stats.downloaded}\n`;
  content += `- Skipped (already exist): ${stats.skipped}\n`;
  content += `- No invoice available: ${stats.noInvoice}\n`;
  content += `- Failed: ${stats.failed}\n`;

  // Write to file
  await fs.writeFile(outputPath, content, 'utf8');
}

/**
 * Display final statistics to console
 */
function displayFinalStats() {
  const stats = getStats();
  const duration = Date.now() - state.startTime;
  const durationMinutes = Math.floor(duration / 60000);
  const durationSeconds = Math.floor((duration % 60000) / 1000);

  console.log('\n=================================================');
  console.log('Summary:');
  console.log(`- Total orders: ${stats.total}`);
  console.log(`- Successfully downloaded: ${stats.downloaded}`);
  console.log(`- Skipped (already exist): ${stats.skipped}`);
  console.log(`- No invoice available: ${stats.noInvoice}`);
  console.log(`- Failed: ${stats.failed}`);
  console.log('=================================================');
  console.log(`\nCompleted in ${durationMinutes}m ${durationSeconds}s`);
}

/**
 * Log startup message
 * @param {Object} config - Configuration object
 */
function logStartup(config) {
  console.log('=================================================');
  console.log('Starting Amazon Invoice Automation...');
  console.log('=================================================');

  // Only show credentials message in automated mode
  if (!config.manualAuth) {
    console.log('Loaded credentials from .env');
  }

  console.log(`Date range: ${config.from} to ${config.to}`);

  // Enhanced browser mode message with context
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

// Export all functions
module.exports = {
  reset,
  trackOrder,
  getStats,
  logProgress,
  logError,
  log2FAInstructions,
  generateSummary,
  displayFinalStats,
  logStartup
};
