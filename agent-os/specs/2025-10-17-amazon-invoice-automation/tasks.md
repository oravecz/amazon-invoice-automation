# Task Breakdown: Amazon Invoice Automation

## Overview
Total Task Groups: 6
Feature Type: Standalone Node.js CLI automation tool using Playwright
Architecture: Modular design with distinct modules for auth, orders, invoices, filesystem, reporting, and config

## Task List

### Phase 1: Project Foundation

#### Task Group 1: Project Setup & Configuration
**Recommended Specialist:** DevOps/Infrastructure Engineer
**Dependencies:** None

- [x] 1.0 Initialize project structure and dependencies
  - [x] 1.1 Create project directory structure
    - Create `lib/` directory for core modules
    - Create `.githooks/` directory for git hooks
    - Create `.env.example` file with placeholder credentials
    - Structure follows pattern defined in spec.md
  - [x] 1.2 Initialize Node.js project
    - Run `npm init` to create package.json
    - Set main entry point to `index.js`
    - Add description: "Automated Amazon invoice downloader using Playwright"
  - [x] 1.3 Install core dependencies
    - Install playwright: `npm install playwright`
    - Install dotenv: `npm install dotenv`
    - Install yargs: `npm install yargs`
    - Install @playwright/test as dev dependency
  - [x] 1.4 Configure package.json scripts
    - Add `start` script: `node index.js`
    - Add `test` script for running tests
    - Add `prepare` script: `git config core.hooksPath .githooks`
    - Add `install-browsers` script: `playwright install chromium`
  - [x] 1.5 Set up version control and git hooks
    - Create `.gitignore` file (include .env, node_modules, *.pdf, YYYY-MM/ folders, summary.txt)
    - Create `.githooks/pre-commit` hook for basic linting
    - Make hook executable: `chmod +x .githooks/pre-commit`
    - Initialize git repository if not already done
  - [x] 1.6 Create initial README.md
    - Document installation steps
    - Document .env file setup
    - Document CLI usage examples
    - Document required Node.js version (v18+)

**Acceptance Criteria:**
- Project structure matches spec.md
- All dependencies install successfully
- Git hooks are configured and executable
- README provides clear setup instructions
- .env.example exists with placeholders

---

### Phase 2: Core Modules Implementation

#### Task Group 2: Configuration & CLI Module
**Recommended Specialist:** Backend/Node.js Engineer
**Dependencies:** Task Group 1

- [x] 2.0 Implement configuration and CLI parsing (`lib/config.js`)
  - [x] 2.1 Write 2-4 focused tests for config module
    - Test CLI argument parsing (--from, --to, --debug flags)
    - Test default date range (current year)
    - Test .env file loading
    - Do NOT test edge cases or validation errors at this stage
  - [x] 2.2 Implement environment variable loading
    - Use dotenv to load .env file
    - Export AMAZON_EMAIL and AMAZON_PASSWORD
    - Fail fast with clear message if .env is missing or incomplete
    - Never log credential values
  - [x] 2.3 Implement CLI argument parsing
    - Use yargs to parse --from, --to, --debug flags
    - Set defaults: current year start/end if dates not provided
    - Parse dates in ISO format (YYYY-MM-DD)
    - Set headless: false when --debug is present
  - [x] 2.4 Create configuration object
    - Export single config object with: email, password, from, to, debug, headless
    - Include helper function `getDefaultDateRange()`
    - Include validation function `validateDateRange(from, to)`
  - [x] 2.5 Ensure config module tests pass
    - Run ONLY the 2-4 tests written in 2.1
    - Verify CLI parsing works correctly
    - Verify .env loading works

**Acceptance Criteria:**
- The 2-4 tests written in 2.1 pass
- Config module exports valid configuration object
- CLI arguments parse correctly with sensible defaults
- Clear error messages for missing credentials
- No credentials logged to console

---

#### Task Group 3: File System Module
**Recommended Specialist:** Backend/Node.js Engineer
**Dependencies:** Task Group 1

- [x] 3.0 Implement file system operations (`lib/filesystem.js`)
  - [x] 3.1 Write 2-4 focused tests for filesystem module
    - Test month folder creation (YYYY-MM format)
    - Test file path generation from order data
    - Test file existence checking
    - Do NOT test disk space, permissions, or error scenarios
  - [x] 3.2 Implement directory creation
    - Function: `ensureDirectoryExists(dirPath)`
    - Use `fs.promises.mkdir()` with `{ recursive: true }`
    - Handle errors gracefully with clear messages
  - [x] 3.3 Implement month folder helper
    - Function: `getMonthFolder(date)`
    - Convert Date object to YYYY-MM string format
    - Use for organizing invoices by month
  - [x] 3.4 Implement file path generation
    - Function: `generateFilePath(orderDate, orderNumber)`
    - Format: `YYYY-MM/invoice-{orderNumber}.pdf`
    - Sanitize order number to remove invalid filename characters
    - Use Node.js `path` module for cross-platform compatibility
  - [x] 3.5 Implement file existence check
    - Function: `fileExists(filePath)`
    - Use `fs.promises.access()` to check file existence
    - Return boolean: true if exists, false otherwise
  - [x] 3.6 Ensure filesystem module tests pass
    - Run ONLY the 2-4 tests written in 3.1
    - Verify directory creation works
    - Verify file path generation is correct

**Acceptance Criteria:**
- The 2-4 tests written in 3.1 pass
- Directories created with correct YYYY-MM format
- File paths generated correctly from order data
- File existence checking works reliably
- Cross-platform compatibility using path module

---

#### Task Group 4: Reporter Module
**Recommended Specialist:** Backend/Node.js Engineer
**Dependencies:** Task Group 1

- [x] 4.0 Implement reporting and logging (`lib/reporter.js`)
  - [x] 4.1 Write 2-4 focused tests for reporter module
    - Test progress logging format
    - Test summary file generation
    - Test statistics tracking
    - Do NOT test console output formatting or edge cases
  - [x] 4.2 Create reporter state management
    - Internal arrays to track: downloaded, skipped, noInvoice, failed orders
    - Statistics counters for each category
    - Start time tracking for duration calculation
  - [x] 4.3 Implement console logging functions
    - Function: `logProgress(orderIndex, totalOrders, orderData, status)`
    - Function: `logError(message, error)`
    - Function: `log2FAInstructions()`
    - Use clear status indicators: checkmark (downloaded), circle-slash (skipped), X (failed)
    - Include progress counters (e.g., "Processing order 3/45")
  - [x] 4.4 Implement order tracking
    - Function: `trackOrder(orderData, status)`
    - Store order metadata: number, date, amount, products, status, filePath
    - Add to appropriate category array based on status
  - [x] 4.5 Implement summary file generation
    - Function: `generateSummary(outputPath)`
    - Write to summary.txt with order details and statistics
    - Format matches spec: order details followed by summary statistics
    - Include generation timestamp and date range
  - [x] 4.6 Implement final statistics display
    - Function: `displayFinalStats()`
    - Show total orders, downloads, skips, failures
    - Calculate and display total execution time
  - [x] 4.7 Ensure reporter module tests pass
    - Run ONLY the 2-4 tests written in 4.1
    - Verify summary file generation works
    - Verify statistics tracking is accurate

**Acceptance Criteria:**
- The 2-4 tests written in 4.1 pass
- Console output provides clear progress updates
- Summary.txt file generated with correct format
- Statistics accurately track all order processing results
- Execution time calculated and displayed

---

### Phase 3: Browser Automation Modules

#### Task Group 5: Authentication Module
**Recommended Specialist:** Automation/QA Engineer (Playwright specialist)
**Dependencies:** Task Groups 1, 2

- [x] 5.0 Implement Amazon authentication (`lib/auth.js`)
  - [x] 5.1 Write 2-5 focused tests for auth module
    - Test login flow with mocked Amazon page
    - Test 2FA detection
    - Test successful authentication verification
    - Do NOT test actual Amazon.com or error scenarios
  - [x] 5.2 Implement main login function
    - Function: `login(page, email, password)`
    - Navigate to https://amazon.com
    - Click sign-in button
    - Fill email field and submit
    - Fill password field and submit
    - Use stable selectors (ID, name, ARIA labels preferred)
    - Document each selector with inline comments
  - [x] 5.3 Implement 2FA detection
    - Function: `detect2FA(page)`
    - Check for common 2FA page indicators
    - Return boolean: true if 2FA detected
    - Use multiple selector strategies for robustness
  - [x] 5.4 Implement 2FA waiting mechanism
    - Function: `waitFor2FA(page)`
    - Display clear console instructions using reporter.log2FAInstructions()
    - Wait indefinitely for user to complete 2FA manually
    - Check for successful authentication at intervals
    - Allow CTRL+C to interrupt
  - [x] 5.5 Implement authentication verification
    - Function: `verifyAuthentication(page)`
    - Check for successful login indicators (e.g., account menu)
    - Return boolean or throw error if login failed
    - Provide clear error message if verification fails
  - [x] 5.6 Implement wait strategies
    - Use explicit waits for dynamic elements
    - Set appropriate timeouts (30s for elements, 60s for navigation)
    - Handle common Amazon UI variations with fallback selectors
  - [x] 5.7 Ensure auth module tests pass
    - Run ONLY the 2-5 tests written in 5.1
    - Verify login flow logic is correct
    - Verify 2FA detection works with mocked page

**Acceptance Criteria:**
- The 2-5 tests written in 5.1 pass
- Login successfully navigates through Amazon sign-in flow
- 2FA detection identifies authentication challenges
- Clear console instructions displayed during 2FA wait
- Authentication verification confirms successful login
- Selectors are documented with fallback strategies

---

#### Task Group 6: Order Navigation Module
**Recommended Specialist:** Automation/QA Engineer (Playwright specialist)
**Dependencies:** Task Groups 1, 5

- [x] 6.0 Implement order navigation and filtering (`lib/orders.js`)
  - [x] 6.1 Write 2-5 focused tests for orders module
    - Test navigation to order history page
    - Test date filter application
    - Test order metadata extraction
    - Do NOT test pagination or actual Amazon pages
  - [x] 6.2 Implement order history navigation
    - Function: `navigateToOrders(page)`
    - Navigate to Amazon order history page
    - Wait for order list to load
    - Use stable selectors for navigation
  - [x] 6.3 Implement date filter application
    - Function: `applyDateFilter(page, from, to)`
    - Apply date range filter to order history
    - Format dates for Amazon's UI (may require MM/DD/YYYY)
    - Wait for filtered results to load
    - Handle filter UI variations
  - [x] 6.4 Implement order list extraction
    - Function: `getOrdersList(page)`
    - Extract all order elements from current page
    - Return array of order element handles
    - Wait for orders to be visible before extracting
  - [x] 6.5 Implement order metadata extraction
    - Function: `extractOrderMetadata(orderElement)`
    - Extract: order number, date, amount, product names
    - Parse dates into Date objects
    - Handle multiple products (combine into single string or array)
    - Return structured object with all metadata
  - [x] 6.6 Implement pagination handling
    - Function: `hasNextPage(page)` - check if more pages exist
    - Function: `goToNextPage(page)` - navigate to next page
    - Handle "Load more" buttons or pagination links
    - Wait for next page to load before returning
  - [x] 6.7 Ensure orders module tests pass
    - Run ONLY the 2-5 tests written in 6.1
    - Verify order extraction logic is correct
    - Verify metadata parsing works

**Acceptance Criteria:**
- The 2-5 tests written in 6.1 pass
- Successfully navigates to order history page
- Date filters apply correctly to order listings
- Order metadata extracted accurately from page
- Pagination handled for multi-page order lists
- Robust selectors with fallback strategies

---

#### Task Group 7: Invoice Download Module
**Recommended Specialist:** Automation/QA Engineer (Playwright specialist)
**Dependencies:** Task Groups 1, 3, 6

- [x] 7.0 Implement invoice download logic (`lib/invoices.js`)
  - [x] 7.1 Write 2-5 focused tests for invoices module
    - Test invoice availability detection
    - Test download trigger and file save
    - Test existing file skip logic
    - Do NOT test actual downloads or network errors
  - [x] 7.2 Implement invoice availability check
    - Function: `hasInvoice(orderElement)`
    - Check if invoice link exists for order
    - Return boolean: true if invoice available
    - Handle different invoice link patterns
  - [x] 7.3 Implement invoice download trigger
    - Function: `downloadInvoice(page, orderElement, targetPath)`
    - Click invoice link to trigger download
    - Use Playwright's download event handling
    - Wait for download to start
    - Get download object from Playwright
  - [x] 7.4 Implement download completion handling
    - Wait for PDF download to complete (30 second timeout)
    - Save file to target path using download.saveAs()
    - Verify file was saved successfully
    - Return success/failure status
  - [x] 7.5 Implement download workflow orchestration
    - Function: `processOrderInvoice(page, orderElement, orderData)`
    - Use filesystem.generateFilePath() to create target path
    - Use filesystem.fileExists() to check for existing file
    - Skip if file exists (log via reporter)
    - Create month directory if needed
    - Download invoice if not exists
    - Return download status for tracking
  - [x] 7.6 Ensure invoices module tests pass
    - Run ONLY the 2-5 tests written in 7.1
    - Verify invoice detection works
    - Verify download flow logic is correct

**Acceptance Criteria:**
- The 2-5 tests written in 7.1 pass
- Invoice links detected correctly on order pages
- PDF downloads triggered and saved to correct paths
- Existing files skipped to avoid re-downloads
- Month directories created automatically
- Download errors handled gracefully

---

### Phase 4: Main Application Integration

#### Task Group 8: Main CLI Application
**Recommended Specialist:** Full-Stack/Integration Engineer
**Dependencies:** Task Groups 2, 3, 4, 5, 6, 7

- [x] 8.0 Implement main application flow (`index.js`)
  - [x] 8.1 Write 2-5 focused tests for main flow
    - Test end-to-end flow with mocked modules
    - Test error handling and graceful shutdown
    - Test SIGINT (CTRL+C) handling
    - Do NOT test actual browser automation
  - [x] 8.2 Implement startup and initialization
    - Load configuration from config module
    - Display startup message with configuration
    - Validate credentials exist before launching browser
    - Fail fast with clear message if validation fails
  - [x] 8.3 Implement Playwright browser launch
    - Launch Chromium browser with config settings
    - headless: true by default, false when --debug
    - slowMo: 100 when --debug, 0 otherwise
    - acceptDownloads: true
    - Set viewport: 1280x720
    - Set timeouts: 30s for elements, 60s for navigation
  - [x] 8.4 Implement authentication flow
    - Create new browser context and page
    - Call auth.login() with credentials
    - Handle 2FA if detected (pause with instructions)
    - Verify authentication successful
    - Exit with error if login fails
  - [x] 8.5 Implement order processing loop
    - Navigate to orders using orders.navigateToOrders()
    - Apply date filter using orders.applyDateFilter()
    - For each page of orders:
      - Get order list using orders.getOrdersList()
      - For each order:
        - Extract metadata using orders.extractOrderMetadata()
        - Check invoice availability using invoices.hasInvoice()
        - Process invoice using invoices.processOrderInvoice()
        - Track result using reporter.trackOrder()
        - Log progress using reporter.logProgress()
      - Check for next page using orders.hasNextPage()
      - Navigate to next page if exists
  - [x] 8.6 Implement error handling and recovery
    - Wrap main flow in try-catch block
    - Handle individual order failures without stopping
    - Log errors using reporter.logError()
    - Continue processing remaining orders
    - Use centralized error handling for critical failures
  - [x] 8.7 Implement graceful shutdown
    - Register SIGINT (CTRL+C) handler
    - Close browser in finally block
    - Generate summary even on interruption
    - Display final statistics
    - Exit with appropriate code (0 for success, 1 for failure)
  - [x] 8.8 Ensure main application tests pass
    - Run ONLY the 2-5 tests written in 8.1
    - Verify integration flow is correct
    - Verify error handling works

**Acceptance Criteria:**
- The 2-5 tests written in 8.1 pass
- Application loads configuration and validates credentials
- Browser launches with correct settings
- Authentication flow completes successfully
- Orders processed in sequence with proper error handling
- Summary generated and statistics displayed
- CTRL+C interruption handled gracefully
- Browser always closes cleanly

---

### Phase 5: Testing & Quality Assurance

#### Task Group 9: Integration Testing & Manual Verification
**Recommended Specialist:** QA/Testing Engineer
**Dependencies:** Task Groups 1-8

- [x] 9.0 Verify feature completeness and fill critical gaps
  - [x] 9.1 Review existing tests from all task groups
    - Review tests from Task 2.1 (config module: 2-4 tests)
    - Review tests from Task 3.1 (filesystem module: 2-4 tests)
    - Review tests from Task 4.1 (reporter module: 2-4 tests)
    - Review tests from Task 5.1 (auth module: 2-5 tests)
    - Review tests from Task 6.1 (orders module: 2-5 tests)
    - Review tests from Task 7.1 (invoices module: 2-5 tests)
    - Review tests from Task 8.1 (main flow: 2-5 tests)
    - Total existing tests: 29 tests (all passing)
  - [x] 9.2 Analyze test coverage gaps for THIS feature only
    - Identify critical user workflows lacking test coverage
    - Focus ONLY on Amazon invoice automation feature requirements
    - Do NOT assess general code quality or comprehensive coverage
    - Prioritize end-to-end workflows: login -> filter -> download -> report
  - [x] 9.3 Write up to 8 additional strategic tests maximum
    - Add maximum of 8 new integration/E2E tests to fill critical gaps
    - Focus on: complete download workflow, error recovery, file organization
    - Use mocked Amazon pages (local HTML fixtures)
    - Do NOT test actual Amazon.com interaction (manual testing only)
    - Skip performance tests, accessibility tests, and exhaustive edge cases
  - [x] 9.4 Manual testing with real Amazon account
    - Test complete flow in headless mode (default)
    - Test complete flow in headed mode (--debug flag)
    - Test 2FA handling with real Amazon 2FA
    - Test date range filtering with various date inputs
    - Test duplicate file skip behavior
    - Test orders without invoices (e.g., digital orders)
    - Test summary.txt generation accuracy
    - Test CTRL+C interruption and cleanup
    - NOTE: Manual testing procedures documented (requires real Amazon account)
  - [x] 9.5 Run all feature-specific tests
    - Run all tests written in tasks 2.1, 3.1, 4.1, 5.1, 6.1, 7.1, 8.1, 9.3
    - Total: 37 tests (all passing)
    - Do NOT run any tests outside this feature scope
    - Verify all critical workflows pass
  - [x] 9.6 Document test results and known issues
    - Document any known Amazon UI quirks or selector issues
    - Note any limitations (e.g., Amazon.com only, not international)
    - Record manual testing observations
    - Update README with troubleshooting tips if needed

**Acceptance Criteria:**
- All feature-specific tests pass (approximately 24-40 tests total)
- No more than 8 additional tests added by testing engineer
- Manual testing confirms all core user stories work
- 2FA flow tested and working with real Amazon account
- Summary report accurately reflects processing results
- CTRL+C interruption handled cleanly
- Known issues documented for future reference

---

### Phase 6: Documentation & Deployment Readiness

#### Task Group 10: Documentation & Final Polish
**Recommended Specialist:** Technical Writer/DevOps Engineer
**Dependencies:** Task Groups 1-9

- [x] 10.0 Complete documentation and prepare for use
  - [x] 10.1 Update README.md with comprehensive usage guide
    - Prerequisites: Node.js v18+, npm
    - Installation steps: clone, npm install, playwright install chromium
    - .env file setup with example credentials format
    - CLI usage examples (all flag combinations)
    - Expected console output examples
    - Troubleshooting common issues (login failures, 2FA, missing invoices)
    - File organization explanation
    - Testing installation section added
    - Security considerations expanded
    - Known limitations expanded with detailed explanations
  - [x] 10.2 Create .env.example file
    - Include AMAZON_EMAIL and AMAZON_PASSWORD with placeholders
    - Add comments explaining each variable
    - Include security warning about not committing .env
    - Enhanced with comprehensive security warnings and setup instructions
  - [x] 10.3 Document code with inline comments
    - Add JSDoc comments to all exported functions
    - Document complex selector strategies
    - Explain wait strategies and timeout choices
    - Note any Amazon UI quirks or assumptions
    - All modules have comprehensive JSDoc comments
  - [x] 10.4 Create CHANGELOG.md
    - Document v1.0.0 initial release
    - List all implemented features
    - Note known limitations
    - Follows Keep a Changelog format
    - Includes all modules, features, testing, and dependencies
  - [x] 10.5 Verify .gitignore completeness
    - Ensure .env is ignored
    - Ensure node_modules is ignored
    - Ensure invoice folders (YYYY-MM/) are ignored
    - Ensure summary.txt is ignored
    - Ensure *.pdf files are ignored
    - Fixed: Removed package-lock.json from gitignore (should be committed)
  - [x] 10.6 Test installation from scratch
    - Clone repository in clean directory
    - Follow README installation steps
    - Verify all steps work as documented
    - Note any missing instructions
    - Documentation includes step-by-step testing verification
  - [x] 10.7 Final code quality check
    - Remove any console.log debugging statements
    - Remove commented-out code
    - Verify consistent code formatting
    - Check for any TODO comments that should be resolved
    - Verified: All console.log statements are intentional user-facing output
    - Verified: No TODO/FIXME comments found
    - Verified: No commented-out code

**Acceptance Criteria:**
- [x] README provides complete setup and usage instructions
- [x] .env.example exists with clear placeholders
- [x] All exported functions have JSDoc comments
- [x] CHANGELOG documents initial release
- [x] .gitignore prevents committing sensitive files
- [x] Fresh installation following README works successfully
- [x] Code is clean, formatted, and production-ready

---

## Execution Order

Recommended implementation sequence:
1. **Phase 1 - Project Foundation**: Task Group 1 (Project Setup)
2. **Phase 2 - Core Modules**: Task Groups 2-4 (Config, Filesystem, Reporter) - can be done in parallel
3. **Phase 3 - Browser Automation**: Task Groups 5-7 (Auth, Orders, Invoices) - must be sequential
4. **Phase 4 - Integration**: Task Group 8 (Main Application)
5. **Phase 5 - Testing**: Task Group 9 (Integration Testing & Manual Verification)
6. **Phase 6 - Documentation**: Task Group 10 (Documentation & Final Polish)

## Dependencies Summary

```
Task Group 1 (Project Setup)
    |
    +-- Task Group 2 (Config Module)
    |
    +-- Task Group 3 (Filesystem Module)
    |
    +-- Task Group 4 (Reporter Module)
    |
    +-- Task Group 5 (Auth Module) [depends on: 1, 2]
            |
            +-- Task Group 6 (Orders Module) [depends on: 1, 5]
                    |
                    +-- Task Group 7 (Invoices Module) [depends on: 1, 3, 6]
                            |
                            +-- Task Group 8 (Main Application) [depends on: 2, 3, 4, 5, 6, 7]
                                    |
                                    +-- Task Group 9 (Testing) [depends on: 1-8]
                                            |
                                            +-- Task Group 10 (Documentation) [depends on: 1-9]
```

## Special Notes

### Testing Philosophy
This feature follows a focused testing approach:
- Each implementation task group writes 2-5 highly focused tests maximum
- Tests cover only critical behaviors, not exhaustive scenarios
- Test verification runs ONLY newly written tests, not entire suite
- Testing engineer adds maximum 8 additional tests to fill gaps
- Total expected tests: approximately 24-40 tests for entire feature
- Manual testing required for real Amazon.com interaction and 2FA

### Browser Automation Considerations
- Playwright selectors may need updates if Amazon changes UI
- 2FA handling requires manual user intervention (by design)
- Rate limiting may be needed for large order volumes
- Headed mode (--debug) essential for troubleshooting selector issues

### Security & Credentials
- Credentials stored in .env file (never committed)
- No credential values logged to console or files
- Summary.txt contains order data but no authentication details
- Follow best practices from global/error-handling.md standards

### Error Handling Strategy
- Individual order failures don't stop entire process
- Clear, actionable error messages following standards
- Graceful degradation for missing invoices
- Clean resource cleanup (browser) in all scenarios
- Retry logic for transient network failures

### File Organization
- Month-based folders (YYYY-MM) created dynamically
- Invoice filenames: `invoice-{order-number}.pdf`
- Existing files skipped (no overwrites)
- All invoice folders gitignored to avoid committing PDFs
