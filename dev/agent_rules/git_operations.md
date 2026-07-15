# Git Operations

Git 預設視為 read-only。只有使用者明確要求對應 mutation 時，才執行 staging、commit、branch、tag 或 remote 操作。

## Rules

- 可直接執行 read-only commands：`status`、`diff`、`log`、`show`、`ls-files`、`cat-file`、`check-ignore`。
- 未獲明確要求時，不執行 `add`、`commit`、`restore`、`reset`、`stash`、`checkout`、`switch`、`branch`、`tag`、`rebase`、`rm`、`mv`、`push` 或任何 remote mutation。
- 不得把 unrelated working-tree changes 納入自己的修改、formatting 或 closeout。
- 不使用 `git reset --hard`、`git checkout -- <file>` 或其他破壞性方式清除使用者內容。
- Git mutation 失敗後不換一種 mutation 「再試一次」；停止並回報。
- 使用者要求 commit message 時讀取 `dev/workflows/commands/commit-msg.md` 與 `dev/skills/conventional-commits.md`，並以實際交付結果而不是檔案清單命名。
