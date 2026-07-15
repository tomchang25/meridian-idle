# V4 Voyage Risk and Feedback 06 — Feedback and Hardening Sketch

Parent Plan: `v4-voyage-risk-and-feedback.md`

## Goal

探索 Voyage Risk 完成前的 Result integration、online/offline parity、balance boundaries、recovery、responsive/accessibility 與 regression seam。這個 Child 不新增新的風險機制，而是確保玩家能理解且信任所有已交付 outcome。

## Summary

偏好以 canonical Voyage Result schema 驅動 modal/panel 和 bounded activity summary，再以 outcome matrix 驗證 calm、delay、victory、defeat、loss、repair need、redirect、Item reward、in-progress 和 recovery。UI 不從 final state 猜測歷史原因，也不維護第二份 outcome state。

Spec 必須重新掃描完成後的 domain resolver、application transaction、persistence、feature components 和 tests。若早期 Child 缺少必要 result field，應修正 owning contract，而不是在 presentation 以 heuristic 補值。

## Sketch

- Result schema 應保留足以解釋 timeline、duration、Supplies、events、Combat、HP、Cargo/Item deltas、financial loss、actual destination、Market settlement 和 progression 的 typed sections。
- Full Result 至少保留到 acknowledge 或下一個互斥 flow；activity history 保存短摘要和 stable reference，不永久保存所有 Combat rounds。
- UI outcome matrix 需要不同 heading/status text/action for normal arrival、delayed arrival、victory continue、defeat retreat、forced diversion、still sailing 和 recoverable error；不能只改顏色。
- Result acknowledgement、modal close、route navigation、reload 和 Strict Mode remount 都不能重複套用 gameplay outcome。Focus return 和 background scroll behavior 是 Spec-time UI audit candidates。
- Online/offline parity 應比較 state 與 structured Result，不只比較最終 Gold。一次整段、多段 heartbeat、background resume 和 mid-event save/reload 都要保持 event order。
- Balance audit 聚焦 safety bounds：Danger 差異可量測、Event 不造成無限延誤、Combat 必然終止、repair 可恢復、loss 不把 state 變非法、短航線不成為唯一 Item exploit。最終 economy tuning 不屬本 Child。
- Recovery matrix 需要涵蓋 missing content、invalid seed/cursor、corrupt in-flight Voyage、unknown enemy/Item、impossible redirect、storage failure 和 stale async save。
- Accessibility audit 包含 semantic dialog/landmarks、timeline reading order、labels、keyboard、focus、screen-reader status、mobile touch targets、contrast 和 reduced motion。
- Verification 應保留 domain determinism、application idempotency、migration round-trip、component interaction 和 end-to-end user journey 的分層責任。

### Candidate files to inspect

- `app/`
- `game/domain/`
- `game/application/`
- `game/infrastructure/persistence/`
- `game/features/voyage/`
- `game/features/fleet/`
- `game/features/inventory/`
- `game/shared/`
- `tests/`

## Non-Goals

1. 新增 Patrol、Expedition、Trade Plan、Trade Strategy、Skills 或 Guild automation。
2. 新增新的 Event family、Combat stat、Item system 或 financial mechanic。
3. 完整戰術海戰或最終 economy/world balance。
4. 以 presentation heuristic 重建缺失的 domain outcome。
5. 永久保存完整 event/combat debug log。

## Acceptance Criteria

1. 玩家能從同一 Voyage Result 理解時間、事件、Combat、Supplies、HP、Cargo/Item、financial loss、實際目的地與 settlement，不需比較前後 state 猜測。
2. 所有 completion/in-progress/recovery mode 都有明確文字、可行動下一步、keyboard/focus behavior 和 mobile presentation。
3. 前景、離線、time partition、background resume 與 mid-voyage reload 產生相同 final state 和 structured Result。
4. Result acknowledge、modal close、remount、reload 或 repeated resolver 不重複 mutation、reward、loss、redirect 或 arrival。
5. Danger、Event delay、Combat termination、Cargo loss、repair、Item reward 和 redirect 都維持 legal bounded state 與可恢復 gameplay。
6. Migration/recovery、domain determinism、application idempotency、component accessibility、完整 risk journey、repository verify 與 production build 全部通過。
