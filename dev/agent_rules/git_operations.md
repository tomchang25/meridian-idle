# Git Operations

- 讀取 status、diff、log 可直接進行。
- Commit、push、tag、rebase、reset、branch deletion 需要使用者明確要求。
- 不得把 unrelated working-tree changes 納入自己的修改。
- 不使用 `git reset --hard` 或 `git checkout -- <file>` 清除使用者內容。
- Commit message 採 Conventional Commits，例如 `feat(action): add offline resolution`。
