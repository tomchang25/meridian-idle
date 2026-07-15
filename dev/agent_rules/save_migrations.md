# Save Migration Rules

已發布的 save payload 存在玩家裝置上，視為 public compatibility contract。現行 code 不再寫出舊格式，不代表讀取與 migration path 是 dead code。

## Compatibility rules

- Versioned migration steps 是 append-only。舊 steps 保留，讓 payload 可以依序 `v1 → v2 → v3`。
- Legacy keys、fallback reads、defensive defaults 與 idempotent cleanup 是 compatibility code，不因目前 fixtures 不再產生它們就刪除。
- 刪除或簡化已發布 compatibility path 需要使用者明確同意一次 declared compatibility break。
- Whole-save migration 由能看到完整 payload 的 persistence coordinator 擁有；feature section migration 由擁有該 persisted state 的 repository/store boundary 擁有。

## Schema changes

如果重命名、移除、重組或改變任何 serialized field 的語意：

1. 增加對應 save version。
2. 追加新 migration step，將舊 payload 轉換成現行 shape，不在正常 runtime 中分叉處理每個歷史版本。
3. Migration 保持 deterministic、pure 與 idempotent；不讀 React state、DOM、網路、wall clock 或目前 UI。
4. 完成所有 sequential steps 後才標記現行版本，避免中途失敗使 payload 假裝已升級。
5. 無法保留的 degraded/dropped data 必須透過 load result 或 user-visible recovery 清楚呈現，不得靜默遺失。
6. 若 migration 依賴即將被刪除的 type、lookup 或 content registry，停止並確認要保留 minimal legacy lookup、snapshot migration data，或接受明確 data loss。
7. 新增舊 payload fixtures、逐版升級 tests、current round-trip test 與 invalid/corrupt recovery test。

未知或損壞資料必須安全退回新遊戲或顯示可恢復錯誤，不得讓 application 無法啟動或靜默覆寫原始 payload。
