# Spec Requirements: Amazon Invoice Automation

## Initial Description
Use Playwright to automate Amazon invoice downloads. The system should:
1. Load https://amazon.com/
2. Sign in using credentials (amazon@visualxs.com/Birwag-4syvpu-jeqdaz)
3. Navigate to orders for the year 2025
4. Download invoices associated with each order from 2025

## Requirements Discussion

### First Round Questions

**Q1:** I assume this should be a standalone Node.js script rather than integrated into a larger application. Is that correct, or should it integrate with existing code?
**Answer:** Standalone Node.js CLI script

**Q2:** For credentials management, I'm thinking we should store AMAZON_EMAIL and AMAZON_PASSWORD in a .env file. Should we also include configuration for things like headless/headed mode, download directory, and date range in .env, or would you prefer these as CLI arguments?
**Answer:** Only credentials in .env; headed/headless should use --debug CLI option

**Q3:** For invoice storage, I propose organizing downloads in a folder structure like `invoices/2025/invoice-{order-number}.pdf`. Would you prefer a different organization (e.g., by month, by product category, flat structure)?
**Answer:** Option B - Organized by month like `2025-01/invoice-{order-number}.pdf`

**Q4:** I assume we should handle Amazon's 2FA/CAPTCHA by pausing the automation and allowing manual intervention. Is that correct, or do you have a preferred approach?
**Answer:** Pause indefinitely for manual 2FA interaction with clear instructions; wait indefinitely with clear console instructions

**Q5:** For error handling, should the script continue processing remaining orders if one fails, or stop immediately? Should we log failed downloads to a separate file?
**Answer:** Continue processing remaining orders; skip orders without invoices and log them

**Q6:** I'm thinking we should add a date range filter (e.g., `--from 2025-01-01 --to 2025-12-31`) rather than hardcoding 2025. Should we default to the current year if no dates are provided?
**Answer:** CLI arguments `--from` and `--to`; default to current year if not provided

**Q7:** For progress tracking, should we log to console, generate a summary report file, or both? What information would be most useful (e.g., total orders processed, successful downloads, skipped invoices)?
**Answer:** Console output + summary.txt file containing order numbers, dates, amounts, product names, and download status

**Q8:** If an invoice has already been downloaded (file exists), should we skip it, re-download and overwrite, or create a versioned copy?
**Answer:** Skip downloading if the invoice file already exists

**Q9:** Are there any specific features or scenarios we should explicitly exclude from this initial version? For example: handling returns/refunds differently, processing archived orders, downloading order receipts vs invoices, multi-account support?
**Answer:** Focus on basic invoice downloads; exclude returns/refunds, archived orders, and multi-account support for now

### Existing Code to Reference

No similar existing features identified for reference.

### Follow-up Questions

**Follow-up 1:** For the 2FA timeout, should the script wait indefinitely, or timeout after a certain period (e.g., 5 minutes)?
**Answer:** Wait indefinitely with clear console instructions

**Follow-up 2:** Should the `--debug` flag enable headed mode (showing the browser), or would you prefer it as a separate flag like `--headed`?
**Answer:** `--debug` flag for headed mode (default is headless)

## Visual Assets

### Files Provided:
No visual assets provided.

### Visual Insights:
Not applicable - no visual files were found in the planning/visuals folder.

## Requirements Summary

### Functional Requirements

**Core Functionality:**
- Automated login to Amazon using credentials from .env file
- Navigate to Amazon orders page
- Filter orders based on date range (default: current year)
- Iterate through each order in the filtered date range
- Download invoice PDFs for each order
- Skip orders that don't have invoices available
- Skip re-downloading invoices that already exist locally
- Handle 2FA/CAPTCHA with manual intervention
- Generate progress logs and summary report

**CLI Interface:**
- `--from <date>`: Start date for order filtering (optional, defaults to current year start)
- `--to <date>`: End date for order filtering (optional, defaults to current year end)
- `--debug`: Run in headed mode to show browser (default is headless)

**File Organization:**
- Invoices organized by month: `YYYY-MM/invoice-{order-number}.pdf`
- Example: `2025-01/invoice-123-4567890-1234567.pdf`

**Credentials Management:**
- Store in `.env` file:
  - `AMAZON_EMAIL`: Amazon account email
  - `AMAZON_PASSWORD`: Amazon account password

**Progress Tracking & Reporting:**
- Real-time console logging showing:
  - Login status
  - Orders being processed
  - Download progress
  - Skipped orders (already downloaded or no invoice)
  - Errors encountered
- Generate `summary.txt` file containing:
  - Order number
  - Order date
  - Order amount
  - Product names
  - Download status (success/skipped/failed)

**Error Handling:**
- Continue processing remaining orders if one fails
- Log orders without invoices (don't treat as errors)
- Gracefully handle network errors and retry if appropriate
- Clear error messages for authentication failures

**2FA/CAPTCHA Handling:**
- Pause automation when 2FA is detected
- Display clear console instructions for manual intervention
- Wait indefinitely for user to complete 2FA
- Resume automation after user interaction

**Duplicate Prevention:**
- Check if invoice file already exists before downloading
- Skip download if file is present (no overwrite)
- Log skipped duplicates in console and summary

### Non-Functional Requirements

**Performance:**
- Run in headless mode by default for faster execution
- Process orders efficiently without unnecessary delays
- Implement reasonable wait times for page loads and navigation

**Reliability:**
- Robust selector strategies to handle Amazon UI changes
- Retry logic for transient failures
- Graceful degradation when invoices aren't available

**Usability:**
- Clear console output showing progress
- Intuitive CLI arguments with sensible defaults
- Helpful error messages
- Easy-to-read summary report

**Security:**
- Store credentials in .env file (not in code)
- .env file should be in .gitignore
- No logging of sensitive credentials

**Maintainability:**
- Well-commented code
- Modular structure for easy updates
- Clear documentation of selectors and navigation flow

### Reusability Opportunities

No existing code patterns identified for reuse. This is a standalone automation script.

### Scope Boundaries

**In Scope:**
- Automated Amazon login with credentials
- Date-filtered order processing
- Invoice PDF downloads
- Month-based file organization
- Duplicate detection and skipping
- Manual 2FA handling with clear instructions
- Console and file-based progress reporting
- Headless/headed mode toggle
- Error handling with continued processing
- Summary report generation

**Out of Scope (Future Enhancements):**
- Handling returns/refunds differently
- Processing archived orders
- Downloading order receipts (vs invoices)
- Multi-account support
- Automatic 2FA handling
- Email notifications
- Database storage of order metadata
- Web UI for configuration/monitoring
- Scheduling/cron job integration
- Cloud storage integration
- Invoice parsing/data extraction
- Expense categorization

### Technical Considerations

**Technology Stack:**
- Node.js runtime
- Playwright for browser automation
- dotenv for environment variable management
- File system (fs) for file operations
- Command-line argument parsing (e.g., minimist or yargs)

**Browser Automation:**
- Use Playwright's Chromium browser
- Default to headless mode
- Enable headed mode with `--debug` flag
- Handle dynamic content loading
- Implement proper wait strategies for page loads

**File System:**
- Create month folders dynamically (YYYY-MM format)
- Use order numbers in filenames for easy reference
- Check file existence before downloading
- Ensure proper file permissions

**Date Handling:**
- Parse CLI date arguments (--from, --to)
- Default to current year if not provided
- Format dates appropriately for Amazon's interface

**Error Scenarios to Handle:**
- Login failures (invalid credentials)
- Network timeouts
- Missing invoice links
- File write errors
- Invalid date ranges
- 2FA/CAPTCHA challenges

**Dependencies:**
- playwright
- dotenv
- CLI argument parser (minimist or yargs)
- Standard Node.js modules (fs, path)

**File Structure:**
```
amazon-invoice-automation/
├── .env                    # Credentials (gitignored)
├── .gitignore
├── package.json
├── README.md
├── index.js               # Main CLI script
├── YYYY-MM/               # Invoice folders (created dynamically)
│   └── invoice-*.pdf
└── summary.txt            # Generated report
```

### Implementation Notes

**CLI Usage Examples:**
```bash
# Download all invoices from current year
node index.js

# Download invoices for specific date range
node index.js --from 2025-01-01 --to 2025-06-30

# Run in debug mode (show browser)
node index.js --debug

# Combination
node index.js --from 2025-01-01 --to 2025-03-31 --debug
```

**Environment File (.env):**
```
AMAZON_EMAIL=amazon@visualxs.com
AMAZON_PASSWORD=Birwag-4syvpu-jeqdaz
```

**Expected Console Output:**
```
Starting Amazon Invoice Automation...
Login successful!
Filtering orders from 2025-01-01 to 2025-12-31...
Found 45 orders to process.

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

[... continue for all orders ...]

Summary:
- Total orders: 45
- Successfully downloaded: 38
- Skipped (already exist): 5
- No invoice available: 2
- Failed: 0

Detailed report saved to: summary.txt
```

**Summary File Format (summary.txt):**
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

[... continue for all orders ...]

Summary Statistics:
- Total orders processed: 45
- Successfully downloaded: 38
- Skipped (already exist): 5
- No invoice available: 2
- Failed: 0
```

## Additional Technical Requirements

### Playwright Configuration
- Use appropriate timeouts for page navigation
- Implement explicit waits for dynamic content
- Use stable selectors (prefer data attributes or ARIA labels over CSS classes)
- Handle popups and cookie banners if present

### Logging Strategy
- Use clear, actionable log messages
- Include timestamps for debugging
- Color-code console output if possible (success=green, skip=yellow, error=red)
- Provide progress indicators (e.g., "Processing 3/45")

### Graceful Shutdown
- Handle CTRL+C interruptions
- Save partial progress if interrupted
- Close browser sessions properly

### Testing Considerations
- Test with both headed and headless modes
- Verify date range filtering works correctly
- Test duplicate detection
- Verify folder creation for new months
- Test 2FA flow with manual intervention
- Validate summary report generation
