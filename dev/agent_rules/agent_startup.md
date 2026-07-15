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
- Domain rules 不得依賴 React、DOM、IndexedDB 或 wall-clock globals。
- 不在 component 中重複實作 unlock、reward 或 check 公式。
- 使用繁體中文或英文撰寫溝通與專案文件。

## Documentation ownership

- Product decisions: `dev/docs/design/`
- Architecture and code contracts: `dev/standards/`
- Active implementation planning: `dev/docs/plans/`
- Shipped changes: root `CHANGELOG.md`
- Forward work: root `TODO.md`
