# Spec Implementation Process

Now that we have a spec and tasks list ready for implementation, we will proceed
with implementation of this spec by following this multi-phase process:

PHASE 0: Prepare implementation (GitHub issue and feature branch setup)
PHASE 1: Plan the subagent assignments for each task group
PHASE 2: Delegate implementation of each task group to its assigned subagent
PHASE 3: Delegate verifications of the implementation to verifier subagents
PHASE 4: Delegate the production of the final verification
PHASE 5: Finalize implementation (commit, push, create PR)

Follow each of these phases and their individual workflows IN SEQUENCE:

## Multi-Phase Process

### PHASE 0: Prepare implementation

# Prepare Implementation

Before beginning any task implementation, you must set up the proper git workflow
and GitHub issue tracking.

## Step 1: Verify GitHub Issue Exists

Use the GitHub CLI to search for an existing issue related to this spec:

```bash
gh issue list --search "[spec-title]" --state open
```

If a related issue exists, note its issue number for use in branch naming.

## Step 2: Create GitHub Issue (if none exists)

If no issue exists, create one using the spec information:

```bash
gh issue create \
  --title "[Spec title from spec.md]" \
  --body "$(cat <<'EOF'
## Description
[Brief description from spec.md]

## Acceptance Criteria
[Acceptance criteria from spec.md]

## Related Spec
agent-os/specs/[this-spec]/spec.md

## Tasks
See detailed task breakdown: agent-os/specs/[this-spec]/tasks.md
EOF
)"
```

This command will output the created issue number. Note this number for the next step.

## Step 3: Create Feature Branch

Create a feature branch following the git standards (issue-prefixed branch name):

```bash
# Ensure you're on main and it's up to date
git checkout main
git pull origin main

# Create and checkout feature branch with issue number prefix
git checkout -b [issue-number]-[descriptive-branch-name]
```

**Branch Naming Convention:**
- Prefix with issue number: `129-output-generation-fix`
- Use lowercase with hyphens
- Be descriptive about the work being done
- Example: `47-user-authentication`, `129-usage-metrics-export`

## Step 4: Push Branch and Link to Issue

Push the new branch to remote and set up tracking:

```bash
# Push branch and set upstream tracking
git push -u origin [issue-number]-[descriptive-branch-name]
```

Update the issue with the branch reference:

```bash
gh issue comment [issue-number] --body "Implementation branch: \`[issue-number]-[descriptive-branch-name]\`"
```

## Step 5: Verify Setup

Confirm the setup is complete:

1. Issue exists and is open: `gh issue view [issue-number]`
2. Branch exists locally: `git branch --show-current`
3. Branch is pushed to remote: `git branch -vv`
4. You're on the feature branch (not main)

## Output to User

Once preparation is complete, inform the user:

```
✓ GitHub issue #[number] created/confirmed: [issue-title]
✓ Feature branch created: [issue-number]-[branch-name]
✓ Branch pushed to remote and tracking set up
✓ Ready to begin implementation
```

Now proceed with task assignment and implementation phases.


### PHASE 1: Plan subagents assignments

Read the following files:

- `agent-os/specs/[this-spec]/tasks.md`
- `agent-os/roles/implementers.yml`

Create `agent-os/specs/[this-spec]/planning/task-assignments.yml` with this
structure:

```yaml
task_assignments:
  - task_group: "Task Group 1: [Title from tasks.md]"
    assigned_subagent: "[implementer-id-from-implementers.yml]"

  - task_group: "Task Group 2: [Title from tasks.md]"
    assigned_subagent: "[implementer-id-from-implementers.yml]"

  # Continue for all task groups found in tasks.md
```

Ensure each assigned subagent exists in both of these locations:

- In implementers.yml there must be an implementer with this role ID.
- In `.claude/agents/agent-os` there must be a file named by this implementer
  ID.

### PHASE 2: Delegate task groups implementations to assigned subagents

Loop through each task group in `agent-os/specs/[this-spec]/tasks.md` and
delegate its implementation to the assigned subagent specified in
`task-assignments.yml`.

For each delegation, provide the subagent with:

- The task group (including the parent task and all sub-tasks)
- The spec file: `agent-os/specs/[this-spec]/spec.md`
- Instruct subagent to:
    1. Perform their implementation
    2. Check off the task and sub-task(s) in
       `agent-os/specs/[this-spec]/tasks.md`
    3. Document their work in an implementation report named and numbered by
       this task name and placed in
       `agent-os/specs/[this-spec]/implementation/`.

### PHASE 3: Delegate verifications of implementation to verifier subagents

1. Collect the list of subagent IDs that were delegated to in Phase 2.

2. Read `implementers.yml` and find those subagent IDs. Collect the verifier
   role IDs specified in their `verified_by` field.

3. If there are verifier roles, ensure those verifiers are defined in
   `agent-os/roles/verifiers.yml`.

4. If there are verifier roles, delegate to each verifier subagent:
    - Collect all task groups that fall under the purview of this verifier (i.e.
      these tasks' implementers' verified_by specifies this verifier).
    - Provide to the verifier:
        1. Details of those task groups (parent task and sub-tasks) to the
           verifier for verification.
        2. The spec file: `agent-os/specs/[this-spec]/spec.md` for context.
    - Instruct the verifier:
        1. Read and analyze these tasks and where they fit in the context of
           this spec.
        2. Run tests to verify implementation of these tasks.
        3. Verify whether `agent-os/specs/[this-spec]/tasks.md` has been updated
           to reflect these tasks' completeness.
        4. Document your verification report and place this document in:
           `agent-os/specs/[this-spec]/verification/`

### PHASE 4: Produce the final verification report

Use the **implementation-verifier** subagent to do its implementation
verification and produce its final verification report.

Provide to the subagent the following:

- The path to this spec: `agent-os/specs/[this-spec]`
  Instruct the subagent to do the following:
    1. Run all of its final verifications according to its built-in workflow
    2. Produce the final verification report in
       `agent-os/specs/[this-spec]/verifications/final-verification.md`.

### PHASE 5: Finalize implementation

# Finalize Implementation

After all tasks have been implemented and verified, finalize the implementation
by committing changes, creating a pull request, and linking everything together.

## Step 1: Review Changes

Review all changes made during implementation:

```bash
# Check status of all modified files
git status

# Review all changes since branching from main
git diff main...HEAD
```

Ensure:
- All task implementations are complete
- All tests pass
- No unintended files are included
- No sensitive information (credentials, keys) is present

## Step 2: Stage and Commit Changes

Stage relevant files and create a commit following conventional commit standards:

```bash
# Add all relevant files (review carefully)
git add [files]

# Create commit with conventional commit message
git commit -m "$(cat <<'EOF'
feat([issue-number]): [concise description under 50 chars]

[Optional detailed body explaining what changed and why]

Implements all tasks from spec: agent-os/specs/[this-spec]/spec.md

- [Key change 1]
- [Key change 2]
- [Key change 3]

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

**Commit Message Guidelines:**
- Type: `feat` (new feature), `fix` (bug fix), `refactor`, etc.
- Scope: Use issue number (e.g., `feat(129): add usage export`)
- Description: Imperative mood, under 50 characters
- Body: Explain what and why (optional but recommended)
- Reference the spec in the body

## Step 3: Push Changes

Push the committed changes to the remote branch:

```bash
git push origin [branch-name]
```

## Step 4: Create Pull Request

Create a pull request using GitHub CLI:

```bash
gh pr create \
  --title "feat([issue-number]): [Descriptive PR title]" \
  --body "$(cat <<'EOF'
## Summary
- [Key feature/change 1]
- [Key feature/change 2]
- [Key feature/change 3]

## Related Issue
Closes #[issue-number]

## Specification
Implementation of: `agent-os/specs/[this-spec]/spec.md`

## Changes Made
[Brief description of what was implemented and how]

## Testing
- [ ] All unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] No regressions detected

## Verification Reports
See detailed verification reports in:
- `agent-os/specs/[this-spec]/implementation/`
- `agent-os/specs/[this-spec]/verification/`

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

This will:
- Create the PR
- Link it to the issue (via "Closes #[issue-number]")
- Output the PR URL

## Step 5: Update Issue with PR Link

The PR should automatically link to the issue via "Closes #[issue-number]", but
you can add a comment to the issue for clarity:

```bash
gh issue comment [issue-number] --body "Pull request created: [PR-URL]"
```

## Step 6: Request Reviews (Optional)

If code review is part of your workflow, request reviewers:

```bash
gh pr edit [PR-number] --add-reviewer [reviewer-username]
```

## Output to User

Once finalization is complete, inform the user:

```
✓ Changes committed with conventional commit message
✓ Changes pushed to remote branch: [branch-name]
✓ Pull request created: [PR-URL]
✓ Pull request linked to issue #[issue-number]
✓ Ready for review and merge

Next steps:
1. Review the pull request: [PR-URL]
2. Request reviews if needed
3. Merge when approved
4. Delete feature branch after merge
```

## Important Notes

**Commit Standards:**
- Follow conventional commits format
- Reference issue number in scope
- Keep descriptions concise and imperative
- Include detailed body for complex changes

**PR Best Practices:**
- Clear, descriptive title
- Comprehensive summary in description
- Link to related issue (use "Closes #[number]")
- Include testing checklist
- Reference verification reports

**What NOT to Commit:**
- Credentials or API keys
- Environment files (.env)
- Temporary or debug files
- Large binary files
- Generated files that should be built

**After Merge:**
- Delete the feature branch locally: `git branch -d [branch-name]`
- Delete the feature branch remotely: `git push origin --delete [branch-name]`
- Checkout main and pull latest: `git checkout main && git pull`
