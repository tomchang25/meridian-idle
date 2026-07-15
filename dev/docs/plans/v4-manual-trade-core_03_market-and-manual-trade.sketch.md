# V4 Manual Trade Core 03 — Market and Manual Trade Sketch

Parent Plan: `v4-manual-trade-core.md`

## Goal

探索 Market content、persisted Market Session、手動 Buy/Sell 與 financial accounting 的共同 seam。這個 Child 要讓玩家能在目前 Port 使用不會被 UI 或 reload 重抽的報價交易，並理解持有成本和實現利潤。

## Summary

偏好將 Market Listing 與價格範圍放在 content，將本次抽出的 Current Price 與 signed net trade 放在 persisted Market Session。Domain rules 負責 price generation、weighted average cost 與 sale result；application transaction 同時協調 Gold、Cargo、Session ledger、activity result 與 dirty save。

目前 V3 沒有 Market owner，所有新檔案位置都是 candidate。Spec 必須在 Child 02 後重新確認 Cargo stack shape、RNG input、初始 Port content、price rounding 與 transaction result boundary。

## Sketch

- Market Session likely 是單一 active session，identity 必須等於 Fleet 當前停靠 Port。開啟 Market UI、切換 section、preview、Buy、Sell 與 reload 都只讀 session price。
- Session creation 接收 Port content 與 explicit RNG/seed，立即輸出可保存的 price table；presentation 不直接呼叫 random global。
- Specialty 與 General 是 Listing presentation/category data。General 只主動供應 Standard，但仍能收購玩家帶入的 Fine/Exceptional；Buy eligibility 與 Sell eligibility 不應共用錯誤的 quality assumption。
- Buy transaction 同時驗證 location、Listing supply、quality、quantity、Gold 與 capacity，之後更新 Cargo average cost、Gold、Session net trade 與 result。
- Sell transaction 驗證 location 與 held quantity，使用同一 Current Price，按 weighted average unit cost 移除 cost basis，並輸出 revenue、sold cost basis 與 realized profit。
- Remote Market view 可以使用已知 market information，但不能產生或替換 remote Port 的 active Session，也不能取得 mutation authority。
- Session net trade 以 Goods ID + Quality 分開保存 signed quantity；同組合 Buy 和 Sell 相抵，不將不同 Goods 或 Quality 合併。
- UI likely 需要 Specialty/General sections、價格構成、held quantity、average cost、trade preview、Max control、Session net trade 與 transaction result。表格在窄螢幕可能需要 card/stacked presentation，Spec 應驗證語意和閱讀順序。
- Save transition 必須保存已生成價格與 ledger。Reload 後若 content catalog 變動造成 ID 無法解析，需要明確 recovery，不能默默重抽整個 Session。

### Candidate files to inspect

- `game/domain/content/`
- `game/domain/models/`
- `game/domain/rules/`
- `game/domain/state/initial-game-state.ts`
- `game/application/`
- `game/infrastructure/persistence/save-migrations.ts`
- `game/features/market/`
- `game/features/cargo/`
- `tests/`

## Non-Goals

1. Voyage departure、arrival、offline resolution 或跨 Port Session transition。
2. Port Mastery 與 Guild XP settlement。
3. Cargo Loss、repair、Items、Sailing Event 或 Combat。
4. Warehouse、Workshop、Trade Plan 或 automatic transaction。
5. 有限 Market stock、玩家交易影響價格或 buy/sell spread。

## Acceptance Criteria

1. 玩家只能在 Fleet 當前 Port 執行 Buy/Sell，remote view、航行中或 invalid Port command 不改變 state。
2. 同一 Market Session 的 Current Price 在 UI reopen、preview、Buy、Sell 與 reload 後保持不變。
3. Buy/Sell 原子更新 Gold、Cargo、cost basis、Session net trade 與 transaction result；任何 validation failure 不產生部分 mutation。
4. 多次不同成本買入後部分出售時，average cost、sold cost basis、realized profit 與剩餘 cost basis 正確。
5. UI 清楚呈現 Specialty/General、Quality、price breakdown、持有量、平均成本、preview、ledger 與拒絕原因，並可用鍵盤和 mobile layout 操作。
6. Child verification 覆蓋 deterministic/persisted price、quality rules、accounting boundaries、remote read-only、save round-trip 與 rendered states。
