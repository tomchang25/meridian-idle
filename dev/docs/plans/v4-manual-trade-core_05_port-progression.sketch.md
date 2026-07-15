# V4 Manual Trade Core 05 — Port Progression Sketch

Parent Plan: `v4-manual-trade-core.md`

## Goal

探索 Market Session settlement、Port Mastery 與 persisted Regional Guild XP 的原子 progression seam。這個 Child 要把跨港交易結果轉成可理解的地區成長，同時阻止同港倒貨或淨零交易刷進度。

## Summary

偏好由 pure settlement rule 讀取上一個 Market Session ledger 與該 Session 的 persisted prices，按 Goods/Quality 計算 mastery basis、曲線後 XP 與 Guild XP result；arrival application transaction 負責一次套用 progression、清除舊 Session 並建立新 Session。

Spec 必須在 Market 和 Voyage Children 落地後重新驗證 Session owner、arrival result shape、曲線 content、rounding 與 UI feedback。Skills 已整體延後，不能留下無作用 modifier seam 或 placeholder state。

## Sketch

- Settlement eligibility 取決於實際 entered Port 與 active Session Port 不同，不取決於是否曾呼叫 departure 或經過多久。
- 每個 Goods ID + Quality 的 net quantity 獨立計算；signed direction 不影響 absolute mastery basis，同組合淨零不貢獻，不同組合不互相抵銷。
- Mastery basis 使用該 Session 已保存的 Current Price，不重新查 content 或產生新 multiplier。Curve 與 Guild XP conversion 應由 content data 控制並保持單調。
- Port Mastery 是每 Port 單一可見數值，不拆 Export/Import。Guild XP 是 persisted Region value，只由實際 Mastery gain 轉換，不從總 Mastery derived 回推。
- Settlement result likely 包含各 net trade contribution、mastery basis、Port Mastery gain、Guild XP gain 與 zero-gain reason，供 activity 和 progression UI 使用。
- Arrival mutation 必須 idempotent；Session identity 或 Voyage completion identity 可作為去重依據，不能以目前 Port 比較作唯一重複保護。
- Child 需要驗證 partial Buy/Sell、multiple qualities、同港 round-trip、empty ledger、unknown Goods ID、price missing 與 near-boundary curve rounding。
- UI likely 在 arrival summary 和 progression panel 同時顯示本次 gain、累積值、所屬 Region 與來源。Charter 功能保持 locked/absent，不把累積 Guild XP 誤呈現成已成立 Guild。

### Candidate files to inspect

- `game/domain/content/`
- `game/domain/models/`
- `game/domain/rules/`
- `game/application/`
- `game/infrastructure/persistence/save-migrations.ts`
- `game/features/`
- `tests/`

## Non-Goals

1. Skill modifier、Skill XP 或 Commerce progression。
2. Guild Charter、Guild Level、Warehouse、Workshop 或 automation unlock。
3. Cargo Loss 對 financial result 的影響或任何 progression rollback。
4. Patrol、Expedition、Store、Withdraw 或 Workshop mastery source。
5. 最終 balance tuning；本 Child 只需要資料化且單調的 initial curve。

## Acceptance Criteria

1. 只有實際進入不同 Port 才結算上一個 Market Session；empty、same-port 或 net-zero ledger 不增加 Port Mastery。
2. 不同 Goods/Quality 分開計算 contribution，partial net trade 使用該 Session persisted price 得到可重現結果。
3. Port Mastery gain 只更新對應 Port，Guild XP gain 只更新該 Port 所屬 Region，且 reload 後保持一致。
4. Arrival 重試或 reload 不會重複授予 Mastery/Guild XP，也不會使用新 Port 價格回算舊 Session。
5. UI 能說明本次 gain、累積值、來源 Port/Region 與 zero-gain reason，不暗示 Charter 或 Skill 已解鎖。
6. Child verification 覆蓋同港防刷、多 Goods/Quality、rounding、idempotency、save round-trip 與 rendered feedback。
