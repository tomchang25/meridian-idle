# Meridian Web Devkit

本目錄是 Meridian Idle 自包含的 Web 開發治理層。它參考原 Godot devkit 的「分層載入、canonical standards、trigger-based reading、驗證後交付」概念，但內容已完全改寫為 React／TypeScript Web application。

本專案目前不依賴外部 devkit submodule。規範若成熟到能被其他 Web 遊戲直接採用，再評估抽成獨立 repository。

## Load order

1. `agent_rules/agent_startup.md`
2. 與修改內容相符的 `standards/*.md`
3. 需要計畫、實作規格或 review 時，讀取對應的 `workflows/*.md`

## Trigger map

| 工作                          | Required reading                                                               |
| ----------------------------- | ------------------------------------------------------------------------------ |
| 新增或移動檔案                | `standards/project_structure.md`, `standards/naming_conventions.md`            |
| 修改 state、command、selector | `standards/runtime_ownership.md`, `standards/state_management.md`              |
| 修改 React component          | `standards/react_component_standard.md`, `standards/accessibility_standard.md` |
| 修改 IndexedDB 或 schema      | `standards/persistence_standard.md`, `agent_rules/save_migrations.md`          |
| 修改 Web/PWA/browser API      | `standards/web_platform_standard.md`                                           |
| 新增測試或交付前              | `standards/testing_standard.md`, `agent_rules/lint_before_finish.md`           |

## Canonical rule

規則只在一個 canonical 文件中維護。其他文件應連結它，不要複製同一段規則形成分叉。
