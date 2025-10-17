# Changelog

All notable changes to the Amazon Invoice Automation project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
