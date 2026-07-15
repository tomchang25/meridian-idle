# V4 Voyage Risk and Feedback 05 — Items and Rewards Sketch

Parent Plan: `v4-voyage-risk-and-feedback.md`

## Goal

探索不占 Cargo Unit 的 Item inventory、Sailing Event/Combat reward 與 deterministic Item consumption。這個 Child 要讓少量特殊物品能取得、保存、顯示並在明確事件中使用，而不擴張成 equipment 或 farming system。

## Summary

偏好以 stable Item content registry 定義名稱、描述、stack/unique semantics 和有限 event use；persisted inventory 只保存 stable ID 與必要 quantity/state。Reward/consumption 由 Voyage resolved outcome 原子套用並記錄於 Result，UI 不自行發放或扣除 Item。

Spec 必須重新驗證 Voyage Result、save migration、event eligibility 和 inventory UI owner。第一批 Item catalog 應小且每件有可觀察用途或明確 special-item status，不能留下大量無作用 placeholder。

## Sketch

- Item inventory 與 Goods/Supplies Cargo 分離，不進入 Cargo used/remaining capacity selector。Item quantity semantics 由 content 明確定義，避免 unique 與 stackable 混在模糊 record。
- Reward selection 使用 Voyage RNG stream 並在 resolved beat 中固定 Item ID/quantity；reload 不重新 roll，Result acknowledgement 不再次 grant。
- Item consumption 可以是事件開始前的 automatic protection 或玩家在 Port/明確 event choice 的 manual use，但 offline-compatible事件不能依賴未回答 prompt。初版偏好 deterministic automatic use 或出航前配置。
- Consumption outcome 需要記錄 prevented/reduced effect、Item delta 和原因。若 Item 不存在或 quantity 不足，使用正式 fallback outcome，不產生部分 mutation。
- Critical Region unlock 或必要 progression 不得只依賴無保底 random drop；這個 Child 的 Items 只提供替代解法、風險緩解、額外收益或收藏。
- Save migration 為既有 Risk save 建立 empty inventory，unknown Item ID 需要保留/隔離或明確 recovery，不靜默轉成其他 Item。
- Inventory UI likely 顯示名稱、數量、用途摘要、最近取得/消耗和 non-cargo 說明；不加入 equipment slots、rarity filter 或 crafting。
- Activity/Voyage Result 需要區分 Item obtained、consumed、preserved 和 unavailable fallback，並保持 stable identity。

### Candidate files to inspect

- `game/domain/content/`
- `game/domain/models/`
- `game/domain/rules/`
- `game/application/`
- `game/infrastructure/persistence/save-migrations.ts`
- `game/features/voyage/`
- `game/features/inventory/`
- `tests/`

## Non-Goals

1. Equipment slots、stat build、durability、crafting 或 Item market。
2. 獨立 Item farming、archaeology action 或無保底必要 unlock。
3. Goods Quality、Warehouse storage 或 Cargo capacity integration。
4. Skills、Expedition-specific inventory 或 complex event choice tree。
5. 大型 initial Item catalog。

## Acceptance Criteria

1. Event/Combat Item reward 在相同 Voyage snapshot/seed 下完全一致，並且只授予一次。
2. Item inventory save/reload 正確且完全不影響 Cargo used、remaining capacity 或 Goods/Supplies command。
3. Event consumption 只在 eligibility 成立時原子扣除 Item，記錄 prevented/reduced effect；不足時使用明確 fallback。
4. Unknown/corrupt Item data 進入明確 migration/recovery，不靜默變成其他 Item 或阻止整個 app 啟動。
5. UI 和 Voyage Result 能說明 Item 名稱、數量、取得/消耗原因與用途，並清楚標示 Items 不占 Cargo。
6. Child verification 覆蓋 deterministic reward、duplicate prevention、stack/unique boundaries、consumption fallback、migration 和 rendered inventory。
