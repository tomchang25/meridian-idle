# research-context — retrieve relevant codebase context

針對 idea、TODO Draft、scratch notes 或小型 plan 擷取相關 codebase context，供後續討論或研究。

本 command 是 read-only。不修改檔案、不更新 lifecycle pointers、不執行 formatters、不 stage/commit，也不實作提案。

## Input

使用者可以提供 free-form brief：

```text
/research-context <idea, Draft, plan, or focused question>
```

將輸入視為 research brief，不視為 implementation authorization。

## Required reading

1. `dev/agent_rules/agent_startup.md`。
2. `dev/workflows/work_lifecycle.md`。
3. Brief 直接命名的 standards、skills、design docs、plans 或 system docs。
4. 搜尋中發現且真正約束目標的 canonical documents。

## Steps

1. 用一句話重述 research target 與邊界。
2. 從 brief 推斷可能相關的 domain、application commands、infrastructure adapters、React features、content、tests 與 docs。
3. 先使用 `rg` / `rg --files` 搜尋 terms、symbols、stable IDs、persisted keys、event names 與相關概念。
4. 直接讀取最相關檔案，不 bulk-read 不相關目錄，不輸出大量 raw file contents。
5. 追蹤 current ownership、call direction、data flow、persistence lifecycle、rendered states、tests，以及預期工作要 replace/migrate/rewire 的舊 surface。
6. 找出必須保留的 existing behavioral contracts，包含 save compatibility、offline/online parity、accessibility、error recovery 與 browser fallback。
7. 只在 discovered reference 會實質改變 blast radius 或 user-facing decision 時繼續追蹤，不把 retrieval 擴張成 implementation design。
8. 區分「brief 已預期取代的舊路徑」與「會影響邊界外 behavior 的真正 conflict」，不因舊實作不同就製造衝突。
9. 只列出需要使用者決定、且會改變 requirements、player-observable behavior、scope、compatibility 或數值語意的問題。File placement、API shape、schema layout、test placement 與其他可從已確定 intent/codebase constraints 推導的事，留給 spec author。

## Output

以使用者的語言回傳以下 sections：

1. **Research Target** — 推定的題目與範圍。
2. **Relevant Codebase Context** — 以 system relationships/ownership 組織 current state、replacement surface 與 preserved contracts。File paths 只用來支持判斷，不輸出 file inventory。
3. **Spec-Time Decisions** — 只放必須由使用者決定的行為/範圍問題，以 evidence 與 option boundary 表達，不代替使用者選擇。沒有時略過。
4. **Summary** — 簡短綜合目前 codebase 對工作的意義、必須保留的契約與是否還有 spec-time decisions，不加入前文未出現的提案。

## Guardrails

- 不擷取整個 repository，不產生 file-by-file reading checklist。
- 不寫 Plan、Sketch、Spec 或 implementation。
- 不將一個 missing technical detail 自動提升成 user decision。
- 不執行 tests，除非使用者明確要求；research 不是 verification。
- 不修改 TODO、Plan 或 lifecycle state。

$ARGUMENTS
