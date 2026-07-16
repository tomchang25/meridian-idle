# Documentation Model

每個事實只有一個 owner。文件層級依讀者與變動頻率區分，不依「重要程度」區分。

| 層級                    | 內容                                        | 位置          | 變動時機                 |
| ----------------------- | ------------------------------------------- | ------------- | ------------------------ |
| Product truth           | 核心循環、產品規則、數值語意                | `design/`     | 產品決策改變時           |
| Evergreen system design | 當前 system 的目的、flow、invariants        | `systems/`    | 已實作系統契約改變時     |
| Forward work            | 尚未交付的 plan、sketch、spec               | `plans/`      | 工作流轉時               |
| Historical context      | 已完成或被取代的 plan/spec                  | `archived/`   | Closeout 或 supersede 時 |
| Code contract           | 名稱、型別、局部責任與 non-obvious behavior | code 與 tests | 同一次程式變更           |

## Current design index

- `design/meridian-idle_v5.md`：目前產品設計基準，GDD v5.0 Core。
- `design/meridian-idle_v5_automation-and-logistics.md`：Frozen Automation and Logistics extension。
- `design/meridian-idle_v5_skills.md`：Frozen Skills extension。
- `design/meridian-idle_v5_quality-trade.md`：Frozen Quality Trade extension。
- `design/meridian-idle_v5_pirate-danger-and-patrol.md`：Frozen Pirate Danger and Patrol extension。
- `design/meridian-idle_v4.md`：歷史設計，GDD v4.0。
- `design/meridian-idle_v3.md`：歷史設計，GDD v3.0。
- `design/meridian-idle_layout.md`：舊版 Web layout 參考；與 V5 衝突時以 V5 GDD 與新 plan 為準。

## Tracking ownership

- `TODO.md` 是唯一 forward surface，只保留未完成項目與 active plan 指針。
- `dev/docs/plans/` 保存需要順序、相依或驗收邊界的進行中工作。
- `CHANGELOG.md` 是唯一 shipped history。
- 不建立 Done list；完成就從 TODO 與 active plan 移除，結果只記錄一次於 CHANGELOG。

## TODO maturity

- `## Active`：目前正在實作或已準備立即執行的 flow；每個只有一行 plan 指針。
- `## Plan`：已有 `plans/*.md` 的 queued flow；每個只有一行指針。
- `## Chore` 與 `## Bug`：不需要獨立文件的單行工作。
- `## Draft`：已超過一行但尚未成熟為 plan 的討論；每個概念使用一個 `###` section。

一個 Draft 需要子結構、明確順序或穩定連結時，將它移到 `plans/` 並在 `## Plan` 留一行指針；不在兩處複製說明。

## Plan lifecycle

完整的 `Draft → (Probe) → Plan → Sketch → Implementation Spec → Implementation → Verify → Closeout` 狀態機由 `dev/foundation/core/workflows/work_lifecycle.md` 唯一定義。本文件只擁有 TODO、active plans、archived docs 與 CHANGELOG 的 tracking 位置。

Plan child sketch/spec 只由 parent plan 指向，不另建 TODO 條目。Active plan 不保留 checked-off completed phases；shipped history 只存在於 CHANGELOG。

## Folder rules

- `design/` 只保存產品真值，不寫實作進度。
- `systems/` 只以現在式描述已實作契約，不放 future work 或 status checklist。
- `plans/` 是 temporary forward work，不是長期架構文件。
- `archived/` 是 read-only historical context；若與 live code 衝突，以 live code、tests 與 current design/system docs 為準。
- Function names、fields、signatures 和局部步驟留在 code comments 與 implementation spec，不放入 evergreen system docs。
