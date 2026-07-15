# Change Summary Standard

撰寫 commit message、review notes、PR title/description、CHANGELOG、closeout 或其他完成工作摘要時，使用本 standard。

## Core rule

描述 durable outcome，不描述 paperwork 或逐步操作。

- 能準確概括時，優先一個簡潔的整體結果。
- 只在存在明確獨立的 user-visible、system-visible 或 rule-visible outcomes 時分成多個 bullets。
- 使用平實、簡短、outcome-focused 措辭，不使用 hype 或未驗證 performance claims。
- 除非 implementation detail 必須用來識別 behavior/fix，否則不紀錄機械性實作步驟。
- 不列出逐檔修改、commands、TODO/CHANGELOG 更新、plan archival 或 closeout bookkeeping，除非這些 process artifacts 就是變更本身。

## Scope by artifact

- Commit subject：Conventional Commit 格式，簡潔 outcome phrase，無結尾句點。
- Commit body：預設零至三個 bullets，每個描述一個 logical outcome。
- PR title：描述整個 PR，不只描述最大 commit。
- PR description：組織 logical changes，不貼 raw commit list。
- Review finding：優先描述 behavior risk、regression、missing verification 或 standards violation，並附最小必要 file/line evidence。
- CHANGELOG entry：記錄 shipped outcome，不包含 commit ref 或 process-only maintenance。
- Closeout summary：將 tracking cleanup 與實際交付結果分開，不把封存文件寫成產品功能。

## Examples

Good commit body：

```text
- Persist market quotes across reloads within the same port session
- Refresh quotes only after docking at a different port
```

Bad commit body：

```text
- Edited market-session.ts
- Updated TODO.md and archived the spec
- Ran tests
```

Good CHANGELOG entry：

```text
- 2026-07-16 — [market] Market quotes now survive reloads and refresh only after a different-port arrival
```

Good PR Changes section：

```text
- Add persisted market-session quotes
- Settle port trade ledgers when the fleet reaches a different port
```
