Precondition: A successful commit must already exist on the current branch.

## Push Guard

- This is the ONLY command allowed to execute `git push`
- Any other command attempting push is invalid

1. Switch to main and pull latest changes
2. Switch back to your local/feature branch
3. rebase your branch onto main 
    . If conflicts occur, execute `/solve`
4. Finally, push your branch to the remote repository

# Note
    - Warn if .gitignore files are staged or pushed

