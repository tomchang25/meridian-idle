# Meridian Idle V5 — Pirate Danger and Patrol

> 狀態：Frozen extension design  
> 依賴：[V5 Core](meridian-idle_v5.md)

## 定位

Pirate Danger and Patrol 是未來將 V5 Core 的 static route risk 擴充為可變 Region pressure 與玩家主動治理循環的系統。V5 Core 已包含 Pirate Encounter、Combat、Cargo Loss、Repair 與 Items，但不保存 dynamic Danger，也不提供 Patrol。

## 候選 Pirate Danger

每個 Region 未來可保存獨立 Pirate Danger，影響：

- Pirate Event probability。
- Enemy HP／Attack range。
- Cargo／Supplies loss 與 diversion risk。
- Patrol 的預期效果。

Danger 不應直接鎖死 Port 或 Route。它改變風險與期望損失，不把玩家永久困在無法恢復的狀態。

### Growth principle

頻繁航行、高價 Cargo 或特定 Event 可以增加 Danger，但必須：

- 緩慢成長。
- 有明確上限。
- 在 Patrol 上線前不啟用永久成長。
- 不因 reload、重播 persisted Voyage Result 或零時間循環重複增加。

## 候選 Patrol

Patrol 是使用主角 Fleet 的手動 Region action：

- 暫停其他 Voyage／Expedition。
- 消耗時間、Food、Water、Ammunition 與 Repair resources。
- 使用 Core Combat resolver。
- 成功後降低該 Region Danger。
- 失敗時結束並回到 deterministic Port。
- 不增加 Port XP。

## Integration constraints

- Core Route static risk 必須在啟用 Danger 後有明確 replacement 或 composition rule。
- Patrol、Trade Voyage 與 Expedition 共用 Fleet HP、Attack、Supplies、Items 與 Combat。
- Danger growth、Patrol reduction 與 Result 必須 deterministic、persisted 且 online/offline parity。
- 玩家必須能在出航前看到 risk 與 Patrol 的預期影響。
- 新 Danger state 需要獨立 save migration；Core 不預留空 Region danger record。

## Frozen decisions

- Danger range、growth、decay 與 cap。
- Static route risk 與 dynamic Region Danger 的公式。
- Patrol duration、enemy selection、reduction 與 reward。
- Trade value、Specialty Cargo 與 Danger growth 的關係。
- Patrol 是否提供未來 Gunnery／Navigation Skill XP。

## 非目標

- 不修改 Core simple Combat round rule。
- 不建立獨立 Patrol Fleet。
- 不在只有 Danger growth、沒有 Patrol recovery 時啟用此系統。
