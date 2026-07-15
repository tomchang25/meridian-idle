# Review Standard

Review 是 read-only 診斷，優先找可造成進度遺失、行為錯誤、契約破壞或無法恢復的問題。除非使用者同時要求修正，Review 不修改程式、文件或 tracking。

## Required preparation

1. 讀取所有受審檔案的完整當前內容，不只讀 diff hunk。
2. 讀取與變更相關的 standards、agent rules、skills、parent plan/spec 與 tests。
3. 檢查 call sites、state owner、persistence boundary、rendered states、cleanup path 與舊 surface 是否仍有 consumer。
4. 不因 tests 通過就停止 code review，也不以 build 通過代替 behavior review。

## Finding priority

1. Save corruption、進度遺失、重複 reward、不可逆 migration。
2. State ownership、dependency direction、transaction boundary 或 concurrency 破壞。
3. Offline time、RNG、timezone、multi-tab、background throttling 與 reload 不一致。
4. 用戶可見邏輯錯誤、error recovery 或 stale state。
5. Accessibility、responsive、keyboard 與 browser compatibility regression。
6. Missing tests、performance、dead paths、stale names 與維護性。

## Required checks

### Behavioral and relational check

- 每個 mutation 是否由正確 owner 執行。
- Selector 與 UI 是否只呈現 state，沒有重複 domain rules。
- Persistence adapter 是否不決定 gameplay。
- Error、cancel、reload、unmount 與 retry path 是否回到一致 state。

### Stale/redundant check

- 被取代的 symbols、styles、tests、save keys、event names 與 docs 是否仍有 stale reference。
- 新舊路徑是否同時修改同一 state。
- 是否為未來假設留下未使用 abstraction。

### Robustness check

- Empty、zero、maximum、invalid、unknown-version 與 partial-failure inputs。
- Effect cleanup、Strict Mode rerun、rapid repeated input 與 concurrent async completion。
- Offline/online parity、persist/reload parity 與 deterministic replay。

### Standards, lint, and tests

- 變更是否符合被觸發的 canonical standards。
- Tests 是否驗證 observable behavior 而不是 implementation detail。
- 交付摘要宣稱的 checks 是否實際執行。

## Finding format

每個 finding 包含：

- Severity。
- 檔案與最小必要 line range。
- 觸發條件或可重現情境。
- 實際影響，特別是玩家進度、UI 或 compatibility。
- 為什麼現有保護或 tests 沒有阻止它。

結果先列 findings，依 severity 排序。沒有 finding 時明確說明，並列出仍存在的測試或驗證缺口。不用大段摘要淹沒 findings。

## Per-file review summary

完成 findings 後，以簡短清單註記每個審查檔案的結果：有 finding、無 finding，或只有未驗證 risk。這不取代 findings，只證明 review 範圍已完整覆蓋。
