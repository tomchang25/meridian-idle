# Agent Startup

## Project snapshot

- Product: maritime incremental / management game
- Runtime: browser
- Language: TypeScript with strict mode
- UI: React, semantic HTML, CSS Modules
- Persistence: IndexedDB through repository adapters
- Primary build: Web/PWA
- Tests: Vitest and React Testing Library

## Execution defaults

- 使用現有 package manager 與 lockfile，不自行切換。
- 優先修改既有 feature，不為假設性的未來重用建立 abstraction。
- 使用繁體中文或英文撰寫溝通與專案文件。
- 文件中的 code identifiers、file paths 與 command names 保留實際英文字串。

## Reading behavior

- 先依 `dev/README.md` trigger map 載入相關文件，不一次讀完所有 standards 或 skills。
- 被觸發的文件必須完整讀取，不只讀 heading 或擷要。
- 若文件指向另一個 canonical owner，讀取 canonical owner，不從 pointer 猜測規則。
- 直接修改此 governance 層時，先讀 `dev/standards/standards_enforcement.md`。

## Documentation ownership

- Product decisions: `dev/docs/design/`
- Architecture and code contracts: `dev/standards/`
- Active implementation planning: `dev/docs/plans/`
- Shipped changes: root `CHANGELOG.md`
- Forward work: root `TODO.md`
