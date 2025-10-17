/**
 * Order Navigation Module
 * Handles navigation to Amazon order history, filtering, and order metadata extraction
 */

/**
 * Navigates to Amazon order history page
 * @param {import('playwright').Page} page - Playwright page instance
 * @returns {Promise<void>}
 */
async function navigateToOrders(page) {
  // Click on "Returns & Orders" link in navigation
  // Selector: #nav-orders is Amazon's standard ID for orders link
  await page.click('#nav-orders');

  // Wait for order history page to load
  // Wait for order container or heading to be visible
  try {
    await page.waitForSelector('.order-card, .order', { state: 'visible', timeout: 15000 });
  } catch (error) {
    // If no orders exist, the page might show "no orders" message
    // Just wait for page load to complete
    await page.waitForLoadState('networkidle');
  }
}

/**
 * Applies date range filter to Amazon order history
 * @param {import('playwright').Page} page - Playwright page instance
 * @param {Date} fromDate - Start date for filter
 * @param {Date} toDate - End date for filter
 * @returns {Promise<void>}
 */
async function applyDateFilter(page, fromDate, toDate) {
  // Amazon uses a dropdown for time range filtering
  // Common selector: select for time filter or custom date range

  // First, try to find the time filter dropdown
  const timeFilterSelector = '#time-filter, select[name="timeFilter"], .order-filter-options select';

  try {
    await page.waitForSelector(timeFilterSelector, { state: 'visible', timeout: 10000 });

    // Determine which option to select based on date range
    const currentYear = new Date().getFullYear();
    const fromYear = fromDate.getFullYear();
    const toYear = toDate.getFullYear();

    // If filtering by current year, select "year-YYYY" option
    if (fromYear === currentYear && toYear === currentYear) {
      await page.selectOption(timeFilterSelector, `year-${currentYear}`);
    } else if (fromYear === toYear) {
      // Single year filter
      await page.selectOption(timeFilterSelector, `year-${fromYear}`);
    } else {
      // For multi-year ranges, select "archived orders" or custom range
      // This might require additional UI interaction
      await page.selectOption(timeFilterSelector, { label: 'Archived Orders' });
    }

    // Wait for filtered results to load
    await page.waitForLoadState('networkidle');

  } catch (error) {
    // If time filter not found, log warning but continue
    console.warn('Warning: Could not find date filter dropdown. Proceeding with default order list.');
  }
}

/**
 * Gets list of all order elements on current page
 * @param {import('playwright').Page} page - Playwright page instance
 * @returns {Promise<Array>} Array of order element handles
 */
async function getOrdersList(page) {
  // Wait for orders to be visible
  await page.waitForSelector('.order-card, .order', { state: 'visible', timeout: 15000 });

  // Get all order elements
  // Amazon uses various class names: .order-card, .order, .a-box-group
  const orderElements = await page.$$('.order-card, .order, .a-box-group.a-spacing-base.order');

  return orderElements;
}

/**
 * Extracts order metadata from an order element
 * @param {import('playwright').ElementHandle} orderElement - Order element handle
 * @returns {Promise<Object>} Order metadata object
 */
async function extractOrderMetadata(orderElement) {
  try {
    // Extract order number
    // Amazon typically displays order number with text like "Order # 123-4567890-1234567"
    const orderNumberElement = await orderElement.$('.order-number, .order-info-value, [class*="order-number"]');
    let orderNumber = '';
    if (orderNumberElement) {
      const orderText = await orderNumberElement.textContent();
      // Extract just the number part (format: 123-4567890-1234567)
      const match = orderText.match(/(\d{3}-\d{7}-\d{7})/);
      orderNumber = match ? match[1] : orderText.trim();
    }

    // Extract order date
    // Amazon shows dates like "Ordered on January 15, 2025" or "January 15, 2025"
    const dateElement = await orderElement.$('.order-date, .a-color-secondary.value, [class*="order-date"]');
    let orderDate = new Date();
    if (dateElement) {
      const dateText = await dateElement.textContent();
      // Parse the date text
      orderDate = new Date(dateText.replace(/Ordered on /i, '').trim());
    }

    // Extract order total
    const totalElement = await orderElement.$('.order-total, .grand-total-price, [class*="order-total"]');
    let total = '$0.00';
    if (totalElement) {
      total = (await totalElement.textContent()).trim();
    }

    // Extract product names
    const productElements = await orderElement.$$('.product-title, .a-link-normal[href*="/dp/"], .yohtmlc-product-title');
    const products = [];
    for (const productElement of productElements) {
      const productText = await productElement.textContent();
      if (productText && productText.trim()) {
        products.push(productText.trim());
      }
    }

    // If no products found, try alternative selector
    if (products.length === 0) {
      const altProductElements = await orderElement.$$('img[alt]');
      for (const imgElement of altProductElements) {
        const alt = await imgElement.getAttribute('alt');
        if (alt && alt.trim() && !alt.includes('logo') && !alt.includes('icon')) {
          products.push(alt.trim());
        }
      }
    }

    return {
      orderNumber,
      date: orderDate,
      total,
      products: products.length > 0 ? products : ['Unknown Product'],
    };
  } catch (error) {
    console.error('Error extracting order metadata:', error.message);
    return {
      orderNumber: 'Unknown',
      date: new Date(),
      total: '$0.00',
      products: ['Unknown Product'],
    };
  }
}

/**
 * Checks if there is a next page of orders
 * @param {import('playwright').Page} page - Playwright page instance
 * @returns {Promise<boolean>} True if next page exists
 */
async function hasNextPage(page) {
  // Amazon uses pagination with "Next" button or link
  // Check for next page link in pagination
  const nextPageSelectors = [
    'ul.a-pagination li.a-last:not(.a-disabled) a', // Amazon standard pagination
    'a[aria-label="Next"]',
    '.a-pagination .a-last a',
    'a:has-text("Next")',
  ];

  for (const selector of nextPageSelectors) {
    try {
      const nextButton = await page.$(selector);
      if (nextButton) {
        return true;
      }
    } catch (error) {
      // Continue checking other selectors
    }
  }

  return false;
}

/**
 * Navigates to the next page of orders
 * @param {import('playwright').Page} page - Playwright page instance
 * @returns {Promise<void>}
 */
async function goToNextPage(page) {
  // Click the "Next" button in pagination
  const nextPageSelectors = [
    'ul.a-pagination li.a-last:not(.a-disabled) a',
    'a[aria-label="Next"]',
    '.a-pagination .a-last a',
  ];

  for (const selector of nextPageSelectors) {
    try {
      const nextButton = await page.$(selector);
      if (nextButton) {
        await nextButton.click();
        // Wait for next page to load
        await page.waitForLoadState('networkidle');
        // Wait for orders to be visible on new page
        await page.waitForSelector('.order-card, .order', { state: 'visible', timeout: 10000 });
        return;
      }
    } catch (error) {
      // Continue trying other selectors
    }
  }

  throw new Error('Could not find next page button');
}

module.exports = {
  navigateToOrders,
  applyDateFilter,
  getOrdersList,
  extractOrderMetadata,
  hasNextPage,
  goToNextPage,
};
