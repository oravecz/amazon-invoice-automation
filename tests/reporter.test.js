/**
 * Tests for Reporter Module (lib/reporter.js)
 *
 * Following minimal testing approach - only testing critical behaviors:
 * 1. Progress logging format
 * 2. Summary file generation
 * 3. Statistics tracking
 */

const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

// Test 1: Order tracking and statistics
test('should track orders and calculate statistics correctly', async () => {
  // Clear require cache to get fresh instance
  delete require.cache[require.resolve('../lib/reporter.js')];
  const reporter = require('../lib/reporter.js');

  // Reset reporter state
  reporter.reset();

  // Track various orders
  reporter.trackOrder({
    orderNumber: '123-4567890-1234567',
    date: '2025-01-15',
    amount: '$29.99',
    products: 'Product A',
    filePath: '2025-01/invoice-123-4567890-1234567.pdf'
  }, 'downloaded');

  reporter.trackOrder({
    orderNumber: '123-4567890-1234568',
    date: '2025-01-18',
    amount: '$49.99',
    products: 'Product B',
    filePath: '2025-01/invoice-123-4567890-1234568.pdf'
  }, 'skipped');

  reporter.trackOrder({
    orderNumber: '123-4567890-1234569',
    date: '2025-02-03',
    amount: '$15.99',
    products: 'Digital Item',
    filePath: ''
  }, 'no_invoice');

  const stats = reporter.getStats();

  expect(stats.downloaded).toBe(1);
  expect(stats.skipped).toBe(1);
  expect(stats.noInvoice).toBe(1);
  expect(stats.failed).toBe(0);
  expect(stats.total).toBe(3);
});

// Test 2: Summary file generation
test('should generate summary file with correct format', async () => {
  // Clear require cache
  delete require.cache[require.resolve('../lib/reporter.js')];
  const reporter = require('../lib/reporter.js');

  // Reset reporter state
  reporter.reset();

  // Add test orders
  reporter.trackOrder({
    orderNumber: '123-4567890-1234567',
    date: '2025-01-15',
    amount: '$29.99',
    products: 'Example Product',
    filePath: '2025-01/invoice-123-4567890-1234567.pdf'
  }, 'downloaded');

  reporter.trackOrder({
    orderNumber: '123-4567890-1234568',
    date: '2025-01-18',
    amount: '$49.99',
    products: 'Another Product',
    filePath: '2025-01/invoice-123-4567890-1234568.pdf'
  }, 'skipped');

  // Generate summary to temporary file
  const testSummaryPath = path.join(__dirname, '..', 'test-summary.txt');
  await reporter.generateSummary(testSummaryPath, '2025-01-01', '2025-12-31');

  // Read generated file
  const summaryContent = fs.readFileSync(testSummaryPath, 'utf8');

  // Verify content includes key sections
  expect(summaryContent).toContain('Amazon Invoice Download Summary');
  expect(summaryContent).toContain('Date Range: 2025-01-01 to 2025-12-31');
  expect(summaryContent).toContain('Order #123-4567890-1234567');
  expect(summaryContent).toContain('Status: Downloaded');
  expect(summaryContent).toContain('Order #123-4567890-1234568');
  expect(summaryContent).toContain('Status: Skipped (already exists)');
  expect(summaryContent).toContain('Summary Statistics:');
  expect(summaryContent).toContain('Total orders processed: 2');
  expect(summaryContent).toContain('Successfully downloaded: 1');
  expect(summaryContent).toContain('Skipped (already exist): 1');

  // Cleanup
  fs.unlinkSync(testSummaryPath);
});

// Test 3: Progress logging (verify it doesn't throw errors)
test('should log progress without errors', async () => {
  // Clear require cache
  delete require.cache[require.resolve('../lib/reporter.js')];
  const reporter = require('../lib/reporter.js');

  // These should not throw errors
  expect(() => {
    reporter.logProgress(1, 10, {
      orderNumber: '123-4567890-1234567',
      date: '2025-01-15',
      amount: '$29.99',
      products: 'Product A'
    }, 'downloaded', '2025-01/invoice-123-4567890-1234567.pdf');
  }).not.toThrow();

  expect(() => {
    reporter.logProgress(2, 10, {
      orderNumber: '123-4567890-1234568',
      date: '2025-01-18',
      amount: '$49.99',
      products: 'Product B'
    }, 'skipped', '2025-01/invoice-123-4567890-1234568.pdf');
  }).not.toThrow();
});

// Test 4: Statistics calculation with multiple order types
test('should calculate statistics for all order types', async () => {
  // Clear require cache
  delete require.cache[require.resolve('../lib/reporter.js')];
  const reporter = require('../lib/reporter.js');

  // Reset reporter state
  reporter.reset();

  // Add orders of each type
  reporter.trackOrder({ orderNumber: '1', date: '2025-01-01', amount: '$10', products: 'A' }, 'downloaded');
  reporter.trackOrder({ orderNumber: '2', date: '2025-01-02', amount: '$20', products: 'B' }, 'downloaded');
  reporter.trackOrder({ orderNumber: '3', date: '2025-01-03', amount: '$30', products: 'C' }, 'skipped');
  reporter.trackOrder({ orderNumber: '4', date: '2025-01-04', amount: '$40', products: 'D' }, 'no_invoice');
  reporter.trackOrder({ orderNumber: '5', date: '2025-01-05', amount: '$50', products: 'E' }, 'failed');

  const stats = reporter.getStats();

  expect(stats.total).toBe(5);
  expect(stats.downloaded).toBe(2);
  expect(stats.skipped).toBe(1);
  expect(stats.noInvoice).toBe(1);
  expect(stats.failed).toBe(1);
});
