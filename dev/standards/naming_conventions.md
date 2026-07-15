# Naming Conventions

- TypeScript files: `kebab-case.ts` / `kebab-case.tsx`
- React components and exported types: `PascalCase`
- Functions、variables、hooks: `camelCase`
- Hooks: `useXxx`
- Constants: `UPPER_SNAKE_CASE` only for module-level immutable constants
- CSS Module classes: `camelCase`
- Domain ids and persisted keys: stable `kebab-case` strings
- Test files: `<subject>.test.ts` / `<subject>.test.tsx`

避免 `Manager`、`Helper`、`Utils` 等無法說明責任的名稱。Application gateway 使用 `System`、`Store` 或具體 use-case 名稱時，文件必須定義 owner。
