/**
 * Invoice Download Module
 * Handles invoice availability checking, downloading, and file management
 */

const path = require('path');
const filesystem = require('./filesystem');

/**
 * Checks if an invoice is available for an order
 * @param {import('playwright').ElementHandle} orderElement - Order element handle
 * @returns {Promise<boolean>} True if invoice is available
 */
async function hasInvoice(orderElement) {
  // Look for invoice link in the order element
  // Amazon typically uses links with text containing "Invoice" or href containing "invoice"
  const invoiceSelectors = [
    'a[href*="invoice"]',
    'a:has-text("Invoice")',
    'a.invoice-link',
    'a[aria-label*="Invoice"]',
  ];

  for (const selector of invoiceSelectors) {
    try {
      const invoiceLink = await orderElement.$(selector);
      if (invoiceLink) {
        return true;
      }
    } catch (error) {
      // Continue checking other selectors
    }
  }

  return false;
}

/**
 * Downloads an invoice PDF for an order
 * @param {import('playwright').Page} page - Playwright page instance
 * @param {import('playwright').ElementHandle} orderElement - Order element handle
 * @param {string} targetPath - Full path where PDF should be saved
 * @returns {Promise<void>}
 */
async function downloadInvoice(page, orderElement, targetPath) {
  // Find the invoice link
  const invoiceSelectors = [
    'a[href*="invoice"]',
    'a:has-text("Invoice")',
    'a.invoice-link',
  ];

  let invoiceLink = null;
  for (const selector of invoiceSelectors) {
    invoiceLink = await orderElement.$(selector);
    if (invoiceLink) {
      break;
    }
  }

  if (!invoiceLink) {
    throw new Error('Invoice link not found in order element');
  }

  // Set up download promise before clicking
  const downloadPromise = page.waitForEvent('download', { timeout: 30000 });

  // Click the invoice link to trigger download
  await invoiceLink.click();

  // Wait for download to start
  const download = await downloadPromise;

  // Save the downloaded file to the target path
  await download.saveAs(targetPath);

  // Verify file was saved
  const fileExists = await filesystem.fileExists(targetPath);
  if (!fileExists) {
    throw new Error(`Download failed: File not found at ${targetPath}`);
  }
}

/**
 * Orchestrates the complete invoice download workflow for a single order
 * @param {import('playwright').Page} page - Playwright page instance
 * @param {import('playwright').ElementHandle} orderElement - Order element handle
 * @param {Object} orderData - Order metadata object
 * @param {string} baseDir - Base directory for invoice storage (optional, defaults to cwd)
 * @returns {Promise<Object>} Status object with result of download attempt
 */
async function processOrderInvoice(page, orderElement, orderData, baseDir = process.cwd()) {
  try {
    // Check if invoice is available
    const invoiceAvailable = await hasInvoice(orderElement);
    if (!invoiceAvailable) {
      return {
        status: 'no-invoice',
        reason: 'No invoice available for this order',
      };
    }

    // Generate file path for invoice
    const filePath = filesystem.generateFilePath(orderData.date, orderData.orderNumber);
    const fullPath = path.join(baseDir, filePath);

    // Check if file already exists
    const exists = await filesystem.fileExists(fullPath);
    if (exists) {
      return {
        status: 'skipped',
        reason: 'Invoice already exists',
        filePath,
      };
    }

    // Ensure month directory exists
    const monthFolder = filesystem.getMonthFolder(orderData.date);
    const monthDir = path.join(baseDir, monthFolder);
    await filesystem.ensureDirectoryExists(monthDir);

    // Download the invoice
    await downloadInvoice(page, orderElement, fullPath);

    return {
      status: 'downloaded',
      filePath,
    };

  } catch (error) {
    return {
      status: 'failed',
      reason: error.message,
      error,
    };
  }
}

module.exports = {
  hasInvoice,
  downloadInvoice,
  processOrderInvoice,
};
