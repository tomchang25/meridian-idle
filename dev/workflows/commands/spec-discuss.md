# spec-discuss — resolve implementation-spec decisions

對照 live codebase 檢查預定 Implementation Spec target，只討論需要使用者權限的決策，並建立可供 `/spec-build` 使用的 locked input。

本 command 是 read-only。不修改、重命名或移除 source documents，不更新 lifecycle pointers，不執行 formatters/tests，也不實作工作。

## Input

使用者可以提供 plan child、sketch、TODO Draft、existing draft、feature request 或其他 focused brief：

```text
/spec-discuss <target or free-form brief>
```

當前對話已確認的決策與 source document 明確鎖定的行為是 authoritative input。除非 live code 暴露直接衝突，不因存在另一種實作方式就重開決策。

## Required reading

1. `dev/agent_rules/agent_startup.md`。
2. `dev/workflows/work_lifecycle.md`。
3. `dev/workflows/implementation_spec_standard.md`。
4. Named source document 與 parent plan（若有）。
5. Source artifact 對應的 Plan 或 Sketch standard。
6. `dev/docs/README.md` 與 target 發現的相關 standards、system docs、skills 與 tests。

## Steps

1. 用一句話重述預定 spec boundary，並識別它是 plan child 或 standalone work。
2. 閱讀 source/parent，擷取已鎖定的 requirements、non-goals、acceptance criteria、compatibility 與使用者決策。Parent-owned requirements 留在 parent，不規劃在 child spec 複製。
3. 獨立檢查 relevant live code。追蹤 current owner、call direction、data flow、save/hydration lifecycle、React rendered states、effect cleanup、browser fallbacks、tests 與預定移除的 old surface。
4. 區分 user-authority decisions 與 spec-author decisions。只詢問會改變 requirement、player-observable behavior、product scope、compatibility promise 或數值語意的選擇。File placement、API/type shape、ownership wiring、migration mechanics、test placement 等由 spec author 依已批准 intent 與 codebase constraints 決定。
5. 對每個必須確認的決策，提供 codebase evidence、各可行選項的 behavioral boundary，以及一個含簡短原因的 recommended default。一次 batch 所有已知決策。
6. 在 read-only boundary 內回答 follow-ups。使用者確認後，回傳簡短 `Locked Decisions` 與 `Build Readiness`，並指向 `/spec-build`；不自動開始寫 Spec。
7. 若沒有 user-authority decision，明確說明，摘要已鎖定行為，並報告 target 已可執行 `/spec-build`。

## Output

使用使用者的語言，code identifiers 與 paths 保留精確字串。只使用需要的 sections：

1. **Target** — spec boundary 與 lifecycle type。
2. **Codebase Fit** — 以 system relationships 組織約束方向的 evidence，不是 file inventory。
3. **Decisions to Confirm** — evidence、viable options、behavioral boundaries 與 recommendation。沒有時略過。
4. **Locked Decisions** — source-owned 或已確認且 `/spec-build` 必須保留的行為。
5. **Build Readiness** — 是否 ready，以及 `/spec-build` 應建立/取代的 target。

## Guardrails

- 不寫 Spec、Sketch、Plan 或 implementation。
- 不建立 `Open Questions` section；決策在對話中解決，不停放在 eventual Spec。
- 不把實作偏好包裝成使用者必須回答的產品問題。
- 不將 target 明確要取代的舊路徑誤報成 conflict。
- Recommendation 必須有具體 codebase/design evidence。
- 不執行 tests；本 command 驗證 context 與 decision boundary，不驗證 implementation。

$ARGUMENTS
