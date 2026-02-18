---
description: Push commits to remote repository
---

# Push Command

Load the git-commit-push skill and help the user push their changes to the remote repository.

## Usage

- `/push` - Push commits to remote
- `/push --force` - Force push (use with extreme caution)
- `/push --set-upstream` - Push and set upstream branch

## Workflow

1. Load the git-commit-push skill
2. Check for uncommitted changes
3. If uncommitted changes exist, ask user if they want to commit first
4. Check for --force flag (warn if pushing to main/master)
5. Check for --set-upstream flag to set upstream branch
6. Execute the push workflow from the skill
7. Report success or failure with clear messaging

## Important Notes

- Always follow the Git Safety Protocol from the skill
- NEVER force push to main/master without explicit confirmation
- If force push is requested, show a warning and confirm
- Check for remote changes before pushing
- Advise user to pull first if remote has changes
