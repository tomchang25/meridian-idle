# V4 Voyage Risk and Feedback 01 — Deterministic Resolution Sketch

Parent Plan: `v4-voyage-risk-and-feedback.md`

## Goal

探索從安全 Voyage 擴充為 deterministic snapshot、ordered timeline 與 structured Voyage Result 的 ownership seam。這個 Child 要先證明前景、background、離線與 reload 都能解析同一份航程，而不加入實際風險事件。

## Summary

偏好保留 Manual Trade Core 的單一 active Voyage owner，擴充 persisted operation identity、RNG seed、出航 Fleet snapshot、resolution cursor 與 immutable inputs。Pure resolver 接收 snapshot、content 和 explicit `now`，回傳新 state 與 result beats；application transaction 負責去重、保存與 presentation handoff。

這份 Sketch 建立於 Risk implementation 尚未開始的狀態。所有 candidate files 必須等 Manual Trade Core closeout 後由 Spec 重新查閱；若 safe Voyage contract 已改變，以 live code 和 parent behavior 為準。

## Sketch

- Voyage identity 必須跨 reload 穩定，能區分未開始、進行中、部分 resolved、completed-awaiting-result 與 acknowledged。
- Snapshot candidate fields 包含 origin、planned destination、route/Region identity、departedAt、arrivesAt、seed、出航 Fleet/Cargo/Supplies condition 與 content version/identity；只保存 deterministic replay 真正需要的輸入。
- RNG 應由 seed 建立 local deterministic stream，不使用 global random。這個 Child 可以先驗證 seed round-trip 和 cursor，不產生非平安事件。
- Ordered beats 讓一次解算整段與多次小段解算維持相同順序。`lastResolvedAt` 或 equivalent cursor 需要明確處理 exact boundary、clock rollback 和 already-applied beat。
- Resolver 回傳 structured delta/result，不直接寫 store、IndexedDB、React state 或 activity UI。Application layer 在同一 transaction 套用 state、result identity 與 dirty save。
- Voyage Result shell likely 先呈現 planned/actual duration、Supplies baseline、無事件狀態與 arrival settlement，後續 Children 擴充 event、combat、loss 和 item sections。
- Result acknowledgement 必須與 gameplay completion 分離：關閉 modal 不應回滾或重新套用 outcome，reload 後未確認 result 仍可呈現。
- Migration 必須把已存在的 safe in-flight Voyage 轉為合法 deterministic snapshot，或提供明確 recovery；不能在 migration 時重新取得 random seed 導致同一 save 每次結果不同。
- Online heartbeat、visibility resume、hydration 與 offline return 都應呼叫同一 resolver；React effect 只負責 scheduling 和 cleanup。

### Candidate files to inspect

- `game/domain/models/`
- `game/domain/rules/`
- `game/domain/content/`
- `game/application/`
- `game/infrastructure/persistence/save-migrations.ts`
- `game/features/voyage/`
- `tests/`

## Non-Goals

1. Sailing Event、Pirate Danger、Combat、Cargo Loss、repair 或 Items。
2. 改變 Manual Trade Core 的 Market Session、arrival、Mastery 或 accounting rules。
3. Trade Strategy、Patrol、Expedition 或 Skills。
4. 以 UI timer tick 或 effect invocation 作為 resolution identity。
5. 永久保存完整 debug trace。

## Acceptance Criteria

1. 每次出航保存 stable Voyage identity、seed、snapshot 與 resolution position，reload 後不重建不同輸入。
2. 相同 snapshot 在一次整段解算、多次分段解算、前景、離線與中途 reload 後得到相同 safe Voyage result。
3. Completion outcome 只套用一次，未確認 Voyage Result 在 reload 後仍可查看，確認 UI 不影響已完成 state。
4. Existing safe Voyage save 能透過 migration 繼續或進入明確 recovery，不會重抽或靜默取消。
5. UI 能區分 in progress、completed awaiting acknowledgement 與 recoverable error，並提供可存取的 Result shell。
6. Child verification 覆蓋 seed/cursor round-trip、time partition parity、clock rollback、idempotency、Strict Mode 和 save/reload。
