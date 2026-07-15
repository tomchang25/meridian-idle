# Pull Request Convention

PR title/description 延伸 `conventional-commits.md` 與 `dev/standards/change_summary_standard.md`。這份 skill 只定義 PR-specific shape。

## Title

```text
<type>[optional scope][!]: <description>
```

- 描述 PR 整體，不是最大 commit。
- 如果 PR 同時包含附帶 fix/refactor，使用主要 outcome 的 type。
- Title 必須能獨立成為 squash commit subject：簡潔、無結尾句點，目標不超過 72 characters。

## Description

使用以下順序：

### `## Summary` (required)

一至三句說明改了什麼與為什麼。對無上下文的 reviewer 也必須成立，先寫 problem/goal，不先寫 implementation。

### `## Changes` (required)

列出 logical changes，不列 commits。簡單 PR 使用 bullets；大型 PR 在 `## Changes` 內以 `###` 依 area/module 分組，只有真的獨立 feature strands 才依 theme 分組。

### `## Testing` (optional)

列出實際執行的 commands 與有意義 manual verification。沒有執行 tests 時明確說明原因。

### `## Breaking changes` (required when applicable)

Title 帶 `!` 或 commits 含 `BREAKING CHANGE:` 時必須出現。說明破壞什麼與 migration path，包含 save schema、public API、content data 或 deployment contract。

### `## Notes` (optional)

只放 known limitations、follow-up、review focus 或 UI screenshots 等非 change list 內容。

## Rules

- 不將 raw commit list 貼成 `## Changes`。
- 不在固定 column hard-wrap prose。
- Issue/plan closing reference 放在 Summary 末尾，不另建 section。
- 只列實際 tests，不從 package scripts 猜測已執行內容。

## Example

```text
feat(trade): add persistent port market sessions

## Summary

Port prices previously had no durable visit boundary. This persists one market session per current port so reloads keep the same quotes while travel to another port produces a new visit.

## Changes

- Persist current-port quotes and net trade ledgers
- Settle port mastery when the fleet docks at a different port
- Keep same-port departure and return within the existing session

## Testing

- `npm run verify`
```
