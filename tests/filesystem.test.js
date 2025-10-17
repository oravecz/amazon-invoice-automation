/**
 * Tests for File System Module (lib/filesystem.js)
 *
 * Following minimal testing approach - only testing critical behaviors:
 * 1. Month folder creation (YYYY-MM format)
 * 2. File path generation from order data
 * 3. File existence checking
 */

const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');
const filesystem = require('../lib/filesystem.js');

// Test 1: Month folder format (YYYY-MM)
test('should convert date to YYYY-MM format', async () => {
  const date = new Date('2025-03-15T10:30:00Z');
  const monthFolder = filesystem.getMonthFolder(date);

  expect(monthFolder).toBe('2025-03');
});

// Test 2: File path generation from order data
test('should generate correct file path from order data', async () => {
  const orderDate = new Date('2025-06-20T14:30:00Z');
  const orderNumber = '123-4567890-1234567';

  const filePath = filesystem.generateFilePath(orderDate, orderNumber);

  expect(filePath).toMatch(/2025-06\/invoice-123-4567890-1234567\.pdf$/);
  expect(path.basename(filePath)).toBe('invoice-123-4567890-1234567.pdf');
});

// Test 3: File existence checking
test('should check if file exists', async () => {
  // Create a temporary test file
  const testDir = path.join(__dirname, '..', 'test-temp');
  const testFile = path.join(testDir, 'test-file.txt');

  // Ensure directory exists
  await filesystem.ensureDirectoryExists(testDir);

  // Write test file
  fs.writeFileSync(testFile, 'test content');

  // Check if file exists
  const exists = await filesystem.fileExists(testFile);
  expect(exists).toBe(true);

  // Check non-existent file
  const nonExistent = await filesystem.fileExists(path.join(testDir, 'non-existent.txt'));
  expect(nonExistent).toBe(false);

  // Cleanup
  fs.unlinkSync(testFile);
  fs.rmdirSync(testDir);
});

// Test 4: Directory creation with recursive option
test('should create nested directories recursively', async () => {
  const testDir = path.join(__dirname, '..', 'test-temp', 'nested', 'dirs');

  // Ensure directory doesn't exist
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }

  // Create directory
  await filesystem.ensureDirectoryExists(testDir);

  // Verify directory exists
  expect(fs.existsSync(testDir)).toBe(true);

  // Cleanup
  fs.rmSync(path.join(__dirname, '..', 'test-temp'), { recursive: true, force: true });
});
