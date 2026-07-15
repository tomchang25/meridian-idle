# closeout — close completed plan or spec work

依 canonical Closeout Workflow 更新 CHANGELOG/TODO，移除 active pointers，並封存已完成 Plan/Spec/Sketch。

本 command 只執行 documentation/tracking cleanup。不 stage、commit、push、建立 PR 或自動執行 `/pr-review`。

## Required reading

1. `dev/agent_rules/agent_startup.md`。
2. `dev/workflows/work_lifecycle.md`。
3. `dev/workflows/closeout.md`。
4. `dev/docs/README.md`。
5. `dev/standards/change_summary_standard.md`。
6. 預定 closeout 的 parent Plan、Spec 與 verification results。

## Detect scope

先執行 read-only Git commands：`git status --short`、`git branch --show-current`、必要時加入 `git diff --cached --stat` 或 base-branch diff。

- **Staged mode**：有 staged changes 時，completed scope 以 staged diff 為主。
- **Branch mode**：沒有 staged changes、目前 branch 非 `main` 且 ahead of base 時，scope 是 merge-base diff；一個 branch 可能完成多個 plans。
- **Explicit mode**：使用者明確指定 child/Plan/Spec 與已完成實作，即使未 staged 也可以它為 scope。
- 無法判定 completed scope 時，詢問使用者，不猜測交付狀態。

## Steps

1. 識別 scope 對應的 Main Plan/child Spec。找不到時詢問使用者，不為了繼續而新建虛構 Plan。
2. 讀取每個 artifact，確認已完成的 child/flow、acceptance criteria 與實際 verification。未完成或未取得接受的項目不 close out。
3. 依 `dev/workflows/closeout.md` 分類為 Child Closeout、Flow Closeout 或 Superseded Work，套用正確 tracking transition。
4. 對 shipped outcome 更新 `CHANGELOG.md`：
   - 對應現有 changelog 結構，使用今日日期與穩定 scope tag。
   - 預設每個 Plan 一個簡潔 outcome entry；只有分開會更準確時才寫多個 bullets。
   - 純 dev-process maintenance 不冒充 product CHANGELOG outcome。
5. Child Closeout：從 parent overview 移除 child，封存 Spec，並封存或刪除舊 Sketch；保留 parent TODO pointer。
6. Flow Closeout：封存 Main Plan、刪除 TODO Active/Plan pointer，並在需要時先將 current durable contract 寫入 system docs。
7. 保持 TODO sections。Active/Plan 為空時留下明確 empty marker，不建立 Done tier。
8. 搜尋 TODO、parent 與 active plans 中指向已封存 artifact 的 stale references。只修正本 lifecycle transition 擁有的 references。
9. 對 changed Markdown 執行 Prettier check 與 `npm run governance:check`（或 AGENTS 允許的相容 runner）。
10. 執行 `git status --short`，回報 changelog、pointer、archive 與 lint results，再建議使用 `/commit-msg`。

## Guardrails

- Closeout 不是補實作或變更 acceptance criteria 的機會。
- 不將「有 diff」當成「已完成」的證據。
- 不自動 stage/commit/push，不修改 remote/branch。
- 不將 unrelated user changes 納入 closeout。

$ARGUMENTS
