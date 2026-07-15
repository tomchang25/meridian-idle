# V4 Manual Trade Core 06 — Core Hardening Sketch

Parent Plan: `v4-manual-trade-core.md`

## Goal

探索 Manual Trade Core 完成前的跨系統 hardening、recovery、responsive/accessibility 與 regression seam。這個 Child 不新增基礎玩法，而是證明前五個 Children 已形成可重複遊玩且可維護的完整循環。

## Summary

偏好以 user journey、state transition matrix 和 failure-mode audit 驗證已交付功能，而不是建立第二個 integration owner。任何在本階段才發現缺失的基礎 UI、command 或 persistence contract 應回到 owning feature 修正；shared presentation 只在語意已被至少兩個 feature 穩定使用時抽出。

Spec 必須重新掃描 live component tree、application commands、save/recovery、tests 與 responsive styles，確認真正 blast radius。這份初版 Sketch 不預先指定最終檔案清單。

## Sketch

- Primary journey 應覆蓋 new game、Lisbon provisioning、market buy、safe voyage、arrival settlement、remote view、sell、return voyage、progression feedback、save/reload 與 offline completion。
- Failure matrix 應覆蓋 hydration loading、no save、migrated save、corrupt save、storage unavailable、save failure、invalid content ID、empty cargo、insufficient Gold/capacity/Supplies、航行中 transaction 與 repeated completion。
- Cross-feature selectors 應維持 single source of truth；Cargo capacity、price preview、voyage eligibility 與 progression preview 不能在不同 components 複製公式。
- Activity history 需要 bounded、stable identity 與可理解 tone/text，但不能成為另一份 gameplay state owner。交易、departure、arrival、settlement 和 recovery 應有足夠摘要。
- Desktop 和 mobile 應保持相同功能與資訊，不以隱藏重要欄位換取窄版。Table-to-card adaptation、sticky actions、modal focus 和 overflow 都是 Spec-time audit candidates。
- 所有互動使用 semantic controls，具有 label、visible focus、keyboard order、disabled reason 與非顏色狀態；timer/animation 遵守 reduced motion。
- React effects 應在 Strict Mode 下安全 cleanup；autosave、heartbeat、hydration 與 arrival resolution 不得因 remount 或 stale async completion 重複 mutation。
- Verification 應以 domain/application/component layers 和完整 journey 分工，不用 snapshot 取代 accounting、locked state 或 interaction assertions。
- 這個 Child 可以調整 content balance 到「循環可實際驗證」的程度，但不承擔最終 economy balance 或完整 world catalog。

### Candidate files to inspect

- `app/`
- `game/domain/`
- `game/application/`
- `game/infrastructure/persistence/`
- `game/features/`
- `game/shared/`
- `tests/`

## Non-Goals

1. 新增 Sailing Event、Combat、Items、Guild facilities、Trade Plan、Patrol、Expedition 或 Skills。
2. 建立與 owning features 平行的 integration store 或 duplicate selectors。
3. 完整 V4 world content rollout 或最終 economy balance。
4. PWA asset pipeline、save export/import 或 multi-tab ownership。
5. 為假設性的未來重用建立 framework。

## Acceptance Criteria

1. 玩家可以從 new game 或 supported migrated save 完成完整手動跨港貿易循環，reload/offline 不改變結果或重複結算。
2. 所有主要 failure/recovery states 都有可行動且不覆寫進度的 presentation，storage unavailable 時遊戲仍可執行。
3. Desktop 與 mobile 提供相同核心資訊和操作；keyboard、focus、labels、disabled reasons、contrast 和 reduced motion 符合專案契約。
4. Accounting、capacity、Market Session、Voyage 與 progression 在跨 feature UI 使用相同 canonical rules，沒有 presentation-only mutation。
5. Strict Mode、stale async、timer cleanup、save scheduling 與 repeated resolution 不造成 duplicate mutation。
6. Focused regression、完整 user journey、migration/persistence、accessibility、repository verify 與 production build 全部通過。
