# Changelog

All notable changes to the Amazon Invoice Automation project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-10-17

### Added

#### Manual Authentication Feature

A new `--manual-auth` CLI parameter that enables manual authentication mode, allowing users to manually enter their Amazon credentials in a visible browser window instead of using automated login.

**New CLI Parameter:**
- `--manual-auth` / `-m`: Use manual authentication instead of automated login

**What Changed:**

**lib/config.js:**
- Added `--manual-auth` CLI parameter with alias `-m`
- Modified credential validation to skip email/password checks when `manualAuth` is true
- Updated headless mode logic to automatically force headed mode when manual auth is enabled
- Added `manualAuth` flag to exported config object
- Updated error messages to suggest using `--manual-auth` when credentials are missing

**lib/auth.js:**
- Added new `manualLogin(page)` function for manual authentication workflow
- Comprehensive JSDoc documentation with polling configuration details
- Navigates to Amazon.com home page and waits for user to authenticate manually
- Polls every 3 seconds to detect when authentication is complete
- 10-minute timeout for authentication completion
- Clear console instructions displayed to guide users through manual login process
- Reuses existing `verifyAuthentication()` function for logged-in state detection
- Exported `manualLogin` alongside existing authentication functions

**lib/reporter.js:**
- Updated `logStartup()` function to display authentication mode (MANUAL vs AUTOMATED)
- Modified startup message to show browser mode context (manual authentication, debug, or headless)
- Conditionally hide credentials message when manual auth is enabled
- Enhanced browser mode message with contextual information

**index.js:**
- Added conditional authentication flow based on `config.manualAuth` flag
- When manual auth enabled: calls `auth.manualLogin(page)`
- When manual auth disabled: uses existing automated `auth.login()` flow
- 2FA detection and waiting only happens in automated mode
- Both authentication modes use shared `verifyAuthentication()` check
- Added console message "Manual authentication mode enabled" for clarity

**Behavioral Changes:**
- Credentials in `.env` file are now optional when using `--manual-auth`
- Manual authentication automatically enables headed (visible) browser mode
- Debug flag is effectively redundant with manual auth (both enable headed mode)
- Authentication timeout is 10 minutes for manual auth vs 5 minutes for automated 2FA

**Usage Examples:**
```bash
# Manual authentication with default date range
node index.js --manual-auth

# Manual authentication with custom date range
node index.js --manual-auth --from 2025-01-01 --to 2025-06-30

# Manual authentication (short form)
node index.js -m
```

**Benefits:**
- Users can avoid storing credentials in `.env` file for enhanced security
- Bypasses automated login failures and CAPTCHA challenges
- Provides full visibility into the authentication process
- Useful for debugging authentication issues
- Works with all 2FA methods since user completes authentication manually

**Testing:**
- 19 comprehensive automated tests covering manual authentication feature
- Unit tests for configuration parsing, manual login flow, and reporter updates
- Integration tests for authentication flow switching and error handling
- Edge case tests for timeouts, already-authenticated sessions, and polling logic

**Documentation:**
- Comprehensive README.md section explaining manual authentication
- Usage examples and troubleshooting tips
- Updated CLI help text
- Enhanced JSDoc comments with polling configuration details
- Inline code comments explaining timeout rationale

### Files Modified
- `lib/config.js` - CLI parameter and configuration logic
- `lib/auth.js` - Manual authentication workflow
- `lib/reporter.js` - Startup message enhancements
- `index.js` - Authentication flow integration
- `README.md` - User documentation and examples
- `CHANGELOG.md` - This file
- `.env.example` - Added manual auth note
- Test files for all modified modules

## [1.0.0] - 2025-10-17

### Initial Release

This is the first production-ready release of Amazon Invoice Automation, a CLI tool that automates downloading invoice PDFs from Amazon.com.

### Features

#### Core Functionality
- **Amazon Authentication**: Automated login to Amazon.com with email and password
- **Two-Factor Authentication Support**: Manual 2FA completion with clear console instructions
- **Date Range Filtering**: Download invoices for specific date ranges using `--from` and `--to` flags
- **Invoice Download**: Automated PDF download for all available invoices
- **File Organization**: Invoices organized into month-based folders (YYYY-MM format)
- **Duplicate Detection**: Automatically skips already-downloaded invoices
- **Missing Invoice Handling**: Gracefully handles orders without available invoices

#### CLI Features
- **Default Date Range**: Downloads current year invoices when no dates specified
- **Debug Mode**: `--debug` flag launches visible browser window with slowed actions
- **Headless Mode**: Runs headless by default for optimal performance
- **Progress Tracking**: Real-time console output showing download progress
- **Summary Report**: Generates `summary.txt` with detailed order information and statistics

#### Technical Features
- **Modular Architecture**: Clean separation of concerns across 6 core modules
  - `auth.js`: Amazon authentication and 2FA handling
  - `config.js`: Configuration management and CLI argument parsing
  - `filesystem.js`: File operations and directory management
  - `invoices.js`: Invoice detection and download logic
  - `orders.js`: Order navigation and metadata extraction
  - `reporter.js`: Progress tracking and summary generation
- **Error Handling**: Individual order failures don't stop the entire process
- **Graceful Shutdown**: CTRL+C interruption generates partial summary and closes browser cleanly
- **Cross-Platform**: Works on macOS, Linux, and Windows

#### Security Features
- **Environment Variables**: Credentials stored in `.env` file (gitignored)
- **No Credential Logging**: Passwords never logged to console or files
- **Local Processing**: All operations happen locally, no third-party servers

### Dependencies
- Node.js >= 18.0.0
- Playwright ^1.56.1
- dotenv ^17.2.3
- yargs ^18.0.0

### Testing
- **37 Automated Tests**: Comprehensive test coverage across all modules
- **Unit Tests**: All core modules tested with focused tests
- **Integration Tests**: End-to-end workflow testing with mocked Amazon pages
- **Manual Testing**: Real Amazon.com interaction verified

### Documentation
- Comprehensive README.md with usage examples
- JSDoc comments on all exported functions
- Inline code comments explaining selectors and wait strategies
- .env.example with security warnings
- Installation and troubleshooting guides

### Known Limitations
- Amazon.com only (not international sites)
- Manual 2FA completion required
- Sequential downloads (not parallel)
- Current order history only (no archived orders)
- Amazon UI changes may require selector updates

### Browser Support
- Chromium via Playwright (automatically installed)

---

## Future Releases

### Planned Features (Not Yet Implemented)
- Multi-account support
- Email notifications on completion
- Cloud storage integration (S3, Google Drive)
- Support for international Amazon sites
- Scheduled/cron job integration
- Invoice data extraction and parsing

---

## Version History

- **1.0.0** (2025-10-17): Initial release with core functionality
