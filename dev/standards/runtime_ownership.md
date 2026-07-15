# Runtime Ownership

## Direction

```text
React UI → application command → domain rule/state → persistence adapter
React UI ← selector/derived view ← domain state
```

依賴只能朝內：domain 不 import application、infrastructure 或 React。

## Mutation boundary

- Component 可以保存 hover、modal、filter 等 UI-only state。
- 遊戲進度只能由 application command 修改。
- Store mutation 與 event log、dirty save 必須在同一 application transaction 協調。
- Component 不直接寫入 IndexedDB。
- Infrastructure adapter 不決定 reward、unlock 或 progression 規則。

## Time

Domain function 透過參數接收 `now`；不要在 pure rule 內直接呼叫 `Date.now()`。Application layer 負責取得 wall-clock time。
