# spec-build — build a verified implementation spec

為 focused work item 建立最終、codebase-verified Implementation Spec，並更新 source document 與 tracking pointers，使 Spec 成為唯一 actionable implementation handoff。

本 command 只修改文件。不實作程式、不 stage/commit/push、不建立 PR，不執行 application tests 或 production build。

## Input

使用者可以提供 plan child、sketch、TODO Draft、existing draft、narrow feature request 或其他 focused target：

```text
/spec-build <target or free-form brief>
```

Command 可以接續同一對話的 `/spec-discuss`，或直接執行。當前對話明確確認的決策是 input 的一部分。

## Required reading

1. `dev/agent_rules/agent_startup.md`。
2. `dev/workflows/work_lifecycle.md`。
3. `dev/workflows/implementation_spec_standard.md` 完整內容。
4. `dev/docs/README.md`。
5. Named source document、parent plan 與 source artifact standard（若有）。
6. Target 發現的所有相關 rules、standards、system docs、skills 與 tests，包含 `dev/agent_rules/lint_before_finish.md`。

## Decision gate

任何編輯前：

1. 集合 source documents 與當前對話已鎖定的 behavior、scope、compatibility 與 numerical decisions。
2. 獨立重讀 relevant live code，不信任早期 research/sketch 的 codebase 判斷。驗證 current ownership、call direction、data flow、save/hydration lifecycle、rendered states、effect cleanup、browser fallback、tests 與 replacement surface 的完整 blast radius。
3. 依 approved intent 與 repository constraints 解決 implementation architecture。不請使用者選 file placement、API/type shape、migration mechanics、test placement 或其他可安全推導的技術細節。
4. 若尚有選擇會改變 requirement、player-observable behavior、scope、compatibility promise 或數值語意，在任何編輯前停止，一次列出 evidence、viable options 與 recommended default，等待確認。
5. 如果 live code 與已鎖定決策直接衝突，解釋具體 conflict 並停止，不靜默改寫 approved behavior。

## Steps

1. 將 target 分類為 plan child 或 standalone spec，依 `implementation_spec_standard.md` 確定 destination 與 parent marker。
2. 從 live code 建立 verified implementation model：所有 touched relationships、changed contracts、state owners、wrong shapes、file responsibilities、safe landing order、migration/UI/browser hazards、meaningful edge cases 與 observable acceptance outcomes。
3. 依 `implementation_spec_standard.md` 的結構與語言規則寫 Spec。Summary 是 human approval surface；Relational Context 必須覆蓋 Files to Change 內每個 relationship。
4. 執行正確 lifecycle update：
   - Plan child：parent overview 改指新 `.implementation_spec.md`，保留 parent-owned requirements，移除被取代的 active sketch，不加 TODO 條目。
   - Standalone spec：TODO 保留/建立正好一個指針；已 Active 就保持 Active，否則放 Plan。移除被取代的 Draft section 或 stale pointer。
   - 從 standalone sketch/Draft 轉換時，不在 active plans 留下兩個 source of truth。歷史討論有保留價值就封存，否則刪除。
   - 直接從 feature request 建立時，只建必要 Spec 與單一 lifecycle pointer。
5. 搜尋 updated parent、TODO 與 active plans，修正本次 lifecycle transition 導致的 stale source filename/document form references，不動 unrelated content。
6. 對 changed Markdown 執行 Prettier check，並執行 `npm run governance:check`。若全域 npm shim 無法使用，依 AGENTS 使用相容 runner 或直接執行 `node dev/tools/check-governance.mjs`。
7. 檢查 final diff，回報 created Spec、replaced/archived source、pointer updates、captured locked decisions 與 lint result。不宣稱 implementation 已完成。

## Guardrails

- Sketch/research 是 context，不是 verified authority。
- Decision gate 通過前不開始文件編輯。
- Spec 不包含 unresolved questions 或 `Open Questions`。
- 不複製 parent requirements，不給 plan child 獨立 TODO pointer。
- 不加 speculative future scope、incidental cleanup、assets、tests 或 migrations，除非 approved behavior 與 verified blast radius 需要。
- 不因翻新命名就保留已明確要移除的 legacy path；但已發布 save/API compatibility 必須依規則保留或取得 break approval。
- Documentation-only spec build 不執行 TypeScript tests、browser tests 或 production build。
- 不觸碰 unrelated user changes，不 stage/commit/push。

$ARGUMENTS
