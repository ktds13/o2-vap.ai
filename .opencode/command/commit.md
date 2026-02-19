
1. Load the git-commit-sample skill
2. Handle flags:
   - --all: Stage all changes before commit
   - --amend: Amend previous commit (verify not pushed yet)
   - --push: Execute push workflow after successful commit
3. Execute commit workflow from skill
4. If --push flag present, push to remote

## Safety Rules
- NEVER amend commits already pushed to remote
- Follow Git Safety Protocol from loaded skill