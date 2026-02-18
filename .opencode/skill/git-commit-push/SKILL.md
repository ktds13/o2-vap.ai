# Git Commit and Push Skill

This skill provides comprehensive instructions for creating git commits and pushing changes to remote repositories following best practices.

## When to Use This Skill

Load this skill when:
- User requests to commit changes
- User requests to push changes
- User requests both commit and push operations
- User invokes `/commit` or `/push` slash commands

## Git Safety Protocol

**CRITICAL RULES - NEVER VIOLATE THESE:**
- NEVER update git config
- NEVER run destructive/irreversible git commands (like push --force, hard reset, etc) unless explicitly requested
- NEVER skip hooks (--no-verify, --no-gpg-sign, etc) unless explicitly requested
- NEVER force push to main/master branches - warn the user if they request it
- NEVER commit files that likely contain secrets (.env, credentials.json, .pem, .key, etc.)
- DO NOT push to remote unless explicitly requested by the user

## Commit Workflow

### Step 1: Gather Context (Run in Parallel)

Run these commands in parallel using separate Bash tool calls:

```bash
# Check repository status
git status

# View staged and unstaged changes
git diff HEAD

# Check recent commits for message style
git log --oneline --format="%h %s" -10
```

### Step 2: Analyze and Draft Commit Message

1. Review all changes from the git diff output
2. Identify the nature of changes:
   - New feature (use "add" or "feat")
   - Enhancement to existing feature (use "update" or "enhance")
   - Bug fix (use "fix")
   - Refactoring (use "refactor")
   - Documentation (use "docs")
   - Tests (use "test")
   - Build/config changes (use "build" or "chore")
3. Draft a concise commit message (1-2 sentences) that focuses on:
   - **WHY** the change was made (not just what changed)
   - The impact or purpose of the change
4. Follow the existing commit message style from git log output
5. Warn user if any sensitive files are staged

### Step 3: Stage and Commit

Run these commands sequentially (use && to chain):

```bash
# Stage relevant files (if not already staged)
git add <files>

# Create the commit
git commit -m "your commit message here"

# Verify the commit was created
git status
```

**Important:**
- Only stage files that are relevant to the commit
- If there are multiple unrelated changes, ask user if they want separate commits
- If commit fails due to pre-commit hook, fix the issue and create a NEW commit (do not use --amend)

### Step 4: Verify Success

Check the git status output to confirm:
- Commit was created successfully
- Working directory is clean or shows remaining unstaged files
- Note if branch is ahead of remote (for push operations)

## Push Workflow

### Step 1: Check Remote Status

```bash
# Check if branch tracks a remote and if it's up to date
git status
```

### Step 2: Determine Push Strategy

Based on git status output:
- If "Your branch is up to date": No push needed
- If "Your branch is ahead by N commits": Ready to push
- If "no upstream branch": Need to set upstream with -u flag
- If "Your branch is behind": Need to pull first (warn user about potential conflicts)

### Step 3: Execute Push

```bash
# If no upstream branch is set
git push -u origin <branch-name>

# If upstream is already set
git push

# Verify success
git status
```

**Safety Checks:**
- If pushing to main/master, confirm with user first
- If push would be force push, STOP and warn user
- If push fails due to remote changes, advise user to pull first

## Common Scenarios

### Scenario 1: Commit Only
User says: "commit my changes" or runs `/commit`

1. Gather context (Step 1)
2. Draft commit message (Step 2)
3. Stage and commit (Step 3)
4. Verify success (Step 4)
5. DO NOT push unless explicitly requested

### Scenario 2: Commit and Push
User says: "commit and push" or runs `/commit --push`

1. Execute commit workflow (Steps 1-4)
2. If commit successful, execute push workflow
3. Report both commit and push status

### Scenario 3: Push Only
User says: "push my changes" or runs `/push`

1. Check if there are uncommitted changes (git status)
2. If uncommitted changes exist, ask user if they want to commit first
3. If working directory is clean, execute push workflow
4. Report push status

### Scenario 4: Multiple Changed Files
If there are many changed files:

1. Group files by type/purpose
2. Ask user: "I see changes to X, Y, and Z. Should I:
   - Commit all together?
   - Create separate commits?
   - Commit only specific files?"
3. Proceed based on user preference

## Error Handling

### Pre-commit Hook Failures
If commit fails due to pre-commit hooks:
1. Show the error to the user
2. Fix the issues (e.g., lint errors, formatting)
3. Create a NEW commit (do not use --amend)
4. Run git status to verify

### Push Failures
If push fails:
1. Check the error message
2. Common causes:
   - Remote has changes: Advise `git pull` first
   - No upstream branch: Use `git push -u origin <branch>`
   - Authentication issues: User needs to configure credentials
   - Protected branch: User may need different permissions
3. Explain the issue and suggest resolution

### Merge Conflicts After Pull
If pull creates conflicts:
1. Show conflicted files
2. Ask user if they want help resolving conflicts
3. DO NOT auto-resolve conflicts without user input

## Best Practices

1. **Commit Message Quality**
   - Be specific but concise
   - Focus on the "why" not the "what"
   - Use imperative mood ("add feature" not "added feature")
   - Match the existing style in the repository

2. **Atomic Commits**
   - Each commit should represent one logical change
   - Don't mix unrelated changes in one commit
   - Make commits that are easy to review and revert if needed

3. **Security**
   - Always check for secrets before committing
   - Common files to exclude: .env, .env.local, credentials.json, *.pem, *.key, config/secrets.yml
   - Warn user if sensitive files are detected

4. **Communication**
   - Always show what you're about to commit before doing it
   - Report success/failure clearly
   - If uncertain about what to commit, ask the user

## Example Interactions

### Example 1: Simple Commit
```
User: commit my changes
Assistant: I'll commit your changes. Let me first check what's been modified.

[Runs git status, git diff, git log in parallel]

I see you've modified:
- src/components/Button.tsx (added new variant prop)
- src/components/Button.test.tsx (added tests for new variant)

I'll commit these changes with the message:
"Add variant prop to Button component for different button styles"

[Stages files and commits]

Commit created successfully! Your changes are now committed to the current branch.
```

### Example 2: Commit and Push
```
User: commit and push my work
Assistant: I'll commit and push your changes.

[Runs git status, git diff, git log]

I see changes to the authentication module:
- src/auth/login.ts (fixed token refresh logic)
- src/auth/types.ts (updated TokenResponse interface)

Commit message: "Fix token refresh logic to properly handle expired tokens"

[Commits]

Commit successful! Now pushing to remote...

[Pushes]

Successfully pushed to origin/feature-auth-fix!
```

### Example 3: Push with Uncommitted Changes
```
User: push my changes
Assistant: I notice you have uncommitted changes:
- src/utils/helpers.ts (modified)
- README.md (modified)

Would you like me to:
1. Commit these changes first, then push
2. Push only existing commits (uncommitted changes will remain local)
3. Cancel and let you review the changes

Please let me know how you'd like to proceed.
```

## Integration with Slash Commands

This skill is automatically loaded when users run:
- `/commit` - Commits changes only
- `/commit --push` - Commits and pushes changes
- `/push` - Pushes existing commits

The slash commands pass the user's intent to you, and you should execute the appropriate workflow from this skill.
