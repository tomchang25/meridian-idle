# State Management

State 分成三類：

1. UI state：目前 tab、filter、modal、drawer。
2. Game state：船長、資源、技能、Mastery、current action、event log。
3. Derived state：unlock、成功率、報酬預覽、progress、有效副官加成。

Derived state 優先用 pure selector 計算，不重複存入 save。只有昂貴且能證明需要的計算才 memoize。

所有 store commands 必須：

- 驗證前置條件。
- 以 immutable update 回傳新狀態。
- 同步產生必要 log 或 domain result。
- 保持可測試，不依賴 component tree。
