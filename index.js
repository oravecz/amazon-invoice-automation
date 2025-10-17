#!/usr/bin/env node

/**
 * Amazon Invoice Automation - Main CLI Application
 *
 * This is the main entry point for the Amazon invoice downloader.
 * It orchestrates all the modules to automate invoice downloads.
 *
 * Flow:
 * 1. Load configuration and validate credentials
 * 2. Launch Playwright browser
 * 3. Authenticate to Amazon (handle 2FA if needed)
 * 4. Navigate to order history and apply date filter
 * 5. Iterate through all orders across all pages
 * 6. For each order: check invoice, download if available
 * 7. Generate summary report
 * 8. Close browser cleanly
 */

const { chromium } = require('playwright');
const config = require('./lib/config');
const reporter = require('./lib/reporter');
const auth = require('./lib/auth');
const orders = require('./lib/orders');
const invoices = require('./lib/invoices');

// Track browser instance for cleanup
let browser = null;

/**
 * Main application function
 * Orchestrates the entire invoice download workflow
 */
async function main() {
  try {
    // Display startup message
    reporter.logStartup(config);

    // Launch browser with appropriate settings
    console.log(`Launching browser (${config.headless ? 'headless' : 'headed'} mode)...`);
    browser = await chromium.launch({
      headless: config.headless,
      slowMo: config.debug ? 100 : 0, // Slow down in debug mode
    });

    // Create browser context with download support
    const context = await browser.newContext({
      acceptDownloads: true,
      viewport: { width: 1280, height: 720 },
    });

    const page = await context.newPage();

    // Set reasonable timeouts
    page.setDefaultTimeout(30000); // 30 seconds for most operations
    page.setDefaultNavigationTimeout(60000); // 60 seconds for page loads

    // Step 1: Authentication
    console.log('Navigating to Amazon.com...');
    console.log('Logging in...');
    await auth.login(page, config.email, config.password);

    // Check for 2FA
    const needs2FA = await auth.detect2FA(page);
    if (needs2FA) {
      reporter.log2FAInstructions();
      await auth.waitFor2FA(page);
    }

    // Verify authentication successful
    const isAuthenticated = await auth.verifyAuthentication(page);
    if (!isAuthenticated) {
      throw new Error('Authentication failed. Please check your credentials in .env file');
    }

    console.log('Login successful!\n');

    // Step 2: Navigate to orders
    console.log('Navigating to order history...');
    await orders.navigateToOrders(page);

    // Step 3: Apply date filter
    console.log(`Filtering orders from ${config.from} to ${config.to}...`);
    const fromDate = new Date(config.from);
    const toDate = new Date(config.to);
    await orders.applyDateFilter(page, fromDate, toDate);

    // Step 4: Process orders across all pages
    let pageNumber = 1;
    let totalOrdersProcessed = 0;

    // Main processing loop
    while (true) {
      console.log(`\nProcessing page ${pageNumber}...`);

      // Get all orders on current page
      const orderElements = await orders.getOrdersList(page);
      console.log(`Found ${orderElements.length} orders on this page\n`);

      // Process each order
      for (let i = 0; i < orderElements.length; i++) {
        const orderElement = orderElements[i];
        totalOrdersProcessed++;

        try {
          // Extract order metadata
          const orderData = await orders.extractOrderMetadata(orderElement);

          // Format order data for reporting
          const formattedOrderData = {
            orderNumber: orderData.orderNumber,
            date: orderData.date.toISOString().split('T')[0], // YYYY-MM-DD format
            amount: orderData.total,
            products: Array.isArray(orderData.products)
              ? orderData.products.join(', ')
              : orderData.products,
          };

          // Process invoice
          const result = await invoices.processOrderInvoice(page, orderElement, orderData);

          // Determine status and track result
          let status;
          let filePath = '';

          if (result.status === 'downloaded') {
            status = 'downloaded';
            filePath = result.filePath;
            reporter.trackOrder({ ...formattedOrderData, filePath }, 'downloaded');
            reporter.logProgress(totalOrdersProcessed, '?', formattedOrderData, 'downloaded', filePath);
          } else if (result.status === 'skipped') {
            status = 'skipped';
            filePath = result.filePath;
            reporter.trackOrder({ ...formattedOrderData, filePath }, 'skipped');
            reporter.logProgress(totalOrdersProcessed, '?', formattedOrderData, 'skipped', filePath);
          } else if (result.status === 'no-invoice') {
            status = 'no_invoice';
            reporter.trackOrder(formattedOrderData, 'no_invoice');
            reporter.logProgress(totalOrdersProcessed, '?', formattedOrderData, 'no_invoice');
          } else if (result.status === 'failed') {
            status = 'failed';
            reporter.trackOrder(formattedOrderData, 'failed');
            reporter.logProgress(totalOrdersProcessed, '?', formattedOrderData, 'failed');
            reporter.logError(`Failed to process order ${orderData.orderNumber}`, result.error);
          }

        } catch (error) {
          // Individual order failure - log but continue
          reporter.logError(`Error processing order ${totalOrdersProcessed}`, error);
          reporter.trackOrder({
            orderNumber: 'Unknown',
            date: new Date().toISOString().split('T')[0],
            amount: '$0.00',
            products: 'Unknown',
          }, 'failed');
        }
      }

      // Check for next page
      const hasMore = await orders.hasNextPage(page);
      if (!hasMore) {
        console.log('\nNo more pages to process.');
        break;
      }

      // Navigate to next page
      console.log('\nNavigating to next page...');
      await orders.goToNextPage(page);
      pageNumber++;
    }

    // Step 5: Generate summary and display statistics
    console.log('\n\nGenerating summary report...');
    const summaryPath = 'summary.txt';
    await reporter.generateSummary(summaryPath, config.from, config.to);
    console.log(`Detailed report saved to: ${summaryPath}`);

    // Display final statistics
    reporter.displayFinalStats();

  } catch (error) {
    // Centralized error handling for critical failures
    reporter.logError('Critical error occurred', error);
    throw error; // Re-throw to set exit code
  } finally {
    // Always cleanup browser
    await cleanup();
  }
}

/**
 * Cleanup function - closes browser and ensures resources are freed
 */
async function cleanup() {
  if (browser) {
    console.log('\nClosing browser...');
    try {
      await browser.close();
      browser = null;
    } catch (error) {
      console.error('Error closing browser:', error.message);
    }
  }
}

/**
 * Handle SIGINT (CTRL+C) gracefully
 */
function setupSignalHandlers() {
  process.on('SIGINT', async () => {
    console.log('\n\nInterrupted by user (CTRL+C)');
    console.log('Cleaning up...');

    // Generate summary even on interruption
    try {
      await reporter.generateSummary('summary.txt', config.from, config.to);
      console.log('Partial summary saved to: summary.txt');
    } catch (error) {
      console.error('Error saving summary:', error.message);
    }

    // Cleanup browser
    await cleanup();

    console.log('Cleanup complete. Exiting...');
    process.exit(0);
  });
}

// Only run if this is the main module (not being imported for testing)
if (require.main === module) {
  setupSignalHandlers();

  main()
    .then(() => {
      console.log('\n\nAll done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n\nFatal error:', error.message);
      process.exit(1);
    });
}

// Export for testing
module.exports = {
  main,
  cleanup,
};
