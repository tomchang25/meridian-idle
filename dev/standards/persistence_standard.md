# Persistence Standard

## Boundary

IndexedDB 只透過 repository adapter 存取。Domain 與 components 不知道 database name、object store 或 transaction。

## Save envelope

每份存檔至少包含：

```ts
type SaveEnvelope = {
  version: number;
  savedAt: number;
  state: GameState;
};
```

## Requirements

- 寫入採 debounce 或 explicit checkpoint，避免每個 render 寫磁碟。
- 讀檔完成前不可用初始 state 覆蓋既有 save。
- 離線結算以 persisted timestamp 為基準並設上限。
- 多分頁同時開啟前必須定義 ownership；尚未定義前不得宣稱 multi-tab safe。
- Browser storage 失敗時 app 仍應可執行，只是顯示 persistence unavailable。
