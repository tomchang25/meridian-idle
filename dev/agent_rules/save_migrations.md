# Save Migration Rules

- 已發布的 save payload 視為 public compatibility contract。
- 每次 breaking schema change 必須增加 save version。
- Migration 是 sequential、pure、idempotent 的資料轉換。
- Migration 不讀 React state、DOM、網路或當前 UI。
- 未知或損壞資料必須安全退回新遊戲或顯示可恢復錯誤，不得讓 app 無法啟動。
- 修改 migration 時必須加入舊 payload fixture 與 round-trip test。
