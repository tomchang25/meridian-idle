# Verification Before Finish

驗證必須與變更範圍相符，並實際證明交付的契約。

## Program changes

交付 TypeScript、React、CSS、runtime config、package scripts 或 build behavior 變更前執行：

```text
npm run verify
```

`verify` 必須包含 governance check、format check、typecheck、ESLint（zero warnings）、tests 與 production build。不可用任何一項成功代替另一項。

## Documentation-only changes

僅修改 Markdown、TODO、CHANGELOG、plans 或 governance prose 時：

1. 對 changed Markdown files 執行 Prettier check。
2. 執行 `npm run governance:check`。
3. 不需要執行 application typecheck、tests 或 build，除非文件變更同時改了 package/build behavior。

## Focused checks

- Bug fix 先執行能重現問題的 focused regression test，再執行 repository verify。
- Migration 先執行 old-payload fixtures 與 round-trip tests。
- UI 變更包含 component interaction、keyboard 與 responsive checks，不只是 build。
- Governance linter 變更必須先執行 linter 本身，再執行完整 verify，確認 package script integration。

若某一步因環境限制無法執行，交付時必須說明未驗證的部分與原因。
