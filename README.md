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

### Manual Authentication

Use manual authentication when you prefer to enter credentials yourself or encounter automated login issues:

```bash
# Manual authentication with default date range (current year)
node index.js --manual-auth

# Manual authentication with custom date range
node index.js --manual-auth --from 2025-01-01 --to 2025-06-30

# Manual authentication (short form)
node index.js -m
```

**Note:** When using `--manual-auth`, credentials in `.env` are NOT required. The browser will open in visible mode (headed) automatically, and you'll enter your credentials manually in the browser window.

## CLI Arguments

- `--from <date>` / `-f <date>`: Start date in YYYY-MM-DD format (default: January 1 of current year)
- `--to <date>` / `-t <date>`: End date in YYYY-MM-DD format (default: December 31 of current year)
- `--debug` / `-d`: Show browser window and slow down actions for debugging
- `--manual-auth` / `-m`: Use manual authentication instead of automated login (see Manual Authentication section below)

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

## Manual Authentication

The manual authentication feature (`--manual-auth` / `-m`) provides an alternative way to authenticate to Amazon by letting you manually enter your credentials in a visible browser window, rather than using automated login.

### When to Use Manual Authentication

Use manual authentication if:

- You prefer to enter credentials yourself for security reasons
- You encounter automated login failures or CAPTCHA challenges
- You have complex 2FA requirements that work better with manual entry
- You want full visibility into the authentication process
- You don't want to store credentials in the `.env` file
- You're debugging authentication issues

### How Manual Authentication Works

When you run the script with `--manual-auth`:

1. **Browser Opens**: The script launches a visible browser window and navigates to Amazon.com
2. **Manual Login**: You manually complete the entire login process yourself:
   - Click "Sign in" in the browser
   - Enter your email address
   - Enter your password
   - Complete any 2FA/CAPTCHA challenges
   - Wait for the Amazon home page to fully load
3. **Automatic Detection**: The script polls every 3 seconds to detect when you've successfully logged in
4. **Continues Normally**: Once authentication is detected, the script automatically continues to download invoices

### Usage Example

```bash
# Run with manual authentication
node index.js --manual-auth
```

**Console Output:**

```
=================================================
Starting Amazon Invoice Automation...
=================================================
Date range: 2025-01-01 to 2025-12-31
Browser mode: headed (manual authentication)
Authentication mode: MANUAL
=================================================

Launching browser (headed mode)...
Navigating to Amazon.com...

=================================================
MANUAL AUTHENTICATION REQUIRED
=================================================
Please complete the following steps:

1. The browser window is now open showing Amazon.com
2. Click "Sign in" in the browser
3. Enter your email and password manually
4. Complete any 2FA/CAPTCHA challenges
5. Wait for the Amazon home page to fully load
6. Do NOT close the browser window

The script will automatically detect when you're logged in
and continue downloading invoices.

Waiting for authentication... (Press Ctrl+C to cancel)
=================================================

Checking authentication status...
Checking authentication status...
Authentication detected!
Login successful!

Navigating to order history...
[... continues with invoice downloading ...]
```

### Important Notes

- **No Credentials Required**: When using `--manual-auth`, you don't need `AMAZON_EMAIL` or `AMAZON_PASSWORD` in your `.env` file
- **Always Visible Browser**: Manual authentication automatically enables headed (visible) browser mode - you cannot use manual auth in headless mode
- **10-Minute Timeout**: You have 10 minutes to complete authentication. After that, the script will timeout with an error
- **Don't Close Browser**: Keep the browser window open during authentication - the script needs it to detect when you're logged in
- **Works with All Date Ranges**: Manual authentication works with `--from` and `--to` parameters just like automated authentication

### Troubleshooting Manual Authentication

**Authentication Not Detected:**
- Make sure you've completed the full login flow and reached the Amazon home page
- Verify you see "Hello, [Your Name]" in the top-right corner of Amazon
- Wait a few seconds - the script checks every 3 seconds
- Check the console for "Checking authentication status..." messages

**Timeout Error:**
- If you exceed 10 minutes, the script will stop with an error
- This is normal - just run the script again with `--manual-auth`
- The timeout prevents the script from waiting indefinitely

**Browser Closed Accidentally:**
- If you close the browser before authentication completes, the script will error
- Just restart the script with `--manual-auth` and try again

**Multiple Login Attempts:**
- You can retry failed login attempts within the same 10-minute window
- The script will keep checking until you successfully authenticate or timeout

## Troubleshooting

### Login Failures

- Verify your credentials in the `.env` file are correct
- Check if Amazon requires 2FA (the script will pause for you to complete it)
- Try running with `--debug` flag to see what's happening in the browser
- Use `--manual-auth` flag to authenticate manually if automated login fails

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
- Requires manual 2FA completion in automated mode (cannot automate OTP codes) - use `--manual-auth` for full manual control
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
- **Manual Authentication Option**: Use `--manual-auth` to enter credentials directly in the browser if you prefer not to store them in `.env`
- **IMPORTANT**: Keep your `.env` file secure and never share it
- **IMPORTANT**: This tool requires your Amazon password - use at your own risk (or use `--manual-auth` to avoid storing credentials)

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
