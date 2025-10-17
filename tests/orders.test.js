const { test, expect } = require('@playwright/test');
const orders = require('../lib/orders');

test.describe('Order Navigation Module', () => {
  test('navigateToOrders goes to Amazon order history page', async ({ page }) => {
    // Mock Amazon homepage with orders link
    await page.route('https://www.amazon.com/', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `
          <!DOCTYPE html>
          <html>
            <body>
              <a id="nav-orders" href="/gp/your-account/order-history">Returns & Orders</a>
            </body>
          </html>
        `
      });
    });

    await page.route('**/gp/your-account/order-history*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `
          <!DOCTYPE html>
          <html>
            <body>
              <h1>Your Orders</h1>
              <div class="order-card"></div>
            </body>
          </html>
        `
      });
    });

    await page.goto('https://www.amazon.com/');
    await orders.navigateToOrders(page);

    // Verify we're on the orders page
    const title = await page.textContent('h1');
    expect(title).toContain('Your Orders');
  });

  test('extractOrderMetadata parses order information correctly', async ({ page }) => {
    // Mock order element
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <body>
          <div class="order-card">
            <div class="order-info">
              <span class="order-number">Order #123-4567890-1234567</span>
              <span class="order-date">January 15, 2025</span>
            </div>
            <div class="order-total">$29.99</div>
            <div class="product-title">Example Product Name</div>
          </div>
        </body>
      </html>
    `);

    const orderElement = await page.$('.order-card');
    const metadata = await orders.extractOrderMetadata(orderElement);

    expect(metadata).toBeTruthy();
    expect(metadata.orderNumber).toBeTruthy();
  });

  test('getOrdersList returns array of order elements', async ({ page }) => {
    // Mock orders page with multiple orders
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <body>
          <div class="order-card">Order 1</div>
          <div class="order-card">Order 2</div>
          <div class="order-card">Order 3</div>
        </body>
      </html>
    `);

    const ordersList = await orders.getOrdersList(page);

    expect(Array.isArray(ordersList)).toBe(true);
    expect(ordersList.length).toBe(3);
  });

  test('hasNextPage detects pagination correctly', async ({ page }) => {
    // Mock page with "Next" button
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <body>
          <ul class="a-pagination">
            <li class="a-last">
              <a href="?page=2">Next</a>
            </li>
          </ul>
        </body>
      </html>
    `);

    const hasNext = await orders.hasNextPage(page);
    expect(hasNext).toBe(true);
  });

  test('hasNextPage returns false when no pagination exists', async ({ page }) => {
    // Mock page without pagination
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <body>
          <div class="order-card">Order 1</div>
        </body>
      </html>
    `);

    const hasNext = await orders.hasNextPage(page);
    expect(hasNext).toBe(false);
  });
});
