# V4 Voyage Risk and Feedback 02 — Events and Danger Sketch

Parent Plan: `v4-voyage-risk-and-feedback.md`

## Goal

探索資料化 Sailing Event、Region Pirate Danger 與 deterministic event selection。這個 Child 先交付非戰鬥風險差異，讓航程可能平安、延誤或額外消耗 Supplies，同時保持前景與離線 parity。

## Summary

偏好由 Region/content 定義 Danger 與 event table，domain resolver 使用 Voyage-local RNG stream 在 ordered beats 選擇 eligible event，再輸出 typed outcomes。Patrol 尚未存在，因此 Danger 在這階段是 content-defined persisted input，不隨貿易永久上升。

Spec 必須重新驗證 Child 01 timeline/result shape、content ownership、event frequency、rounding 和 balance bounds。Cargo loss、Items 和 Pirate Combat 的 result types 可以有擴充 seam，但不能先以無作用 placeholder 假裝已交付。

## Sketch

- Event definition candidate fields 包含 stable ID、eligible Region/route constraints、weight、timeline position/window、typed outcome 和 presentation metadata；不保存 React-specific element 或 callback。
- Danger 可以影響 event chance、table selection或 magnitude，但不直接封鎖 route。初版至少需要 low/medium/high content fixture 以量測差異。
- RNG consumption order 必須穩定；新增 UI read 或 logging 不得改變抽取序列。Spec 應考慮 content order 是否需要 stable sorting 或 explicit table order。
- 第一批 non-combat outcomes 可以是 calm、額外 Food/Water/Rope & Sails 消耗和 deterministic delay。Cargo loss 由 Child 04、Item reward 由 Child 05、Pirate Encounter 由 Child 03 取得完整 mutation authority。
- Outcome validation 必須阻止 Supplies 低於合法範圍或產生無限延誤；不足時的 degradation 依 parent contract形成可理解 result，不摧毀 save。
- Event result 需要包含 event identity、發生時間、原因、resource delta 和新預定抵達時間，供共用 Voyage Result 呈現。
- Reload 後已選定/套用的 event 不重抽；尚未到達 beat 使用同一 seed/cursor 繼續。Content ID missing 時進入明確 recovery，不以 calm event 靜默替換。
- UI likely 以 timeline/list 顯示 event title、result 和 impact，不提供多層選擇樹或 Skill check。

### Candidate files to inspect

- `game/domain/content/`
- `game/domain/models/`
- `game/domain/rules/`
- `game/application/`
- `game/infrastructure/persistence/save-migrations.ts`
- `game/features/voyage/`
- `tests/`

## Non-Goals

1. Pirate Combat、Fleet HP、Ammunition 或 repair。
2. Cargo loss accounting、Forced Retreat 或 diversion。
3. Item inventory、Item reward 或 event Item consumption。
4. Patrol、Danger growth/reduction 或玩家手動調整 Danger。
5. Skill checks、Trade Strategy 或多層 event choice tree。

## Acceptance Criteria

1. 相同 Voyage snapshot/seed 產生相同 event identity、時間、Supplies delta、delay 與 Result 順序。
2. Low/medium/high Danger content 產生可量測的風險差異，但任何 Danger 都不直接鎖死 route。
3. Event outcome 不會使 Supplies 或時間進入非法狀態，異常 content 進入明確 recovery 而非部分套用。
4. 前景、離線、分段 resolution 與 reload 後繼續得到相同事件和最終 arrival。
5. UI 能說明事件、發生時間、影響與更新後航程，不需要從資源差額猜測原因。
6. Child verification 覆蓋 RNG order、eligibility、Danger boundaries、delay/consumption bounds、missing content 和 parity。
