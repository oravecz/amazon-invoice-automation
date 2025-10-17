# Specification: Amazon Invoice Automation

## Goal

Create a standalone Node.js CLI application that automates the download of Amazon order invoices using Playwright browser automation. The tool will authenticate users, filter orders by date range, download invoice PDFs organized by month, handle 2FA manually, skip existing files, and generate comprehensive progress reports.

## User Stories

- As an Amazon customer, I want to automatically download all my invoice PDFs for tax purposes so that I don't have to manually click through each order
- As a user, I want to specify a date range for invoices so that I can download only the invoices I need for a specific time period
- As a user, I want the script to skip invoices I've already downloaded so that I don't waste time re-downloading files
- As a user, I want clear console feedback during the download process so that I know the script is working and can see progress
- As a user, I want a summary report after completion so that I can verify which invoices were downloaded and which were skipped
- As a developer, I want to run the script in headed mode for debugging so that I can see what the browser is doing when issues occur
- As a user, I want the script to handle 2FA gracefully so that I can complete authentication manually and let the script continue

## Core Requirements

### Functional Requirements

- Authenticate to Amazon.com using email and password credentials stored in environment variables
- Navigate to Amazon's order history page for the specified date range
- Iterate through all orders within the specified date range
- For each order, check if an invoice is available and download it as a PDF
- Organize downloaded invoices in month-based folders using the format `YYYY-MM/invoice-{order-number}.pdf`
- Skip downloading invoices that already exist locally (no overwrites)
- Skip orders that don't have invoices available (e.g., digital orders, marketplace orders)
- Handle Amazon 2FA/CAPTCHA challenges by pausing indefinitely with clear console instructions
- Provide real-time console logging showing login status, progress, downloads, and skips
- Generate a `summary.txt` file containing order details (number, date, amount, products) and download status
- Support CLI arguments: `--from <date>`, `--to <date>`, `--debug`
- Default to current year date range if no dates provided
- Continue processing remaining orders when individual orders fail
- Close browser session properly on completion or interruption

### Non-Functional Requirements

- Performance: Run in headless mode by default for faster execution; enable headed mode with `--debug` flag
- Reliability: Implement robust selectors and wait strategies to handle Amazon's dynamic UI; retry transient network failures
- Usability: Provide clear, actionable console output with progress indicators; generate human-readable summary reports
- Security: Store credentials in `.env` file (gitignored); never log passwords or sensitive data
- Maintainability: Use modular code structure with clear separation of concerns; document selectors and navigation flow
- Error Handling: Log errors clearly; continue processing after failures; provide helpful error messages for common issues

## Visual Design

No visual assets provided. This is a command-line application with console-based output.

### Console Output Design

The CLI will provide structured console output:

```
Starting Amazon Invoice Automation...
Loaded credentials from .env
Launching browser (headless mode)...
Navigating to Amazon.com...
Logging in...

2FA REQUIRED: Please complete the two-factor authentication in the browser
Waiting for manual 2FA completion...
(Press Ctrl+C to cancel)

Login successful!
Filtering orders from 2025-01-01 to 2025-12-31...
Found 45 orders to process

Processing order 1/45: #123-4567890-1234567
  Date: 2025-01-15
  Amount: $29.99
  Product: Example Product Name
  ✓ Downloaded: 2025-01/invoice-123-4567890-1234567.pdf

Processing order 2/45: #123-4567890-1234568
  Date: 2025-01-18
  Amount: $49.99
  Product: Another Product
  ⊘ Skipped: Invoice already exists

Processing order 3/45: #123-4567890-1234569
  Date: 2025-02-03
  Amount: $15.99
  Product: Digital Item
  ⊘ Skipped: No invoice available

...

Summary:
- Total orders: 45
- Successfully downloaded: 38
- Skipped (already exist): 5
- No invoice available: 2
- Failed: 0

Detailed report saved to: summary.txt
Completed in 3m 42s
```

## Reusable Components

### Existing Code to Leverage

No existing code patterns identified in the current codebase. This is a greenfield standalone automation script.

### New Components Required

All components must be created from scratch:

- **Authentication Module**: Handle Amazon login, credential management, and 2FA detection
- **Order Navigation Module**: Navigate to order history, apply date filters, iterate through orders
- **Invoice Download Module**: Detect invoice availability, check for existing files, download PDFs
- **File System Module**: Create month-based directories, generate unique filenames, check file existence
- **Reporting Module**: Track progress, generate console output, create summary.txt file
- **CLI Argument Parser**: Parse and validate --from, --to, and --debug arguments
- **Error Handler**: Centralized error handling, logging, and recovery logic

## Technical Approach

### Technology Stack

- **Runtime**: Node.js (v18 or higher recommended)
- **Browser Automation**: Playwright (Chromium browser)
- **Environment Variables**: dotenv package
- **CLI Argument Parsing**: yargs or minimist
- **File System**: Node.js built-in `fs/promises` and `path` modules
- **Date Handling**: Native JavaScript Date object
- **Logging**: Console with optional color coding (chalk library optional)

### Project Structure

```
amazon-invoice-automation/
├── .env                    # Credentials (gitignored)
├── .gitignore             # Exclude .env, node_modules, invoices/
├── package.json           # Dependencies and scripts
├── package-lock.json
├── README.md              # Usage instructions
├── index.js               # Main CLI entry point
├── lib/                   # Core modules
│   ├── auth.js           # Authentication logic
│   ├── orders.js         # Order navigation and filtering
│   ├── invoices.js       # Invoice download logic
│   ├── filesystem.js     # File operations
│   ├── reporter.js       # Logging and summary generation
│   └── config.js         # Configuration and CLI parsing
├── YYYY-MM/              # Invoice folders (created dynamically)
│   └── invoice-*.pdf
└── summary.txt           # Generated report
```

### Core Modules

#### 1. Configuration Module (`lib/config.js`)

Responsibilities:
- Load environment variables from `.env` file
- Parse CLI arguments (--from, --to, --debug)
- Validate date ranges and set defaults (current year)
- Export configuration object for use by other modules

Key Functions:
- `loadConfig()`: Load and validate all configuration
- `validateDateRange(from, to)`: Ensure dates are valid and logical
- `getDefaultDateRange()`: Return current year start/end dates

#### 2. Authentication Module (`lib/auth.js`)

Responsibilities:
- Navigate to Amazon.com and initiate login
- Fill in email and password from environment variables
- Detect 2FA/CAPTCHA challenges
- Display console instructions and wait indefinitely for manual intervention
- Verify successful authentication

Key Functions:
- `login(page, email, password)`: Execute login flow
- `detect2FA(page)`: Check for 2FA prompts
- `waitFor2FA(page)`: Pause and wait for manual 2FA completion
- `verifyAuthentication(page)`: Confirm login success

Selectors Strategy:
- Use stable selectors (IDs, name attributes, ARIA labels)
- Implement fallback selectors for common Amazon UI variations
- Document all selectors with comments explaining their purpose

#### 3. Order Navigation Module (`lib/orders.js`)

Responsibilities:
- Navigate to Amazon order history page
- Apply date range filters to display only relevant orders
- Iterate through paginated order listings
- Extract order metadata (order number, date, amount, product names)

Key Functions:
- `navigateToOrders(page)`: Go to order history page
- `applyDateFilter(page, from, to)`: Filter orders by date range
- `getOrdersList(page)`: Extract all order elements from current page
- `extractOrderMetadata(orderElement)`: Parse order details
- `hasNextPage(page)`: Check for pagination
- `goToNextPage(page)`: Navigate to next page of orders

#### 4. Invoice Download Module (`lib/invoices.js`)

Responsibilities:
- Check if an invoice link exists for a given order
- Generate target file path based on order date and number
- Check if invoice file already exists locally
- Trigger invoice download and wait for completion
- Handle orders without invoices gracefully

Key Functions:
- `hasInvoice(orderElement)`: Check if invoice link is available
- `generateFilePath(orderDate, orderNumber)`: Create YYYY-MM/invoice-{number}.pdf path
- `fileExists(filePath)`: Check if invoice already downloaded
- `downloadInvoice(page, invoiceLink, targetPath)`: Download and save PDF
- `waitForDownload(downloadPath, timeout)`: Wait for PDF download to complete

Download Strategy:
- Use Playwright's download event handling
- Set download path to the appropriate YYYY-MM folder
- Implement timeout for download completion (30 seconds)
- Verify file integrity after download

#### 5. File System Module (`lib/filesystem.js`)

Responsibilities:
- Create month-based directories as needed
- Ensure proper file paths and naming conventions
- Verify file existence before downloads
- Handle file system errors gracefully

Key Functions:
- `ensureDirectoryExists(dirPath)`: Create directory if it doesn't exist
- `getMonthFolder(date)`: Convert date to YYYY-MM format
- `sanitizeFilename(filename)`: Remove invalid characters from filenames
- `checkDiskSpace()`: Optional: verify adequate disk space

#### 6. Reporting Module (`lib/reporter.js`)

Responsibilities:
- Track download statistics (total, successful, skipped, failed)
- Display real-time console progress updates
- Generate formatted summary.txt file
- Provide completion summary with statistics

Key Functions:
- `logProgress(orderIndex, totalOrders, orderData, status)`: Console logging
- `logError(message, error)`: Error logging
- `log2FAInstructions()`: Display 2FA instructions
- `trackOrder(orderData, status)`: Add to internal tracking
- `generateSummary(outputPath)`: Create summary.txt file
- `displayFinalStats()`: Show completion statistics

Summary File Format:
```
Amazon Invoice Download Summary
Generated: 2025-10-17 14:30:25
Date Range: 2025-01-01 to 2025-12-31

Order #123-4567890-1234567
  Date: 2025-01-15
  Amount: $29.99
  Product: Example Product Name
  Status: Downloaded
  File: 2025-01/invoice-123-4567890-1234567.pdf

Order #123-4567890-1234568
  Date: 2025-01-18
  Amount: $49.99
  Product: Another Product
  Status: Skipped (already exists)
  File: 2025-01/invoice-123-4567890-1234568.pdf

...

Summary Statistics:
- Total orders processed: 45
- Successfully downloaded: 38
- Skipped (already exist): 5
- No invoice available: 2
- Failed: 0
```

### Main Application Flow (`index.js`)

```
1. Parse CLI arguments and load configuration
2. Validate environment variables exist
3. Launch Playwright browser (headless unless --debug)
4. Navigate to Amazon.com
5. Execute login flow (handle 2FA if detected)
6. Navigate to order history page
7. Apply date range filter
8. For each order page:
   a. Get list of orders
   b. For each order:
      - Extract metadata
      - Check if invoice exists
      - If no invoice: log and skip
      - Generate file path
      - Check if file already exists
      - If exists: log and skip
      - Download invoice PDF
      - Track result in reporter
   c. Check for next page, continue if exists
9. Close browser
10. Generate summary.txt
11. Display final statistics
12. Exit with appropriate code (0 for success)
```

### Error Handling Strategy

Following the error handling best practices:

- **User-Friendly Messages**: All errors displayed to console use clear, actionable language (e.g., "Failed to log in. Please check credentials in .env file")
- **Fail Fast**: Validate configuration and credentials before launching browser; exit early if critical issues detected
- **Specific Error Types**: Catch and handle specific Playwright errors (TimeoutError, NavigationError) differently
- **Centralized Handling**: Main try-catch in index.js wraps the entire flow; individual modules throw errors up to be caught centrally
- **Graceful Degradation**: Individual order failures don't stop entire process; script continues with remaining orders
- **Retry Strategies**: Implement retry logic for transient network errors (max 3 retries with exponential backoff)
- **Clean Up Resources**: Always close browser in finally block, even on errors or CTRL+C interruption

Error Scenarios:

1. **Missing Credentials**: Check for AMAZON_EMAIL and AMAZON_PASSWORD in .env; fail fast with clear message
2. **Invalid Date Range**: Validate --from is before --to; provide helpful error
3. **Login Failure**: Detect failed login; provide actionable message about credentials
4. **Network Timeout**: Retry page navigation up to 3 times before failing
5. **Missing Invoice**: Log as info (not error); skip order and continue
6. **File Write Error**: Log error; skip order and continue
7. **Download Timeout**: Log error; mark order as failed and continue
8. **Interrupted Script**: Catch SIGINT (CTRL+C); close browser cleanly and save partial summary

### CLI Usage Examples

```bash
# Install dependencies
npm install

# Download all invoices from current year
node index.js

# Download invoices for specific date range
node index.js --from 2025-01-01 --to 2025-06-30

# Run in debug mode (show browser)
node index.js --debug

# Combination: specific range in debug mode
node index.js --from 2025-01-01 --to 2025-03-31 --debug
```

### Environment Variables

`.env` file format:
```
AMAZON_EMAIL=your-email@example.com
AMAZON_PASSWORD=your-password-here
```

Security considerations:
- Include `.env` in `.gitignore`
- Document .env.example with placeholder values
- Never log credential values
- Warn user if .env file is missing

### Testing Strategy

Following the test writing best practices (minimal testing during development):

**Core User Flow Tests Only**:
- Test successful login flow (mocked Amazon response)
- Test order iteration and metadata extraction
- Test invoice download with existing file skip
- Test summary.txt generation

**Deferred Testing**:
- Edge cases (empty order history, malformed dates)
- Error states (network failures, invalid credentials)
- 2FA handling (requires manual testing)
- Pagination edge cases

**Testing Approach**:
- Use Playwright's test utilities for browser automation tests
- Mock Amazon pages using local HTML fixtures
- Focus on behavior, not implementation details
- Keep tests fast by mocking external dependencies
- Manual testing in headed mode for 2FA and real Amazon interaction

**Test Files**:
```
tests/
├── config.test.js        # Configuration parsing
├── filesystem.test.js    # File operations
├── reporter.test.js      # Summary generation
└── integration.test.js   # End-to-end with mocked Amazon
```

## Out of Scope

The following features are explicitly excluded from this initial version:

- Handling returns/refunds differently from regular orders
- Processing archived orders (only current order history)
- Downloading order receipts (only invoices)
- Multi-account support (single Amazon account only)
- Automatic 2FA handling (user must complete manually)
- Email notifications upon completion
- Database storage of order metadata
- Web UI for configuration or monitoring
- Scheduling/cron job integration
- Cloud storage integration (S3, Google Drive, etc.)
- Invoice parsing or data extraction (OCR)
- Expense categorization or accounting integration
- Internationalization (Amazon.com only, not regional sites)

## Success Criteria

- User can successfully download all available invoices for a specified date range with a single command
- Script correctly authenticates to Amazon and handles 2FA by pausing for manual user intervention
- Invoices are organized into month-based folders (YYYY-MM) with order-number-based filenames
- Script skips re-downloading invoices that already exist locally
- Script gracefully skips orders without available invoices and continues processing
- Console output provides clear real-time progress updates
- summary.txt file accurately lists all processed orders with their download status
- Script runs in headless mode by default and can be switched to headed mode with --debug flag
- Individual order failures do not stop the entire process
- Browser session closes cleanly on completion or interruption
- All sensitive credentials are stored in .env file and never logged to console or files

## Implementation Notes

### Playwright Configuration

```javascript
const browser = await playwright.chromium.launch({
  headless: !config.debug, // Headed mode when --debug flag is set
  slowMo: config.debug ? 100 : 0, // Slow down actions in debug mode
});

const context = await browser.newContext({
  acceptDownloads: true,
  viewport: { width: 1280, height: 720 },
});

const page = await context.newPage();

// Set reasonable timeouts
page.setDefaultTimeout(30000); // 30 seconds for most operations
page.setDefaultNavigationTimeout(60000); // 60 seconds for page loads
```

### Selector Strategy

Prefer stable selectors in this order:
1. ID attributes (`#email`)
2. Name attributes (`input[name="email"]`)
3. ARIA labels (`button[aria-label="Submit"]`)
4. Data attributes (`[data-testid="invoice-link"]`)
5. Text content (last resort, may break with internationalization)

Document each selector with a comment explaining its purpose and fallback options.

### Wait Strategies

Use explicit waits for dynamic content:
```javascript
// Wait for element to be visible
await page.waitForSelector('#orderList', { state: 'visible' });

// Wait for navigation to complete
await Promise.all([
  page.waitForNavigation({ waitUntil: 'networkidle' }),
  page.click('#submitButton'),
]);

// Wait for download to start
const downloadPromise = page.waitForEvent('download');
```

### Graceful Shutdown

Handle CTRL+C interruption:
```javascript
process.on('SIGINT', async () => {
  console.log('\nInterrupted. Cleaning up...');
  await reporter.generateSummary('summary.txt');
  await browser.close();
  process.exit(0);
});
```

### Logging Best Practices

- Use clear, actionable messages
- Include timestamps for debugging (when errors occur)
- Use visual indicators (✓, ⊘, ✗) for status
- Show progress (e.g., "Processing 3/45")
- Provide context in error messages

### Dependencies

`package.json` dependencies:
```json
{
  "dependencies": {
    "playwright": "^1.40.0",
    "dotenv": "^16.3.1",
    "yargs": "^17.7.2"
  },
  "devDependencies": {
    "@playwright/test": "^1.40.0"
  }
}
```

### File Path Handling

- Use Node.js `path` module for cross-platform compatibility
- Always use absolute paths when working with Playwright downloads
- Sanitize order numbers to remove invalid filename characters
- Create directories recursively using `fs.promises.mkdir({ recursive: true })`

### Date Handling

- Parse CLI date arguments in ISO format (YYYY-MM-DD)
- Default to current year: January 1 to December 31
- Validate that --from date is before --to date
- Format dates for Amazon's UI (may need MM/DD/YYYY format)

### Performance Considerations

- Run headless by default (faster than headed mode)
- Implement reasonable waits (avoid arbitrary `setTimeout`)
- Download invoices in sequence (not parallel) to avoid overwhelming Amazon's servers
- Consider rate limiting if processing large number of orders (optional)

### Security Considerations

- Store credentials in `.env` file
- Add `.env` to `.gitignore` immediately
- Provide `.env.example` file with placeholder values
- Never log password values to console or files
- Clear any credential input fields after use (optional)
- Warn user if `.env` file has broad permissions (optional enhancement)

### Monitoring and Debugging

When --debug flag is used:
- Launch browser in headed mode
- Slow down actions (slowMo: 100)
- Keep browser open on errors for inspection
- Provide verbose console logging
- Optionally save screenshots on errors

Without --debug flag:
- Run headless for optimal performance
- Provide concise console output
- Close browser immediately on completion or error
