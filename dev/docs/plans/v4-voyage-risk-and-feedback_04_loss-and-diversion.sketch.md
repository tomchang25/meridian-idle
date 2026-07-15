# V4 Voyage Risk and Feedback 04 — Loss and Diversion Sketch

Parent Plan: `v4-voyage-risk-and-feedback.md`

## Goal

探索 Cargo/Supplies loss、Combat defeat、Forced Retreat、deterministic diversion 與 financial accounting 的原子整合。這個 Child 要讓風險真正影響貨物與目的地，同時保持 cost basis、Market Session 和 progression 正確。

## Summary

偏好由 resolved event/defeat outcome 描述 loss selection、quantity、actual destination 和 continuation status，再由既有 Cargo/accounting/arrival rules 在單一 application transaction 套用。Cargo loss 不是 Sell，不產生 revenue 或 Session net trade；redirect 只對實際進入的 Port 執行 arrival transition。

Spec 必須重新驗證 Cargo stack、Voyage Result、nearest Port content、arrival sequencing 和 financial summary。任何 outcome 都不能回溯撤銷先前已結算的來源 Port Mastery。

## Sketch

- Loss selection 必須 deterministic，明確指定 Goods ID + Quality、quantity 與原因。若 Cargo 不足或 content mismatch，resolver 需產生 bounded/recoverable outcome，不扣除其他任意 stack。
- Cargo loss 按當前 weighted average unit cost 移除 quantity 並記錄 cost basis loss；剩餘 stack 維持相同 average unit cost。它不更新 Gold、sale profit 或 Market Session net trade。
- Supplies loss 同樣需要 clamp 和 typed delta；loss 後不足以完成原航程時可以觸發 continuation rule、retreat 或 diversion，不允許負庫存。
- Forced Retreat/destination selection likely 使用 route graph、當前 progress 和 deterministic tie-break。Nearest Port 必須是可達 content identity，不靠 UI list order。
- Actual arrival transaction 使用實際 destination；原定但未進入的 Port 不建立報價。返回 active Session 的原 Port 時遵守 same-port no-refresh rule。
- Defeat result 需要區分 continued voyage、returned origin、diverted nearest Port 和 stranded/recoverable error；不使用永久 Fleet destruction。
- Financial feedback 分開顯示 Cargo Loss、Supplies cost、repair-relevant damage 和整體 Trade Net Profit。Activity summary 要說明何物、多少、cost basis 和實際目的地。
- Reload 或 repeated resolution 不能再次選取/扣除 loss，也不能重複 arrival/Market settlement。Persisted resolved beat/result identity 是主要去重候選。

### Candidate files to inspect

- `game/domain/content/`
- `game/domain/models/`
- `game/domain/rules/`
- `game/application/`
- `game/infrastructure/persistence/save-migrations.ts`
- `game/features/voyage/`
- `game/features/market/`
- `game/features/cargo/`
- `tests/`

## Non-Goals

1. Item reward、Item inventory 或 Item-based prevention。
2. Patrol、Expedition、Trade Strategy 或 Skill-based retreat。
3. 重新計算、倒扣或轉移已結算 Port Mastery/Guild XP。
4. Permanent equipment destruction、Fleet deletion 或 character death。
5. 複雜 insurance、debt 或 claims system。

## Acceptance Criteria

1. Cargo loss deterministic 移除指定 Goods/Quality quantity，按 weighted average unit cost 記錄 loss，保留剩餘 cost basis。
2. Cargo/Supplies loss 不產生 sale revenue、Market net trade、負庫存或 progression rollback。
3. Defeat continuation、retreat 或 diversion 使用 deterministic destination；只有實際進入的 Port 觸發 Session transition。
4. Faro/Porto 等不同成本來源合併的同品質 Cargo 部分被搶後，剩餘成本與最終 Trade Net Profit 仍正確。
5. Reload、offline resolution 或 repeated completion 不重複扣除 loss、redirect、arrival 或 progression。
6. UI 清楚顯示 defeat type、Cargo/Supplies/HP impact、cost basis loss、實際目的地與後續 repair/出航狀態。
7. Child verification 覆蓋 empty/partial/mixed Cargo、loss clamp、destination tie-break、same-port retreat、idempotency、accounting 和 parity。
