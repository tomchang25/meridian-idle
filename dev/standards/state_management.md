# State Management

State 依 lifecycle 與 owner 分類，不依目前產品 feature 清單分類：

1. UI state：只影響當前 presentation session 的 tab、filter、modal、drawer、draft input。由 owning component 或 feature UI store 擁有，不進入 game save。
2. Persisted game state：玩家進度、資源、位置、進行中長期 operation 與重開 application 後必須保留的資料。只由 application commands 修改。
3. Runtime transient state：hydration status、pending write、目前 browser capability 與可重建的 process-local coordination。由 application/infrastructure boundary 擁有，不假裝是玩家進度。
4. Derived state：可從 canonical state 與 content 計算的 unlock、preview、progress、capacity 與 eligibility。預設不存檔。

Derived state 優先用 pure selector 計算。只有已證明昂貴的計算才 memoize；memoization 是 performance detail，不是第二份 state owner。

所有 store commands 必須：

- 驗證前置條件。
- 以 immutable update 回傳新狀態。
- 同步產生必要 log 或 domain result。
- 保持可測試，不依賴 component tree。
- 將 `now`、RNG、storage 與 browser capability 以 explicit input 或 adapter 傳入。
- 對無效 command 回傳明確 result/error，不做 partial mutation。

Persisted state 與 event log、financial/accounting result 或 dirty-save marker 需要一致時，必須在同一 application transaction 內協調。
