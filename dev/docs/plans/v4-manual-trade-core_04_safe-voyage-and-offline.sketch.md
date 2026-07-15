# V4 Manual Trade Core 04 — Safe Voyage and Offline Arrival Sketch

Parent Plan: `v4-manual-trade-core.md`

## Goal

探索安全 Port-to-Port Voyage、Food/Water consumption、elapsed-time resolution 與 Market Session arrival transaction。這個 Child 要讓前景等待、background resume 和離線回歸共享同一航程完成語意。

## Summary

偏好把 active Voyage 保存為不可變 operation snapshot，application 提供 `now`，pure resolver 根據 persisted timestamps 判斷進度和抵達。Online heartbeat、visibility resume 與 hydration 都呼叫同一 resolver；UI timer 只是 derived presentation，不是 gameplay clock。

現行 V3 offline resolver 以 repeating Action cycle 為中心，Child 01 後 likely 已被移除或隔離。Spec 必須重新確認 current store/hydration owner、route content、time rounding、offline cap 和 atomic arrival sequencing。

## Sketch

- Route content likely 保存 origin、destination、distance 或 duration input；Fleet Speed 與 route distance 產生預定 travel time，component 不自行計算正式 arrival。
- Departure command 驗證 Fleet 正在 origin Port、destination 可達、沒有互斥 operation、Food/Water 足夠且 active Market Session 合法。
- Active Voyage snapshot 至少保存 origin、destination、departedAt、arrivesAt 與預定 Food/Water cost。Risk seed、event timeline 與 Fleet combat snapshot 留到下一份 Main Plan。
- Supplies 可以在 departure 時 reservation、在 arrival 時 deduction，或以其他 atomic shape 表示；Spec 應選擇能避免 reload 重複扣除且能清楚呈現的單一契約。
- Resolver 接收 state、content 與 explicit `now`，處理 negative clock movement、exact boundary、large elapsed time 和 already-resolved voyage，回傳 structured result。
- Arrival transaction 的 candidate order 是完成 Voyage、更新實際 Port、扣除 Supplies、結算上一個 Market Session、建立目的 Port Session、輸出 activity/result；Spec 必須用 live accounting/progression boundaries 驗證順序。
- 回到 origin 而未曾停靠不同 Port 時保留原 Session；真正進入不同 Port 才結算和刷新。Route traversal 本身不能觸發 Session change。
- React effect 只協調 timer/resume，必須可在 Strict Mode setup/cleanup 重跑；gameplay mutation 需要 idempotent operation identity，不能依 effect invocation count。
- UI likely 顯示目的 Port、remaining time、Food/Water cost、departure rejection、in-transit locked actions、arrival summary 與 save status。

### Candidate files to inspect

- `game/domain/content/`
- `game/domain/models/`
- `game/domain/rules/`
- `game/application/use-game-store.ts`
- `game/infrastructure/persistence/save-migrations.ts`
- `game/features/`
- `tests/offline-resolver.test.ts`
- `tests/save-migrations.test.ts`
- `tests/`

## Non-Goals

1. Sailing Event、RNG seed、Pirate Danger、Combat、HP、Cargo Loss 或 Items。
2. Port Mastery/Guild XP formula beyond invoking the Child 05 settlement boundary when available。
3. Trade Strategy、Trade Plan、Patrol 或 Expedition。
4. Supplies shortage consequences after departure；不足只會阻止出航。
5. 即時操船、route pathfinding 或多段 player-controlled waypoint。

## Acceptance Criteria

1. 玩家只能從目前停靠 Port 前往可達目的地，Food/Water 不足或 Fleet 已在航行時不能出航。
2. 航行期間 Port transaction 不可用，UI 顯示目的地、預定抵達時間、remaining time 與 locked reason。
3. 相同 Voyage 在前景一次解算、多次 heartbeat、background resume、離線回歸與中途 reload 後產生相同抵達結果。
4. 抵達只套用一次，不重複扣除 Supplies、建立 Session、記錄 activity 或結算 progression。
5. 返回相同 Port 不刷新 Market Session；進入不同 Port 才結算上一個 Session並建立新報價。
6. Child verification 覆蓋 exact-time boundary、clock rollback、long elapsed time、save/reload、Strict Mode effect cleanup 與 online/offline parity。
