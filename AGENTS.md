# AGENTS Instructions

使用繁體中文或英文溝通。

## Startup

開始 repository-specific 工作前：

1. 閱讀 `dev/README.md`。
2. 閱讀 `dev/agent_rules/agent_startup.md`。
3. 依 `dev/README.md` 的 trigger map 載入相關 agent rules、standards、skills 與 workflows。

不要套用 Godot、GDScript、Scene 或 Autoload 慣例；本專案是 React／TypeScript Web application。

## Required checks

完成程式變更前執行 `npm run verify`。若環境沒有 npm，可使用相容的 package runner 執行同名 scripts，但不得改變 lockfile 格式。

僅修改文件或 tracking 時，依 `dev/agent_rules/lint_before_finish.md` 執行文件範圍的檢查，不必用完整 application build 取代 governance validation。

禁止在未經使用者要求時 commit、push、重寫歷史或修改遠端設定。
