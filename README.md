# Amazon Invoice Automation

Automated Amazon invoice downloader using Playwright browser automation. This CLI tool authenticates to your Amazon account, filters orders by date range, and downloads invoice PDFs organized by month.

## Features

- Automated login to Amazon.com with 2FA support
- Filter orders by date range
- Download invoices as PDF files
- Organize invoices in month-based folders (YYYY-MM)
- Skip already-downloaded invoices
- Handle orders without invoices gracefully
- Real-time console progress updates
- Generate detailed summary reports
- Debug mode with visible browser window

## Prerequisites

- Node.js v18 or higher
- npm package manager
- Amazon.com account

## Installation

1. Clone or download this repository
2. Install Node.js dependencies:

```bash
npm install
```

3. Install Playwright Chromium browser:

```bash
npm run install-browsers
```

4. Configure your Amazon credentials:

```bash
cp .env.example .env
```

Then edit `.env` file and add your Amazon credentials:

```
AMAZON_EMAIL=your-email@example.com
AMAZON_PASSWORD=your-password-here
```

**IMPORTANT**: Never commit the `.env` file to version control. It contains sensitive credentials.

## Usage

### Basic Usage

Download all invoices from the current year:

```bash
npm start
```

or

```bash
node index.js
```

### Specify Date Range

Download invoices for a specific date range:

```bash
node index.js --from 2025-01-01 --to 2025-06-30
```

### Debug Mode

Run with visible browser window for troubleshooting:

```bash
node index.js --debug
```

### Combined Options

Specify date range and enable debug mode:

```bash
node index.js --from 2025-01-01 --to 2025-03-31 --debug
```

## CLI Arguments

- `--from <date>`: Start date in YYYY-MM-DD format (default: January 1 of current year)
- `--to <date>`: End date in YYYY-MM-DD format (default: December 31 of current year)
- `--debug`: Show browser window and slow down actions for debugging

## Output

### Console Output

The tool provides real-time progress updates:

```
Starting Amazon Invoice Automation...
Loaded credentials from .env
Launching browser (headless mode)...
Navigating to Amazon.com...
Logging in...

Login successful!
Filtering orders from 2025-01-01 to 2025-12-31...
Found 45 orders to process

Processing order 1/45: #123-4567890-1234567
  Date: 2025-01-15
  Amount: $29.99
  Product: Example Product Name
  Downloaded: 2025-01/invoice-123-4567890-1234567.pdf

Processing order 2/45: #123-4567890-1234568
  Date: 2025-01-18
  Amount: $49.99
  Product: Another Product
  Skipped: Invoice already exists

Summary:
- Total orders: 45
- Successfully downloaded: 38
- Skipped (already exist): 5
- No invoice available: 2
- Failed: 0

Detailed report saved to: summary.txt
Completed in 3m 42s
```

### File Organization

Downloaded invoices are organized by month:

```
2025-01/
  invoice-123-4567890-1234567.pdf
  invoice-123-4567890-1234568.pdf
2025-02/
  invoice-123-4567890-1234569.pdf
summary.txt
```

### Summary Report

A `summary.txt` file is generated with detailed information about each processed order:

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

...
```

## Two-Factor Authentication (2FA)

If Amazon prompts for two-factor authentication:

1. The script will pause and display instructions
2. Complete the 2FA challenge manually in the browser window
3. The script will automatically continue once authentication succeeds
4. Press Ctrl+C to cancel if needed

Example console output:

```
2FA REQUIRED: Please complete the two-factor authentication in the browser
Waiting for manual 2FA completion...
(Press Ctrl+C to cancel)
```

## Troubleshooting

### Login Failures

- Verify your credentials in the `.env` file are correct
- Check if Amazon requires 2FA (the script will pause for you to complete it)
- Try running with `--debug` flag to see what's happening in the browser

### No Invoices Found

Some orders may not have invoices available:
- Digital items (e.g., Kindle books, digital downloads)
- Marketplace orders from third-party sellers
- Gift purchases

The script will skip these orders and note them in the summary.

### Downloads Not Working

- Ensure you have write permissions in the current directory
- Check available disk space
- Try running with `--debug` to see browser interactions

### Interrupted Script

If you press Ctrl+C during execution:
- The browser will close cleanly
- A partial summary will be generated
- Downloaded files are preserved
- You can re-run the script (it will skip existing files)

## Known Limitations

- Only works with Amazon.com (not international Amazon sites like amazon.co.uk, amazon.de, etc.)
- Requires manual 2FA completion (cannot automate OTP codes)
- Does not handle archived orders (only current order history visible in your account)
- Downloads one invoice at a time (sequential, not parallel) to avoid rate limiting
- Amazon may update their UI, requiring selector updates in the code
- Does not process returns/refunds differently from regular orders
- Cannot download receipts (only invoices)
- Some orders may not have invoices (digital items, marketplace orders, gift purchases)

## Security Considerations

- Credentials are stored locally in `.env` file (never committed to git)
- Passwords are never logged to console or files
- Summary report contains order data but no authentication details
- All downloads happen locally on your machine
- Browser automation uses official Playwright library
- No data is sent to third-party servers
- **IMPORTANT**: Keep your `.env` file secure and never share it
- **IMPORTANT**: This tool requires your Amazon password - use at your own risk

## Testing Installation

To verify the installation is working correctly:

1. Ensure all dependencies are installed:
```bash
npm install
npm run install-browsers
```

2. Verify your Node.js version is 18 or higher:
```bash
node --version
```

3. Check that your `.env` file exists and contains credentials:
```bash
cat .env
```

4. Run the script with debug mode to verify browser launches:
```bash
node index.js --debug
```

5. If authentication works, press Ctrl+C to cancel and run normally:
```bash
node index.js
```

## Project Structure

```
amazon-invoice-automation/
├── index.js              # Main CLI entry point
├── lib/                  # Core modules
│   ├── auth.js          # Amazon authentication
│   ├── config.js        # Configuration & CLI parsing
│   ├── filesystem.js    # File operations
│   ├── invoices.js      # Invoice download logic
│   ├── orders.js        # Order navigation
│   └── reporter.js      # Progress tracking & reporting
├── tests/               # Test files
├── .env                 # Your credentials (gitignored)
├── .env.example         # Example credentials file
├── package.json         # Dependencies
└── README.md            # This file
```

## Node.js Version

This project requires Node.js v18 or higher. Check your version:

```bash
node --version
```

## License

ISC
