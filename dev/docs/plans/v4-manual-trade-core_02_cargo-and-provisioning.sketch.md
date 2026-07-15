# V4 Manual Trade Core 02 — Cargo and Provisioning Sketch

Parent Plan: `v4-manual-trade-core.md`

## Goal

探索 Fleet、Goods Cargo、五類 Supplies 與共用 Cargo Unit 的 canonical ownership。這個 Child 要讓玩家在 Port 內完成可保存、可驗證的貨艙與補給配置，為 Market transaction 和 Voyage eligibility 建立穩定基礎。

## Summary

偏好由 persisted Fleet inventory 保存 Goods/Quality quantity、cost basis 與 Supplies quantity，capacity、used units、remaining units、affordability 與 command eligibility 則保持 derived。所有變更由 application command 驗證並原子套用，UI 只保存數量輸入等 session state。

目前 codebase 尚未有 V4 Cargo owner；候選檔案與 feature boundary 必須在 Child 01 落地後重新確認。Spec 應特別驗證數量單位、decimal policy、初始資金與 provisioning price 的 content ownership。

## Sketch

- Candidate domain shape 會區分 Goods stack 與 Supply stack，但兩者共用單一 capacity selector；不建立第二個免費 Supplies capacity。
- Goods identity 由 Goods ID 與 Quality 組成，同組合只保存一筆 quantity 與 weighted average unit cost。這個 Child 可以建立形狀，但真正 market buy cost merge 由 Child 03 驗證。
- Supplies 使用五個 stable IDs。Food、Water、Medicine、Gunpowder & Ammunition、Rope & Sails 在本階段都能裝載和卸除；只有後續 Voyage command 才消耗 Food/Water。
- Provisioning likely 是目前 Port 提供的 Gold-for-Supply transaction。Price 應來自 content，不散落於 component；Supplies 不寫入 Market Session net trade。
- Application command 應以 requested quantity、current Fleet、Gold、Port location 與 content 作 explicit input，回傳成功 result 或單一明確拒絕原因，不部分扣款或部分裝載。
- Quantity input、Max、increment/decrement 與 confirmation 是 UI interaction；canonical quantity 仍只存在於 game state。Spec 應驗證 mobile input、keyboard submit、focus restoration 與 disabled reason。
- Capacity 與 Gold preview 必須和 command 使用同一 domain calculation，避免 UI 顯示可行但 application 拒絕，或 UI 限制比正式規則更嚴。
- Save migration 需要為新 Cargo/Fleet sections 提供合法 default，並保留 Child 01 已建立的 degraded/recovery result，不應讓 missing optional section 變成第二套 runtime shape。

### Candidate files to inspect

- `game/domain/models/game.ts`
- `game/domain/state/initial-game-state.ts`
- `game/domain/content/`
- `game/domain/rules/`
- `game/application/use-game-store.ts`
- `game/infrastructure/persistence/save-migrations.ts`
- `game/features/`
- `tests/save-migrations.test.ts`
- `tests/`

## Non-Goals

1. Market Listing、Market price、Buy/Sell 或 Market Session net trade。
2. Voyage timing、Food/Water consumption 或 offline arrival。
3. Port Mastery、Guild XP、Skills 或 Guild facilities。
4. Items、equipment、Fleet HP、Combat 或 repair。
5. Warehouse、Store、Withdraw 或 Workshop inventory。

## Acceptance Criteria

1. 玩家可以在目前停靠的 Port 購買並管理五類 Supplies，且每次變更同步更新 Gold、Cargo used 與 remaining capacity。
2. Goods 與 Supplies 永遠共用同一 Cargo Capacity；負數、零、非合法數量、超出 Gold 或超出容量的 command 不產生部分 mutation。
3. Cargo 與 Supplies 在 save/reload 後保持一致，missing、invalid 或舊 save section 使用明確 migration/recovery behavior。
4. UI 顯示各 stack、總容量、剩餘容量、成本 preview 與拒絕原因，主要操作可用鍵盤和 mobile touch 完成。
5. Child verification 覆蓋 capacity boundaries、Gold boundaries、quantity validation、atomic command、persistence round-trip 與 rendered states。
