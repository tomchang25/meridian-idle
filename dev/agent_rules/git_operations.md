# Git Operations

This file is Meridian's authoritative project-local Git operations contract. The shared default lives at `dev/foundation/core/agent_rules/git_operations.md`.

## Project policy

Meridian inherits the shared default: Git is read-only unless the user explicitly requests the corresponding mutation.

- Read-only inspection is allowed, including `status`, `diff`, `log`, `show`, `ls-files`, `cat-file`, and `check-ignore`.
- Without explicit authorization, do not stage, commit, branch, tag, restore, reset, stash, switch, rebase, remove, move, push, or mutate a remote.
- Do not include unrelated working-tree changes in formatting, closeout, staging, or commits.
- Never use `git reset --hard`, `git checkout -- <file>`, or another destructive operation to remove user content.
- If a Git mutation fails, do not retry it through another mutation path; stop and report the failure.
- When asked for a commit message, read `dev/foundation/core/workflows/commands/commit-msg.md`, `dev/foundation/core/standards/change_summary_standard.md`, and `dev/foundation/core/skills/conventional_commits.md`.
