# V4 Manual Trade Core 01 — Bootstrap and Migration Sketch

Parent Plan: `v4-manual-trade-core.md`

## Goal

探索從目前 V3 Action-based runtime 切換到合法 V4 world bootstrap 與 versioned save transition 的 ownership seam。這個 Child 必須先建立可信任的 V4 初始狀態、hydration 與 recovery boundary，讓後續 Cargo、Market、Voyage 與 progression Children 不需要同時相容兩套 runtime。

## Summary

目前偏好以一次 runtime boundary replacement 建立 V4 canonical state，而不是在既有 V3 `GameState` 上持續增加 optional sections。Domain content、initial state、application hydration、save migration 與 root dashboard 會形成主要 blast radius；後續 Spec 必須重新確認 V3 save 的 compatibility promise、可保留的共通價值、無法映射資料的 user-visible recovery，以及是否需要暫時保留 minimal legacy types 或 lookup 供 migration 使用。

這個 Child 只交付 V4 bootstrap、world identity、Fleet location、基本 resources、save envelope transition 與可辨識的 shell UI。Cargo transaction、Market、航行和 progression behavior 仍由後續 Children 擁有。

## Sketch

- 現行 `GameState` 直接保存 Captain、Knowledge、Skills、Action Mastery、selected Action filters 與 running Action；V4 bootstrap 需要改成由 world、Fleet、resources、location、Market Session/progression placeholders 的合法初始邊界主導，但不能先建立 deferred Skill placeholder。
- 現行 initial state 在 function default parameter 直接取得 wall-clock time。後續 Spec 應確認把 `now` 保持為 application-provided input，避免 pure domain bootstrap 隱式讀取時間。
- 現行 application store 同時負責 hydration、elapsed Action resolution、save debounce 與 UI commands。這使 V3 offline resolver 和 V4 hydration 緊密相連；候選方向是先讓 bootstrap/hydration 只產生合法 V4 state 與 load result，再由後續 Voyage Child 接上新的 elapsed-time resolution。
- 現行 save envelope 只有 version 1，migration 對非 current version 直接拒絕，並用 fallback state 混入 V3 sections。V4 transition 必須是追加的 sequential migration，不可覆寫 v1 reader 或只接受最新版本。
- V3 persisted fields 無法一對一映射到 V4。Gold 是明顯的候選保留值；Captain、Knowledge、Action mastery、Skill 與 running Action 的處置會影響 compatibility promise，Spec 前必須以 parent requirement 鎖定為「明確 degraded/recovered result」，不可靜默轉成不相干的 V4 progression。
- 如果 V3 migration 需要已移除的 type 或 content lookup，候選做法是保留最小 legacy snapshot/shape 只供 migration，而不是保留 V3 runtime feature。Spec 應以實際 v1 payload fixtures 驗證所需最小表面。
- IndexedDB repository 已是 browser storage 的單一 adapter，database、object store 與 primary save key 可維持穩定；這個 Child 不需要把 persistence 決策移入 domain 或 component。
- Hydration failure 現在只顯示 storage unavailable，無法區分「沒有 save」、「invalid/corrupt save」、「migrated with dropped data」與真正 browser storage failure。V4 shell 需要可呈現的 load/recovery result，並避免 hydration 完成前 debounce initial state。
- 現行 dashboard、Action content、Action selectors、check resolver 與 offline Action resolver 都以 V3 model 為中心。候選 landing boundary 是在同一 Child 移除它們的 runtime reachability與對應 UI，而不是留下不可達但仍被 V4 types import 的半套路徑。
- Child 完成時的 UI 可以只呈現 V4 identity、Lisbon 停靠狀態、基本 Fleet/resources 與 save/recovery status；後續 feature controls 應顯示明確的尚未交付狀態，而不是 fake market 或 disabled V3 Action cards。
- Spec 必須確認 root rendered states 的 keyboard/focus behavior、storage unavailable fallback、corrupt save recovery action，以及 V3-to-V4 transition notification 的保留時間。

### Candidate files to inspect

- `game/domain/models/game.ts`
- `game/domain/state/initial-game-state.ts`
- `game/domain/content/actions.ts`
- `game/domain/content/regions.ts`
- `game/domain/rules/action-selectors.ts`
- `game/domain/rules/check-resolver.ts`
- `game/domain/rules/offline-resolver.ts`
- `game/application/use-game-store.ts`
- `game/infrastructure/persistence/save-migrations.ts`
- `game/infrastructure/persistence/indexed-db-save-repository.ts`
- `game/features/dashboard/meridian-dashboard.tsx`
- `game/features/dashboard/meridian-dashboard.module.css`
- `tests/save-migrations.test.ts`
- `tests/offline-resolver.test.ts`
- `tests/action-card.test.tsx`

## Non-Goals

1. Cargo quantity/capacity command、Supplies provisioning 或 Goods transaction。
2. Market Listing、Market price generation、Market Session lifecycle 或 financial accounting。
3. Voyage timing、offline arrival、Sailing Event、Combat 或 deterministic RNG。
4. Port Mastery、Guild XP、Skills 或其他 progression resolution。
5. 重命名 IndexedDB database、object store 或 primary save key，除非 Spec-time evidence 證明 current contract 無法安全延續。
6. 以 optional V3/V4 union 長期維持兩套 playable runtime。

## Acceptance Criteria

1. 新遊戲會進入 V4 初始 world，Fleet 合法停靠 Lisbon，畫面不再提供 V3 Captain、Knowledge 或 Action runtime。
2. 已發布的合法 v1 save 會透過 versioned transition 進入可用 V4 state，能保留的玩家價值被保留，無法映射的資料有明確 recovery/degradation 說明。
3. Invalid 或 corrupt save 不會使 application 無法啟動，也不會被無提示覆寫；玩家能辨識並採取安全 recovery。
4. Hydration 完成前不會把 V4 initial state 寫回 IndexedDB，storage unavailable 時仍可開始非持久化的新遊戲並看到明確狀態。
5. Reload 後 V4 world identity、Fleet location、resources 與 recovery acknowledgement 保持符合 save contract。
6. Child 的 migration、round-trip、invalid payload、hydration 與 shell rendered-state verification 通過，且不需要保留可玩的 V3 runtime。
