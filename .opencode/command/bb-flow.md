---
description: Orchestrates bb commands in a fixed sequence. This command does not perform git operations itself.
---

# BB Workflow

## Execution Order (Mandatory)

1. Execute `/bb-commit`
2. If `/bb-commit` does NOT complete successfully, ABORT
3. Execute `/bb-push`

---

## Abort Conditions

- If any git push occurs outside `/bb-push`, ABORT immediately
- This command performs NO git operations
