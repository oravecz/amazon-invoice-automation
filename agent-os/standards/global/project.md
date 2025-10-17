## Project Configuration Standards

This document defines standards for project-level configuration including version control hooks, environment setup, and development workflow automation.

## Git Hooks

Git hooks **must** be configured using `core.hooksPath` with a `.githooks` directory, not Husky or direct `.git/hooks` modification.

### Setup

1. Create `.githooks` directory in project root:
```bash
mkdir -p .githooks
```

2. Create `.githooks/pre-commit` hook:
```bash
#!/bin/sh

# Run Biome checks and fixes before commit
echo "Running Biome lint:fix..."
npm run lint:fix

# If Biome fails, abort the commit
if [ $? -ne 0 ]; then
  echo "Biome checks failed. Please fix the issues and try again."
  exit 1
fi

# Stage any fixes made by Biome
git add -u
```

3. Make the hook executable:
```bash
chmod +x .githooks/pre-commit
```

4. Add `prepare` script to `package.json` to configure git on install:
```json
{
  "scripts": {
    "prepare": "git config core.hooksPath .githooks",
    "lint": "biome check ./src",
    "lint:fix": "biome check --write ./src",
    "format": "biome format --write ./src"
  }
}
```

The `prepare` script automatically runs after `npm install`, configuring git to use `.githooks` for all developers.

### Why core.hooksPath

- No additional dependencies (Husky, lint-staged)
- Hooks are version-controlled in `.githooks` directory
- Automatically configured via `prepare` script
- Works consistently across all team members

### Additional Hooks

You can add other hooks to `.githooks/` as needed:

- `pre-push` - Run tests before pushing
- `commit-msg` - Validate commit message format
- `post-checkout` - Update dependencies after branch changes
- `post-merge` - Run migrations after merging

All hooks must be:
- Executable (`chmod +x .githooks/hook-name`)
- Version-controlled (committed to repository)
- Well-documented with inline comments

