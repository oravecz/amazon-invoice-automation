## Project Configuration Standards

This document defines standards for project-level configuration including version control hooks, environment setup, and development workflow automation.

## Environment Variables

### .env Files

- **Never commit** `.env` files containing secrets
- **Always commit** `.env.example` with placeholder values
- Use descriptive variable names in SCREAMING_SNAKE_CASE
- Group related variables with comments

Example `.env.example`:
```bash
# Database Configuration
DATABASE_URL=postgresql://localhost:5432/myapp_dev
DATABASE_POOL_SIZE=10

# API Keys (obtain from https://example.com/api)
API_KEY=your_api_key_here
API_SECRET=your_api_secret_here

# Feature Flags
ENABLE_FEATURE_X=false
```

## Package Manager Configuration

### npm

- Use `npm ci` in CI/CD for reproducible builds
- Commit `package-lock.json` to repository
- Use exact versions for critical dependencies

### Scripts Naming Conventions

Use consistent npm script names:
- `dev` - Start development server
- `build` - Build production bundle
- `test` - Run test suite
- `test:watch` - Run tests in watch mode
- `lint` - Check for linting errors
- `lint:fix` - Auto-fix linting errors
- `format` - Format code
- `typecheck` - Run TypeScript type checking

## CI/CD Configuration

### GitHub Actions

- Store workflow files in `.github/workflows/`
- Use descriptive workflow names
- Pin action versions to specific commits or tags
- Use caching for dependencies
- Set appropriate timeout values

Example workflow naming:
- `ci.yml` - Main CI pipeline (lint, test, build)
- `deploy-staging.yml` - Deploy to staging environment
- `deploy-production.yml` - Deploy to production
- `release.yml` - Create releases and publish packages
