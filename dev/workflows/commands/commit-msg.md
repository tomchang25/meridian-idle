# commit-msg — suggest a staged commit message

為目前 staged changes 建議 Conventional Commit message。

本 command 是 read-only。只讀 Git index，不 stage、commit、push、建立 PR 或修改任何 Git state。

## Required reading

1. `dev/agent_rules/git_operations.md`。
2. `dev/standards/change_summary_standard.md`。
3. `dev/skills/conventional-commits.md`。

## Detect scope

只執行 read-only staged commands：

- `git diff --cached --name-status`
- `git diff --cached --stat`
- `git diff --cached`

沒有 staged changes 時停止並說明無內容可摘要。除非使用者明確要求，不讀 unstaged/untracked changes，不用 working-tree diff 補齊 message。

## Steps

1. 讀取 staged file list、stat 與必要 diff，識別 staged snapshot 的 durable outcomes。
2. 選擇最符合的 type 與 optional scope：`feat`、`fix`、`docs`、`test`、`refactor`、`perf`、`build`、`ci`、`chore` 或 `revert`。
3. 輸出一個 recommended message：

```text
type(scope): concise outcome

- First logical outcome
- Second logical outcome
```

4. Body 預設二至三個 bullets。真的很小時只輸出 subject。
5. 不在 body 列 TODO/CHANGELOG/archive/closeout 操作，除非這些 governance artifacts 是 staged change 的主要產品。
6. 若 staged changes 包含多個不相關 commits，先建議拆分並說明邊界。只有使用者仍要單一 message 時才提供 fallback。

## Output

預設以一個 copy-pasteable text block 回傳 commit message。使用者明確要求 shell command 時，可改為：

```powershell
git commit -m "type(scope): concise outcome" -m "- First logical outcome`n- Second logical outcome"
```

只提供 command，不執行。

$ARGUMENTS
