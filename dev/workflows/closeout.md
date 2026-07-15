# Closeout Workflow

Closeout 將已完成工作從 forward surfaces 移除，將可觀察結果記錄於 CHANGELOG，並封存不再是 active authority 的 plan/spec/sketch。Closeout 不自動 stage、commit、push 或建立 PR。

Closeout 在整體狀態機中的進入條件與完成後轉移由 `work_lifecycle.md` 定義；本文件只定義 closeout 操作。

## Determine scope

1. 從當前使用者要求、working diff 或指定 plan/spec 確定已交付邊界。
2. 若無法區分哪個 child 或 flow 真的完成，先請使用者確認，不猜測進度。
3. 閱讀 parent plan、spec、relevant acceptance criteria 與實際 verification results。

## Child closeout

Child 完成時：

1. 確認該 child acceptance criteria 已達成，且必要 checks 已執行。
2. 在 `CHANGELOG.md` 記錄一個 outcome-focused entry；純 governance/tracking cleanup 可以略過 product changelog。
3. 從 parent plan child overview 移除該 child，不保留 checked row。
4. 將 child Implementation Spec 移到 `dev/docs/archived/`。Sketch 仍存在時，有歷史價值就一併封存，否則刪除。
5. Parent TODO 指針保留，直到整個 flow 完成。

## Flow closeout

整個 Main Plan 完成時：

1. 確認沒有未交付 children 或 acceptance criteria。
2. 若存在穩定且需要長期保留的 current system contract，將結論以現在式寫入 `dev/docs/systems/`；不複製 plan history。
3. 將 Main Plan 移到 `dev/docs/archived/`。
4. 從 `TODO.md` Active 或 Plan 刪除指針。Section 為空時保留明確 empty marker。
5. 將完成結果記錄於 CHANGELOG，不在 TODO 或 Plan 留 Done list。

## Superseded work

- 被新決策取代的 plan/spec 移到 `archived/`，並在文首簡短指向取代它的文件或產品決策。
- 刪除 active TODO 指針，或將它替換成新 plan 的唯一指針。
- 不在 active `plans/` 同時保留新舊兩個 source of truth。

## Final verification and report

1. 搜尋 TODO、parent plan 與 active plans，確認沒有 stale pointer。
2. 依 `agent_rules/lint_before_finish.md` 執行適用 checks。
3. 檢查 final diff，確認 unrelated user changes 未被納入。
4. 交付摘要說明：現在可做什麼、主要 architecture/schema 決策、實際 checks、migration 版本（若有）與明確延後項目。

不以「修改了哪些檔案」作為主要成果；交付摘要以可觀察狀態為主。
