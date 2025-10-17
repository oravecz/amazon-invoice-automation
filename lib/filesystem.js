/**
 * File System Module
 *
 * Responsibilities:
 * - Create month-based directories as needed
 * - Ensure proper file paths and naming conventions
 * - Verify file existence before downloads
 * - Handle file system errors gracefully
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * Ensure directory exists, create if it doesn't
 * @param {string} dirPath - Directory path to create
 * @returns {Promise<void>}
 */
async function ensureDirectoryExists(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw new Error(`Failed to create directory ${dirPath}: ${error.message}`);
    }
  }
}

/**
 * Convert date to YYYY-MM format for month folder
 * @param {Date} date - Date object
 * @returns {string} Month folder name in YYYY-MM format
 */
function getMonthFolder(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Sanitize filename to remove invalid characters
 * @param {string} filename - Filename to sanitize
 * @returns {string} Sanitized filename
 */
function sanitizeFilename(filename) {
  // Remove or replace invalid filename characters
  return filename.replace(/[<>:"/\\|?*]/g, '-');
}

/**
 * Generate file path for invoice PDF
 * @param {Date} orderDate - Order date
 * @param {string} orderNumber - Amazon order number
 * @returns {string} Full file path for invoice PDF
 */
function generateFilePath(orderDate, orderNumber) {
  const monthFolder = getMonthFolder(orderDate);
  const sanitizedOrderNumber = sanitizeFilename(orderNumber);
  const filename = `invoice-${sanitizedOrderNumber}.pdf`;

  // Use absolute path from current working directory
  const absolutePath = path.join(process.cwd(), monthFolder, filename);

  return absolutePath;
}

/**
 * Check if file exists
 * @param {string} filePath - Full path to file
 * @returns {Promise<boolean>} True if file exists, false otherwise
 */
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return false;
    }
    // For other errors, rethrow
    throw error;
  }
}

/**
 * Get directory path for a given date
 * @param {Date} orderDate - Order date
 * @returns {string} Absolute path to month directory
 */
function getDirectoryPath(orderDate) {
  const monthFolder = getMonthFolder(orderDate);
  return path.join(process.cwd(), monthFolder);
}

// Export all functions
module.exports = {
  ensureDirectoryExists,
  getMonthFolder,
  sanitizeFilename,
  generateFilePath,
  fileExists,
  getDirectoryPath
};
