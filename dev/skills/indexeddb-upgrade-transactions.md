# IndexedDB Upgrade Transactions

IndexedDB schema upgrade 只能在 `versionchange` transaction 內改變 object stores 與 indexes。Upgrade callback 一旦結束 event turn 或 transaction 被不相關 async work 中斷，之後再寫 schema 會失敗或留下部分升級狀態。

## Hazard

- 在 `onupgradeneeded` 內 `await` fetch、timer 或其他不受 transaction 管理的 Promise。
- 用 application save version 代替 IndexedDB database version，把 storage layout migration 與 payload migration 混為同一個數字。
- Upgrade 被另一個 tab 的舊 connection 阻擋時沒有呈現 blocked state。
- 讀檔失敗後直接寫入 default state，覆蓋原始 payload。

## Safe shape

1. Database version 只描述 object store/index layout；SaveEnvelope version 只描述遊戲 payload schema。
2. `onupgradeneeded` 內只執行同步 schema operations 與屬於該 transaction 的 requests。
3. 開啟成功後再執行 pure payload migration，並在完整成功後原子寫回。
4. 處理 `blocked`、`versionchange`、quota、private-mode 與 transaction abort；application 保持可玩並顯示 persistence unavailable/recovery。
5. Tests 覆蓋新資料庫、舊 database layout、舊 payload、blocked upgrade 與 write failure。

## Review prompts

- 這次變更是 database layout 還是 payload schema，版本 owner 是否正確？
- Upgrade transaction 是否穿越了不安全 async boundary？
- Hydration 完成前，autosave 是否可能覆寫舊 save？
