## Git workflow best practices

- **Main Branch Always Deployable**: The `main` branch must always be in a deployable state; all code merged to `main` should be production-ready
- **Issue-Driven Development**: Create an issue for every feature, bug fix, or task before starting work; use issues to track progress and facilitate discussion
- **Branch from Main**: Always create new branches from the latest `main` branch to ensure you're working with the most current code
- **Issue-Prefixed Branch Names**: Name branches with the issue number as prefix followed by a descriptive name (e.g., `129-output-generation-fix`, `47-user-authentication`)
- **Descriptive Branch Names**: Use clear, lowercase, hyphen-separated names that describe the work being done (avoid generic names like `fix` or `update`)
- **Commit Early and Often**: Make small, focused commits that capture logical units of work; this makes it easier to review, revert, and understand changes
- **Meaningful Commit Messages**: Write clear commit messages that explain what and why, not just how; use imperative mood (e.g., "Add user validation" not "Added" or "Adds")
- **Push Branches Regularly**: Push your feature branch to the remote repository frequently to backup work and enable collaboration
- **Open Pull Requests Early**: Create pull requests when you're ready for feedback, even if the work isn't complete; use draft PRs for work in progress
- **Reference Issues in PRs**: Always reference the related issue number in the PR description (e.g., "Closes #129" or "Fixes #47") to automatically link the PR and issue
- **Descriptive PR Titles and Descriptions**: Write clear PR titles and provide context in the description about what changed, why, and how to test it
- **Request Reviews**: Assign reviewers to your PR and respond to feedback constructively; code review improves quality and shares knowledge
- **Keep PRs Focused**: Each PR should address a single issue or feature; smaller PRs are easier to review and less risky to merge
- **Update Branches Before Merging**: Pull the latest changes from `main` into your feature branch and resolve conflicts before merging
- **Delete Merged Branches**: Remove feature branches after they've been merged to keep the repository clean and avoid confusion
- **Deploy from Main**: All deployments to production should come from the `main` branch after code has been reviewed and merged
- **Never Force Push Shared Branches**: Avoid `git push --force` on branches others are working on; only force push to your own feature branches when necessary
- **Use Meaningful Tags**: Tag releases with semantic version numbers (e.g., `v1.2.3`) to mark specific points in history for production deployments

## Conventional commits best practices

- **Commit Message Format**: Use the format `<type>(scope): <description>` where type describes the kind of change, scope identifies the component, and description explains what changed
- **Scope from Issue Number**: The scope should be the issue number from your branch name prefix (e.g., for branch `129-output-generation-fix`, use scope `129`)
- **Scope from Component**: If no issue number exists in the branch prefix, use a single word describing the main component affected (e.g., `auth`, `api`, `parser`)
- **Common Types**: Use standard types: `feat` (new feature), `fix` (bug fix), `docs` (documentation), `style` (formatting), `refactor` (code restructuring), `test` (testing), `chore` (maintenance), `perf` (performance), `ci` (CI/CD changes)
- **Breaking Changes**: Add `!` after the type/scope for breaking changes (e.g., `feat(129)!: redesign API endpoints`) and include `BREAKING CHANGE:` in the commit body
- **Concise Descriptions**: Keep the description under 50 characters; use imperative mood (e.g., "add user authentication" not "added" or "adds")
- **Detailed Body**: Add a commit body for complex changes to explain motivation, context, and implementation details
- **Examples**: `feat(129): add user export functionality`, `fix(auth): resolve login timeout issue`, `docs(47): update API documentation`

## Release management best practices

- **Plan Before Release**: Ensure all features and bug fixes for the release are merged to `main` and thoroughly tested before creating a release
- **Use Semantic Versioning**: Tag releases with semantic version numbers following the `vMAJOR.MINOR.PATCH` format (e.g., `v1.2.3`, `v2.0.0`)
- **Create Git Tags**: Create an annotated Git tag for each release pointing to the specific commit in `main` that represents the release
- **Choose Target Branch**: Always create releases from the `main` branch to ensure consistency and that releases represent production-ready code
- **Draft Releases First**: Create releases as drafts initially to review all details, attach assets, and make adjustments before publishing
- **Write Clear Release Titles**: Use descriptive release titles that include the version number and optionally a code name (e.g., "v1.2.3 - Performance Update")
- **Document Release Notes**: Provide comprehensive release notes describing new features, bug fixes, breaking changes, and upgrade instructions
- **Auto-Generate Release Notes**: Use GitHub's "Generate release notes" feature to automatically create notes from PR titles and labels between releases
- **Mention Contributors**: Use @mentions in release descriptions to acknowledge contributors; GitHub will display their avatars in a Contributors section
- **Attach Binary Assets**: Include compiled binaries, installers, or other distribution files by attaching them to the release for user download
- **Mark Pre-releases**: Use the "This is a pre-release" option for alpha, beta, or release candidate versions to signal instability to users
- **Set Latest Release**: Allow GitHub to automatically designate the latest stable release, or manually control it for special cases
- **Link to Discussions**: Enable release discussions to create a dedicated space for users to ask questions and provide feedback about each release
- **Communicate Breaking Changes**: Clearly highlight any breaking changes in release notes with migration guides and examples
- **Verify Before Publishing**: Review all release details, test download links, and verify asset integrity before clicking "Publish release"
- **Announce Releases**: Share release announcements through appropriate channels (social media, mailing lists, blog posts) to inform users
- **Edit Only When Necessary**: Avoid editing published releases unless fixing critical errors in release notes; maintain release immutability when possible
- **Archive Old Releases**: Keep historical releases available for users who need older versions, but clearly mark deprecated or unsupported versions
