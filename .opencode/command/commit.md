---
name: /commit
description: Commit changes to git with an intelligent commit message
---

# Commit Command

Load the git-commit-push skill and help the user commit their changes.

## Usage

- `/commit` - Commit staged and unstaged changes
- `/commit --push` - Commit changes and push to remote
- `/commit --all` - Stage all changes and commit
- `/commit --amend` - Amend the previous commit (use with caution)

## Workflow

1. Load the git-commit-push skill
2. Check for the --push flag in the user's message
3. Check for the --all flag to stage all files
4. Check for the --amend flag to amend previous commit
5. Execute the appropriate commit workflow from the skill
6. If --push flag is present, also execute the push workflow

## Important Notes

- Always follow the Git Safety Protocol from the skill
- If --amend is used, verify the commit hasn't been pushed yet
- If --push is used, execute push workflow after successful commit
- Ask for clarification if the user's intent is unclear
