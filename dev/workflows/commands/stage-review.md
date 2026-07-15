# stage-review — review the staged snapshot

依 referenced Plan/Spec 與 shared Review Standard 審查目前 Git index 中的 staged snapshot。

本 command 是 read-only。不修改檔案、不 stage/unstage、不 commit/push，不自動修正 findings。

## Scope

- Review scope 只包含 staged files 與 staged hunks。
- Unstaged/untracked files 只能作為 related context，不列入 review verdict。
- 如果同一檔案同時有 staged 與 unstaged changes，審查 Git index 內容，不把 working-tree overlay 誤當 staged result。

## Required reading

1. `dev/agent_rules/agent_startup.md`。
2. `dev/workflows/review_standard.md`。
3. Staged scope 觸發的 standards、skills 與 agent rules。
4. Staged files 或 tracking 指向的 parent Plan 與 Implementation Spec。

## Steps

1. 執行 `git diff --cached --name-status` 與 `git diff --cached --stat`。沒有 staged changes 時停止並說明無 scope。
2. 執行 `git diff --cached --check` 檢查 whitespace errors。
3. 若 staged scope 含 `dev/docs/plans/` 中的 Plan/Spec，從 Git index 讀取該 artifact 作為 approved boundary。
4. 對每個可以 text review 的 staged file，使用 `git show :<path>` 或其他 read-only index command 讀取完整 staged contents，再讀取 `git diff --cached -- <path>` 理解變更。
5. 搜尋 related codebase context：changed APIs/types、domain IDs、persisted keys、selectors、events、CSS hooks、tests、workflow refs 與 standards refs。明確搜尋 staged diff 引入的 stale names 或 removed behavior。
6. 對完整 staged contents 套用 Review Standard 的 behavioral、stale/redundant、robustness、accessibility、persistence 與 test checks，不只看 changed hunks。
7. 只執行不修改檔案的 relevant checks。Governance/docs scope 可執行 `node dev/tools/check-governance.mjs` 與 Prettier check；TypeScript/React scope 可執行 focused tests/typecheck/lint，但不預設執行完整 production build，除非使用者要求。
8. 如果 working tree 與 index 的重疊變更讓 checker 無法準確評估 staged snapshot，在 report 中標示驗證限制，不宣稱 staged version 已通過該 check。
9. 依 `review_standard.md` 回報 findings、per-file summary、stale/redundant result、robustness result 與 standards/lint/test result。

## Verdicts

保留以下 English verdict labels：

- `pass`：沒有 actionable finding，必要 checks 已通過。
- `needs changes`：存在必須修正的 correctness、contract、test 或 standards finding。
- `blocked`：無法取得必要 scope/context，或 staged snapshot 無法可靠驗證。

## Guardrails

- 不包含 unstaged/untracked work 的 findings，除非它直接證明 staged change 的 integration risk。
- 不用 working-tree file 取代 index snapshot。
- 不以 tests 通過取代 full-content review。
- 不修正 findings，除非使用者另行明確要求。

$ARGUMENTS
