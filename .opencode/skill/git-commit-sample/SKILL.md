---
name: git-commit-sample
description: Sample git commit skill demonstrating bb-commit style workflow for staging and committing changes
---

# Git Commit Sample Skill

A lightweight skill for handling git commits similar to the bb-commit command pattern.

## Workflow

1. **Check changed files**
   - Run `git status` to see all untracked and modified files
   - Identify which files are relevant to commit

2. **Stage files**
   - Add appropriate files to staging area using `git add`
   - Avoid staging sensitive files (.env, credentials, etc.)

3. **Generate commit message**
   - Analyze the staged changes using `git diff --staged`
   - Create a commit message based on user prompt or defaults
   - Apply commit message length preference:
     - **s** (Short): One-line summary (50 chars max)
     - **n** (Normal): Brief description with body (72 chars per line)
     - **l** (Long): Detailed explanation with context and reasoning

4. **Create commit**
   - Execute `git commit -m "message"` with the generated message
   - Verify commit success with `git status`

## Commit Message Guidelines

### Short (s)
```
feat: add user authentication
```

### Normal (n)
```
feat: add user authentication

Implement JWT-based authentication system with login/logout
functionality and session management.
```

### Long (l)
```
feat: add user authentication

Implement comprehensive JWT-based authentication system including:
- Login/logout endpoints with secure token generation
- Session management with refresh token rotation
- Password hashing using bcrypt
- Protected route middleware

This addresses the security requirements outlined in issue #123
and provides a foundation for role-based access control.
```

## Usage Examples

**Default commit (short)**
```
/bb-commit "fix login bug"
```

**Normal commit**
```
/bb-commit n "add user profile feature"
```

**Long commit**
```
/bb-commit l "refactor database layer"
```

## Notes

- Never commit sensitive files containing secrets
- Follow conventional commit format (feat:, fix:, docs:, etc.)
- Focus on "why" rather than "what" in commit messages
- Default to short format unless specified otherwise
