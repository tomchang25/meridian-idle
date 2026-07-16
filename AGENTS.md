# AGENTS Instructions

使用繁體中文或英文溝通。

## Startup

開始 repository-specific 工作前：

1. 確認 `dev/foundation/` 已初始化；若未初始化，停止並要求執行 `git submodule update --init --recursive`。
2. 閱讀 `dev/foundation/core/agent_rules/foundation_startup.md`。
3. 閱讀 `dev/foundation/platforms/web-react/platform_startup.md`。
4. 閱讀 `dev/agent_rules/agent_startup.md`，再依其 project-local discovery 載入 Meridian 專屬規則。

不要套用 Godot、GDScript、Scene 或 Autoload 慣例；Meridian Idle 是 React／TypeScript Web application。

## Required checks

執行任何驗證前，先閱讀 `dev/agent_rules/test_operations.md`。完成程式變更前執行 `npm run verify`；僅修改文件或 tracking 時依該 contract 執行文件範圍驗證。若環境沒有 npm，可使用相容的 package runner 執行同名 scripts，但不得改變 lockfile 格式。

禁止在未經使用者要求時 commit、push、重寫歷史或修改遠端設定。
