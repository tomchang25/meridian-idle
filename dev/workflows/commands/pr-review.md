# pr-review — review a branch and draft PR text

審查目前 branch 相對 base branch 的完整變更，然後產生 Pull Request title 與 description。

本 command 是 read-only。不修改檔案、不 stage/commit/push、不開 PR。預設 base 是 `main`，除非使用者另行指定。

## Required reading

1. `dev/agent_rules/agent_startup.md` 與 `dev/agent_rules/git_operations.md`。
2. `dev/workflows/review_standard.md`。
3. `dev/standards/change_summary_standard.md`。
4. `dev/skills/conventional-commits.md` 與 `dev/skills/pr-convention.md`。
5. Branch scope 命名或指向的 Plan/Spec 與 relevant standards。

## Steps

1. 使用 read-only Git 檢查 branch：
   - `git branch --show-current`
   - `git log --oneline <base>..HEAD`
   - `git diff <base>...HEAD --name-status`
   - `git diff <base>...HEAD --stat`
2. 沒有 branch diff 時停止，不為空 PR 編造 title/description。
3. 對每個可 text review 的 changed file，讀取完整當前內容，再讀 `git diff <base>...HEAD -- <file>` 理解 branch change。
4. 搜尋 related codebase context：changed APIs/types、domain IDs、persisted keys、commands、selectors、events、styles、tests、workflow refs 與 standards refs。明確搜尋 stale names 或 removed behavior。
5. 依 `review_standard.md` 審查整個 branch scope，包含 full-file、robustness、stale/redundant、save/offline/browser、accessibility 與 verification checks。
6. 先回報 review findings 與 verdict，再撰寫 PR text。存在 `needs changes` 或 `blocked` 不會自動禁止產生 draft text，但必須讓使用者清楚它不是 ready approval。
7. 依 `pr-convention.md` 撰寫 conventional PR title 與 description，描述 PR 整體 logical outcomes，不貼 raw commit list。
8. `## Testing` 只列實際驗證。Title 帶 `!` 或 branch 有 breaking contract 時，必須加 `## Breaking changes` 與 migration path。

## Output

1. Review findings 與 `pass` / `needs changes` / `blocked` verdict，依 `review_standard.md` 組織。
2. 一個 copy-pasteable PR block：

```text
<conventional PR title>

## Summary

<problem, goal, and outcome>

## Changes

- <logical change>

## Testing

- <actual verification>
```

## Guardrails

- 不建立或修改 PR，不呼叫 remote mutation。
- 不以 commit list 代替 Changes summary。
- 不忽略較小 commit 的 regression；Review scope 是整個 merge-base diff。
- 不宣稱未實際執行的 tests/build。
- 不修正 findings，除非使用者另行明確要求。

$ARGUMENTS
