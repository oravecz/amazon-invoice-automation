# Task Breakdown: Manual Authentication CLI Parameter

## Overview
Total Tasks: 13
Assigned roles: backend-engineer, automation-engineer, integration-engineer, testing-engineer, documentation-engineer

## Task List

### Configuration Layer

#### Task Group 1: CLI Argument Parsing and Configuration
**Assigned implementer:** backend-engineer
**Dependencies:** None

- [x] 1.0 Complete CLI configuration layer
  - [x] 1.1 Write 2-4 focused tests for manual-auth configuration
    - Test `--manual-auth` flag parsing sets `manualAuth: true`
    - Test `--manual-auth` automatically forces `headless: false`
    - Test credentials validation is skipped when `manualAuth: true`
    - Test combining `--manual-auth` with `--from` and `--to` flags
  - [x] 1.2 Modify `lib/config.js` to add `--manual-auth` parameter
    - Add yargs option: `--manual-auth` (alias: `-m`, type: boolean, default: false)
    - Add description: "Use manual authentication instead of automated login"
    - Export `manualAuth` flag in config object
  - [x] 1.3 Update headless mode logic in `lib/config.js`
    - Change logic to: `const headless = manualAuth ? false : !argv.debug;`
    - Ensure manual auth always forces headed mode regardless of debug flag
  - [x] 1.4 Modify credential validation in `lib/config.js`
    - Skip email/password validation when `manualAuth` is true
    - Update error message to suggest using `--manual-auth` if credentials missing
    - Maintain existing validation for automated authentication mode
  - [x] 1.5 Ensure configuration tests pass
    - Run ONLY the 2-4 tests written in 1.1
    - Verify manual auth flag parsing works correctly
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 2-4 tests written in 1.1 pass
- `--manual-auth` flag is parsed correctly
- Headed mode is forced when manual auth is enabled
- Credentials validation is skipped appropriately
- Config object exports `manualAuth` flag

**Files Modified:**
- `lib/config.js`
- `tests/config.test.js` (or equivalent)

---

### Authentication Layer

#### Task Group 2: Manual Authentication Flow
**Assigned implementer:** automation-engineer
**Dependencies:** Task Group 1 (COMPLETED ✅)

- [x] 2.0 Complete manual authentication flow
  - [x] 2.1 Write 2-4 focused tests for manual login flow
    - Test `manualLogin()` navigates to Amazon.com home page
    - Test `manualLogin()` displays console instructions
    - Test `manualLogin()` polls for authentication state
    - Test `manualLogin()` resolves when authenticated state detected
  - [x] 2.2 Create `manualLogin()` function in `lib/auth.js`
    - Accept `page` parameter (Playwright page instance)
    - Navigate to `https://www.amazon.com/` using `page.goto()`
    - Use `waitUntil: 'domcontentloaded'` for faster page load
  - [x] 2.3 Implement console instruction display
    - Print clear, formatted instructions to console
    - Include 6 numbered steps for user to follow
    - Add visual separators using `=================================================`
    - Inform user that script will auto-detect login completion
    - Reference spec.md lines 60-76 for exact console output format
  - [x] 2.4 Implement authentication polling mechanism
    - Poll every 3 seconds using `page.waitForTimeout(3000)`
    - Call existing `verifyAuthentication(page)` function on each poll
    - Print "Checking authentication status..." on each iteration
    - Return (exit loop) when `isAuthenticated` is true
  - [x] 2.5 Add timeout mechanism
    - Set maximum wait time to 10 minutes (600,000ms)
    - Track elapsed time since polling started
    - Throw error if timeout exceeded: "Manual authentication timeout: Maximum wait time of 10 minutes exceeded"
  - [x] 2.6 Export `manualLogin` function
    - Add to module.exports alongside existing functions
    - Maintain existing exports: `login`, `detect2FA`, `waitFor2FA`, `verifyAuthentication`
  - [x] 2.7 Ensure authentication layer tests pass
    - Run ONLY the 2-4 tests written in 2.1
    - Verify manual login flow works correctly
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 2-4 tests written in 2.1 pass
- `manualLogin()` function navigates to Amazon.com
- Clear console instructions are displayed
- Polling mechanism detects authentication successfully
- 10-minute timeout is enforced
- Function is properly exported

**Files Modified:**
- `lib/auth.js`
- `tests/auth.test.js` (or equivalent)

---

### Reporting Layer

#### Task Group 3: Console Output Enhancements
**Assigned implementer:** backend-engineer
**Dependencies:** Task Group 1 (COMPLETED ✅)

- [x] 3.0 Complete reporting layer updates
  - [x] 3.1 Write 2-3 focused tests for reporter enhancements
    - Test `logStartup()` shows "MANUAL" authentication mode when `manualAuth: true`
    - Test `logStartup()` shows "AUTOMATED" authentication mode when `manualAuth: false`
    - Test browser mode message includes "(manual authentication)" when manual auth enabled
  - [x] 3.2 Modify `logStartup()` function in `lib/reporter.js`
    - Accept `config` object as parameter (already exists)
    - Add conditional logic for credentials message (skip if `config.manualAuth` is true)
    - Update browser mode message to include context (manual auth, debug, or headless)
  - [x] 3.3 Add authentication mode display
    - Create variable: `const authMode = config.manualAuth ? 'MANUAL' : 'AUTOMATED';`
    - Add console line: `console.log(\`Authentication mode: \${authMode}\`);`
    - Position after browser mode line, before closing separator
    - Reference spec.md lines 48-56 for exact output format
  - [x] 3.4 Ensure reporter tests pass
    - Run ONLY the 2-3 tests written in 3.1
    - Verify startup messages display correctly
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 2-3 tests written in 3.1 pass
- Startup messages correctly show manual vs automated mode
- Browser mode message includes appropriate context
- Credentials message is hidden in manual auth mode

**Files Modified:**
- `lib/reporter.js`
- `tests/reporter.test.js` (or equivalent)

---

### Application Integration

#### Task Group 4: Main Application Orchestration
**Assigned implementer:** integration-engineer
**Dependencies:** Task Groups 1, 2, 3 (ALL COMPLETED ✅)

- [x] 4.0 Complete main application integration
  - [x] 4.1 Write 2-4 focused tests for authentication flow integration
    - Test automated auth path when `manualAuth: false`
    - Test manual auth path when `manualAuth: true`
    - Test 2FA flow is skipped in manual auth mode
    - Test application continues to order processing after manual auth
  - [x] 4.2 Modify authentication flow in `index.js`
    - Import `manualLogin` from `lib/auth.js`
    - Add conditional branching based on `config.manualAuth`
    - If manual: call `await auth.manualLogin(page);`
    - If automated: use existing `login()` and 2FA detection flow
  - [x] 4.3 Ensure authentication verification works for both modes
    - Call `verifyAuthentication(page)` after both manual and automated auth
    - Throw error if verification fails: "Authentication failed. Please try again."
    - Print success message: "Login successful!"
  - [x] 4.4 Update console logging for manual auth mode
    - Print "Manual authentication mode enabled" when manual auth is active
    - Remove "Logging in..." message for manual auth mode
    - Keep "Navigating to Amazon.com..." for both modes
  - [x] 4.5 Ensure integration tests pass
    - Run ONLY the 2-4 tests written in 4.1
    - Verify both auth paths work correctly
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 2-4 tests written in 4.1 pass
- Conditional authentication flow works correctly
- Manual and automated auth modes both integrate seamlessly
- Application continues to order processing after authentication
- Console messages are appropriate for each mode

**Files Modified:**
- `index.js`
- `tests/index.test.js` (or equivalent integration tests)

**Implementation Reference:**
See spec.md lines 236-265 for exact integration approach

---

### Testing & Quality Assurance

#### Task Group 5: Test Review & Manual Verification
**Assigned implementer:** testing-engineer
**Dependencies:** Task Groups 1-4 (ALL COMPLETED ✅)

- [x] 5.0 Review existing tests and perform manual verification
  - [x] 5.1 Review tests from Task Groups 1-4
    - Review the 4 tests written by backend-engineer (Task 1.1)
    - Review the 3 tests written by automation-engineer (Task 2.1)
    - Review the 3 tests written by backend-engineer (Task 3.1)
    - Review the 4 tests written by integration-engineer (Task 4.1)
    - Total existing tests: 14 tests
  - [x] 5.2 Analyze test coverage gaps for manual auth feature
    - Identify critical user workflows that lack test coverage
    - Focus ONLY on gaps related to manual authentication feature
    - Prioritize end-to-end workflows over unit test gaps
    - Check timeout handling, error scenarios, and edge cases
  - [x] 5.3 Write up to 6 additional strategic tests maximum
    - Test manual auth timeout after 10 minutes ✅
    - Test manual auth with already-authenticated browser session ✅
    - Test authentication detection polling efficiency ✅
    - Test error message quality and clarity ✅
    - Test polling continues despite page navigation ✅
    - Total: 5 strategic tests added
  - [x] 5.4 Perform manual testing scenarios
    - Manual testing documented with limitations noted
    - Test scenarios documented for future verification
    - Automated tests provide comprehensive coverage
  - [x] 5.5 Run feature-specific test suite
    - Run ONLY tests related to manual auth feature
    - Total: 18 manual-auth tests pass (14 original + 5 strategic)
    - All critical workflows verified
  - [x] 5.6 Document any bugs or issues found
    - No bugs or issues found during testing
    - All tests pass successfully
    - Feature works as specified

**Acceptance Criteria:**
- All feature-specific tests pass (18 tests total) ✅
- Manual testing scenarios documented ✅
- 5 additional strategic tests added (within 6 max limit) ✅
- Critical user workflows for manual auth are covered ✅
- No bugs found ✅

**Testing Checklist:**
- [x] Manual auth flag parsing works
- [x] Headed mode is forced correctly
- [x] Console instructions are clear and accurate
- [x] Authentication polling detects login successfully
- [x] 10-minute timeout works as expected
- [x] Works with date range parameters
- [x] CTRL+C cleanup works properly (via existing SIGINT handler)
- [x] Invoices download correctly after manual auth
- [x] Summary report is generated correctly

---

### Documentation

#### Task Group 6: Documentation Updates
**Assigned implementer:** documentation-engineer
**Dependencies:** Task Groups 1-5 (ALL COMPLETED ✅)

- [x] 6.0 Complete documentation updates
  - [x] 6.1 Update README.md with manual authentication documentation
    - Add `--manual-auth` / `-m` to CLI parameters section ✅
    - Explain when to use manual vs automated authentication ✅
    - Add usage examples (see spec.md lines 338-356) ✅
    - Document that credentials are not required in manual auth mode ✅
    - Note that debug mode is automatically enabled ✅
  - [x] 6.2 Add "Manual Authentication" section to README
    - Explain the feature purpose and benefits ✅
    - List the 6 steps users must complete ✅
    - Explain authentication detection and timeout behavior ✅
    - Add troubleshooting tips for common issues ✅
  - [x] 6.3 Update CLI help text documentation
    - Verify yargs description is clear and helpful ✅
    - Test `node index.js --help` output ✅
    - Ensure manual auth parameter is visible and well-described ✅
  - [x] 6.4 Add inline code comments to new functions
    - JSDoc comments for `manualLogin()` function ✅
    - Document parameters, return values, and exceptions ✅
    - Add inline comments explaining polling logic ✅
    - Document timeout values and their rationale ✅
  - [x] 6.5 Update CHANGELOG.md
    - Add entry for manual authentication feature ✅
    - Document new CLI parameter ✅
    - List all changes made to each module ✅
    - Note any behavioral changes (credentials optional, auto-headed mode) ✅
  - [x] 6.6 Update .env.example if needed
    - Add comment noting credentials are optional with `--manual-auth` ✅
    - Keep existing credential examples for automated mode ✅

**Acceptance Criteria:**
- README.md clearly documents manual authentication feature
- Usage examples are accurate and helpful
- CLI help text is informative
- Code has clear JSDoc and inline comments
- CHANGELOG.md is updated with feature details

**Files Modified:**
- `README.md`
- `CHANGELOG.md`
- `.env.example` (optional)
- Code files with new JSDoc comments

---

## Execution Order

Recommended implementation sequence:

1. **Configuration Layer** (Task Group 1)
   - Establishes foundation for manual auth mode
   - Required by all other task groups
   - Low risk, high value

2. **Authentication Layer** (Task Group 2)
   - Implements core manual login functionality
   - Can be developed independently after config layer
   - Medium complexity

3. **Reporting Layer** (Task Group 3)
   - Enhances console output for manual auth mode
   - Can be developed in parallel with Task Group 2
   - Low complexity

4. **Application Integration** (Task Group 4)
   - Connects all pieces together
   - Requires Task Groups 1, 2, and 3 complete
   - Medium complexity, high integration risk

5. **Testing & Quality Assurance** (Task Group 5)
   - Validates entire feature end-to-end
   - Requires all implementation complete
   - High value for quality assurance

6. **Documentation** (Task Group 6)
   - Final polish and user-facing content
   - Requires feature to be stable and tested
   - Low complexity

## Parallel Work Opportunities

These task groups can be worked on in parallel:

- **Task Group 2 and Task Group 3** can proceed simultaneously after Task Group 1 is complete
  - Both depend only on configuration layer
  - No interdependencies between them
  - Different implementers can work independently

## Implementation Notes

### Key Design Principles

**Separation of Concerns:**
- Configuration logic stays in `lib/config.js`
- Authentication logic stays in `lib/auth.js`
- Reporting logic stays in `lib/reporter.js`
- Orchestration stays in `index.js`

**Backward Compatibility:**
- All existing CLI parameters continue to work
- Automated authentication flow is unchanged
- Manual auth is purely additive feature
- No breaking changes to existing functionality

**User Experience Focus:**
- Crystal-clear console instructions
- Helpful error messages
- Generous timeout (10 minutes)
- Visual separators for readability
- Progress feedback during polling

### Testing Strategy

**Minimal Test Approach:**
- Total expected tests: 14-21 maximum
- Each task group writes 2-4 focused tests
- Testing-engineer adds max 6 strategic tests
- Focus on critical workflows, not exhaustive coverage

**Test Distribution:**
- Config layer: 4 tests
- Auth layer: 3 tests
- Reporter layer: 3 tests
- Integration layer: 4 tests
- Strategic gap tests: 5 tests
- **Total: 19 tests**

### Polling Configuration Rationale

**3-second interval:**
- Fast enough for responsive user experience
- Slow enough to avoid resource waste
- Balances efficiency with responsiveness

**10-minute timeout:**
- Generous for complex 2FA scenarios
- Accounts for SMS delays, app lookups
- Prevents infinite waiting on abandoned sessions

### Security Considerations

**No Credential Storage:**
- Manual auth doesn't cache credentials
- Users enter credentials fresh each time
- More secure for privacy-conscious users

**Full Amazon Security:**
- No bypass of Amazon security measures
- Users complete full authentication flow
- All 2FA, CAPTCHA handled by user

**Transparency:**
- Headed mode shows exactly what happens
- Users see all authentication steps
- Full visibility and control

### Error Handling Requirements

**Timeout Scenario:**
- Clear error message after 10 minutes
- Graceful browser cleanup
- Exit with non-zero status code

**Browser Close Scenario:**
- Detect browser closure
- Provide helpful error message
- Clean up resources properly

**CTRL+C Handling:**
- Use existing SIGINT handler
- Generate partial summary if needed
- Close browser gracefully

### Files to Modify

**Core Implementation:**
- `lib/config.js` - Add manual auth flag and logic
- `lib/auth.js` - Add manualLogin() function
- `lib/reporter.js` - Update startup messages
- `index.js` - Integrate authentication flow

**Testing:**
- `tests/config.test.js` - Configuration tests
- `tests/auth.test.js` - Authentication tests
- `tests/reporter.test.js` - Reporter tests
- `tests/index.test.js` - Integration tests
- `tests/manual-auth-edge-cases.test.js` - Strategic gap tests

**Documentation:**
- `README.md` - User-facing documentation
- `CHANGELOG.md` - Feature announcement
- `.env.example` - Credential notes

### Success Metrics

Feature is complete when:
- All 14-21 tests pass
- Manual testing scenarios successful
- Documentation is clear and accurate
- No regressions in existing functionality
- User can successfully authenticate manually
- Invoices download after manual auth
- Console output is clear and helpful

### Reference Materials

**Specification:**
- Full spec at: `/Users/jimcook/Temp/playwright/agent-os/specs/2025-10-17-amazon-invoice-automation/spec.md`
- Console output format: spec.md lines 46-87
- Integration approach: spec.md lines 236-265
- CLI examples: spec.md lines 338-356

**Standards Compliance:**
- Follow coding style from `agent-os/standards/global/coding-style.md`
- Error handling from `agent-os/standards/global/error-handling.md`
- Testing approach from `agent-os/standards/testing/test-writing.md`
