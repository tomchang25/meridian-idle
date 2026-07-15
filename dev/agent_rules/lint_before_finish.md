# Verification Before Finish

程式碼變更交付前執行：

```text
npm run format:check
npm run typecheck
npm run lint
npm run test
npm run build
```

`npm run verify` 應涵蓋相同順序。ESLint warnings 必須視為失敗。不可用 build 成功代替 tests，也不可用 tests 成功代替 typecheck。

若某一步因環境限制無法執行，交付時必須說明未驗證的部分與原因。
