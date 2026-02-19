1. Check current branch:
     if no commits to push,
     - Load and use git-commit-sample skill
2. If not on main/origin branch:
   - Switch to main and pull latest changes
   - Switch back to feature branch
   - Rebase branch onto main
   - If conflicts occur, stop and advise user to resolve
3. Handle flags:
   - --force: Warn if pushing to main/master, require confirmation
   - --set-upstream: Set upstream branch with -u flag
4. Push commits to remote repository
5. Report success or failure

## Safety Rules
- NEVER force push to main/master without explicit confirmation
- Check for remote changes before pushing (advise pull if needed)
- Warn if .gitignore files are staged or pushed
