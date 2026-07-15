# Meridian Web Governance

本目錄是 Meridian Idle 自包含的 React／TypeScript Web 開發治理層。它保留分層載入、canonical ownership、trigger-based reading 與驗證後交付的流程契約，但不包含 Godot、GDScript、Scene 或 Autoload 慣例。

本專案目前不依賴外部 devkit。當同一套 Web 規則出現第二個 consumer 後，再評估抽成獨立、可版本化的 foundation repository。

## Placement

- `agent_rules/`：agent 操作限制、權限、驗證與環境行為。
- `workflows/`：由 `work_lifecycle.md` 定義工作流轉，artifact standards 定義 Plan、Sketch、Implementation Spec、Review 與 Closeout，`commands/` 定義如何執行各操作。
- `standards/`：codebase、UI、state、persistence、tests 與文件在正確時應呈現的契約。
- `skills/`：具體、可重複使用的 task recipe、format reference 與 Web／React hazard card。
- `docs/`：實際的 GDD、system design、active plans 與 archived work。
- `tools/`：governance validators 與其他可執行的開發工具。

檔名中有 `standard` 不代表必須放在 `standards/`；規定工作如何流轉的文件屬於 `workflows/`。一個規則不會因為主要由 agent 閱讀就自動屬於 `agent_rules/`。

## Required load order

1. Repository root `AGENTS.md`。
2. `agent_rules/agent_startup.md`。
3. 依下表載入與當前工作相關的 canonical documents。

## Trigger map

| 工作                                                     | Required reading                                                                                                                      |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| 新增、移動或重組檔案                                     | `standards/project_structure.md`, `standards/naming_conventions.md`                                                                   |
| 修改 persisted state、command、selector 或 runtime owner | `standards/runtime_ownership.md`, `standards/state_management.md`                                                                     |
| 修改 React component、hook、effect 或 responsive UI      | `standards/react_component_standard.md`, `standards/accessibility_standard.md`; effect 工作再讀 `skills/react-strict-mode-effects.md` |
| 修改 IndexedDB、save schema 或 migration                 | `standards/persistence_standard.md`, `agent_rules/save_migrations.md`, `skills/indexeddb-upgrade-transactions.md`                     |
| 修改 offline 或 elapsed-time resolution                  | `standards/state_management.md`, `skills/offline-time-resolution.md`                                                                  |
| 修改 PWA、service worker、cache 或 browser API           | `standards/web_platform_standard.md`; cache 工作再讀 `skills/service-worker-cache-versioning.md`                                      |
| 建立或更新 Main Plan                                     | `workflows/work_lifecycle.md`, `workflows/plan_standard.md`, `docs/README.md`                                                         |
| 建立 Child Sketch                                        | `workflows/work_lifecycle.md`, `workflows/sketch_standard.md`, parent plan                                                            |
| 建立或執行 Implementation Spec                           | `workflows/work_lifecycle.md`, `workflows/implementation_spec_standard.md`, parent plan/sketch 與相關 live code                       |
| 執行 review                                              | `workflows/review_standard.md`, 與變更相關的 standards                                                                                |
| 完成一個 child 或 flow                                   | `workflows/work_lifecycle.md`, `workflows/closeout.md`, `docs/README.md`                                                              |
| 取得 focused research context                            | `workflows/commands/research-context.md`                                                                                              |
| 討論 Spec 前的 user-authority decisions                  | `workflows/commands/spec-discuss.md`                                                                                                  |
| 建立 verified Spec                                       | `workflows/commands/spec-build.md`                                                                                                    |
| 審查 staged snapshot                                     | `workflows/commands/stage-review.md`                                                                                                  |
| 執行 tracking/document closeout                          | `workflows/commands/closeout.md`                                                                                                      |
| 產生 staged commit message                               | `workflows/commands/commit-msg.md`, `standards/change_summary_standard.md`, `skills/conventional-commits.md`                          |
| 審查 branch 並撰寫 PR text                               | `workflows/commands/pr-review.md`, `workflows/review_standard.md`, `skills/pr-convention.md`                                          |
| 新增 tests 或交付程式變更                                | `standards/testing_standard.md`, `agent_rules/lint_before_finish.md`                                                                  |
| 任何 git mutation                                        | `agent_rules/git_operations.md`                                                                                                       |
| 修改 governance 文件或 linter                            | `standards/standards_enforcement.md`, `agent_rules/lint_before_finish.md`                                                             |

## Canonical ownership

每條規則只在一個 canonical 文件中維護。其他文件只負責連結或觸發該規則，不複製內容。如果一條規則適用於多個專案，先等到有第二個真實 consumer，再從專案層抽離。

`workflows/commands/*.md` 是 repository-local operational contracts，不是 shell scripts，也不會因檔案存在就自動註冊成 client slash command。當使用者指定 command 名稱或明確要求對應操作時，agent 讀取並依該 contract 執行。
