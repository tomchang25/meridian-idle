# V4 Voyage Risk and Feedback 03 — Combat and Repair Sketch

Parent Plan: `v4-voyage-risk-and-feedback.md`

## Goal

探索共用 HP/Attack Combat resolver、Pirate Encounter、Fleet persisted condition、Ammunition consumption 與 Port repair。這個 Child 要形成可受損、可恢復、可再次出航的最小海戰循環。

## Summary

偏好讓 Sailing Event 只產生 typed Pirate Encounter input，pure Combat resolver 接收已計算完成的 player/enemy combatants，輸出 rounds、victory/defeat、HP 與 Ammunition delta。Fleet condition 和 repair 由既有 application/persistence boundary 擁有，Combat 不直接理解船型、Skills、equipment 或 UI。

Spec 必須在 Event Child 後重新驗證 encounter/result integration、Fleet state、Ammunition unit、enemy content、repair pricing 和出航 eligibility。Defeat 的 Cargo loss、redirect 與 final settlement留給 Child 04。

## Sketch

- Combatant minimum shape 只有 current/max HP 與 Attack；Attack 進入 resolver 前 clamp 至至少 1，避免雙方無法終止。
- Fixed round order 是 player 先攻擊，enemy 存活才反擊。若 player HP 歸零即輸出 defeat，不建立命中、Defense、initiative 或 action choice。
- Enemy selection likely 由 Pirate Danger、route 和 Voyage RNG 決定，selected enemy identity 成為 persisted/resolved beat，Combat replay 不重新選敵。
- Ammunition consumption 必須有明確 per-round 或 per-encounter content rule。Ammunition 不足時的 combat behavior 需要由 parent-compatible固定規則決定，不能臨時用 UI prompt 分叉 offline resolver。
- Fleet HP 是 persisted game state，Combat result 在同一 Voyage transaction 套用；round records 可留在 unacknowledged result，但 activity history 只保留摘要。
- Port repair 是 explicit Gold transaction，驗證 Fleet 停靠、HP missing、Gold 和 repair rate，回傳 repaired HP、cost 和拒絕原因。Repair cost 進入 financial feedback，不是 Market trade。
- Medicine 或 Rope & Sails 若用於 repair/event，應透過 typed result 而非 component-side deduction；初版用途需保持簡單且 deterministic。
- UI likely 顯示 Fleet condition、enemy summary、round summary、Ammunition、repair preview 和 completion result，且不需要即時點擊才能在 offline resolution 成功。

### Candidate files to inspect

- `game/domain/content/`
- `game/domain/models/`
- `game/domain/rules/`
- `game/application/`
- `game/infrastructure/persistence/save-migrations.ts`
- `game/features/voyage/`
- `game/features/fleet/`
- `tests/`

## Non-Goals

1. Cargo/Supplies loss、Forced Retreat、nearest Port redirect 或 defeat accounting。
2. Skills、equipment build、accuracy、Defense、evasion、crew 或 tactical input。
3. Patrol、Expedition 或 Trade Strategy-specific Combat。
4. Permanent Fleet destruction、character death 或 save deletion。
5. 完整 Combat log 的永久保存。

## Acceptance Criteria

1. 相同 combatants、encounter input 和 seed 產生相同 rounds、HP、Ammunition 與 victory/defeat result。
2. Combat 在任一方 HP 歸零時終止，Attack 下限與 round limit/recovery 防止 invalid content 造成無限 resolver。
3. Fleet HP 與 Ammunition 在 Voyage completion、save/reload 和 offline resolution 後只套用一次。
4. 玩家在 Port 能預覽並執行 repair，Gold 不足、HP 已滿或航行中不產生部分 mutation。
5. UI 能理解 Fleet condition、enemy、Combat 摘要、resource impact、repair cost 和再次出航狀態，無需即時 interaction 才能完成戰鬥。
6. Child verification 覆蓋 victory/defeat/exact-kill、invalid Attack、Ammunition boundaries、repair boundaries、persistence 和 parity。
