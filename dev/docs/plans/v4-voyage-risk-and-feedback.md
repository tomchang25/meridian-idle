# V4 Voyage Risk and Feedback

## Goal

在 V4 Manual Trade Core 的安全航程上加入可重現、可解釋的航行風險。玩家會遭遇 Sailing Event 與海盜、承受 Supplies、Fleet HP、Cargo 與財務影響、取得 Items，並在前景或離線回歸後看到相同且完整的 Voyage Result。

## Requirements

1. 本 Plan 依賴 V4 Manual Trade Core 已交付的 Fleet、Cargo、Market Session、financial accounting、safe voyage、offline arrival 與 persistence 契約；不得另造第二套 risk-only state owner。
2. 每次出航建立不可變 Voyage snapshot，至少保存起點、原定終點、出發時間、預定抵達時間、RNG seed、出航時 Fleet snapshot 與 route 所屬 Region。
3. 前景與離線航行使用同一個 deterministic resolver 與事件時間線。同一 Voyage snapshot 在相同 content 下重算必須產生相同事件、Combat、消耗、損失、redirect 與 reward。
4. 所有 random outcome 由 domain resolution 產生並成為 persisted result；開啟 UI、reload 或 hydration 不得重抽。
5. 每個 Region 的 Pirate Danger 影響 Sailing Event 發生率或海盜強度。Patrol 尚未交付前，Danger 使用內容定義且可保存的值，不建立只能增加卻無法由玩家降低的循環。
6. 第一批 Sailing Event 至少涵蓋平安航行、額外 Supplies 消耗、航程延誤、Cargo 影響、Item reward 與 Pirate Encounter；事件使用資料化定義，不建立多層分支事件鏈。
7. Trade Pirate Encounter 使用共用 Combat resolver。最小 Combatant 只有 HP 與 Attack；每回合玩家先攻擊，敵人存活時才反擊，Attack 永遠至少為 1。
8. Fleet 保存可持續到下一航程的 HP。Gunpowder & Ammunition 可以由 Combat 消耗，Port 提供清楚定價的 repair，使受損 Fleet 能恢復後再次出航。
9. Combat defeat 不刪除 save、不永久摧毀 Fleet 或 Items，也不造成角色死亡。結果可以包含 Supplies loss、Cargo loss、額外 HP 損傷、繼續航程、Forced Retreat 或改停靠 deterministic nearest Port。
10. Cargo loss 依被移除 Goods/Quality 的 Weighted Average Unit Cost 記錄 financial loss；剩餘貨物數量與平均成本保持正確，且不回溯取消已結算的來源 Port Mastery。
11. 因 defeat 或 event 改停靠不同 Port 時，arrival 必須使用實際停靠順序處理 Market Session settlement、目的 Port 報價與 progression；未實際進入的原定目的地不得建立 Session。
12. Items 不占 Cargo Unit，主要由 Sailing Event 或 Combat reward 取得。第一版 Item 可以保存、顯示並由明確事件自動或手動消耗，但不建立 equipment build 或獨立 farming loop。
13. 每次完成或中斷 Voyage 都建立結構化 Voyage Result，包含航行時間、事件、Supplies、Combat 摘要、HP、Cargo/Item 得失、Cargo Loss、repair-relevant condition、實際抵達 Port 與 Market/Progression settlement。
14. Offline 回歸顯示與前景完成相同的 Voyage Result 格式。Activity log 保存可理解摘要；完整 Combat round log 不需要永久保存。
15. UI 必須區分仍在航行、正常抵達、延誤、戰勝後繼續、戰敗撤退及強制改道，讓玩家不需從資源差額猜測發生原因。
16. 每個交付切片都同時完成相應 persistence、result feedback、accessibility、error recovery 與 online/offline parity tests。

## Design

### Dependency and Release Boundary

本 Plan 不重新定義 Manual Trade Core 的交易或 arrival 語意，而是在同一 Voyage lifecycle 中加入事件時間線和結果。完成後，安全貿易循環仍可使用，但每段航程開始承擔由 Region、route、Cargo 與 content 決定的風險。

Manual Trade Core 必須先完成 closeout，或至少已有經驗證且不再改變的 Voyage、Cargo、Market Session 與 accounting contract，才開始本 Plan 的第一個 Implementation Spec。若依賴契約仍在變動，本 Plan 保持 queued，不以 provisional wiring 提前實作。

### Deterministic Voyage Contract

Voyage snapshot 是航行 resolution 的輸入，resolved timeline/result 是其不可重抽的輸出。Resolver 以明確的時間、seed、content 與 snapshot 運作，不直接讀 UI、browser storage 或目前 mutable store。

航行以 ordered event beats 表示，使前景逐步呈現與離線一次結算共享同一順序。已處理的 beat 不會在 reload 後再次套用；尚未到達的 beat 可以在下次 elapsed-time resolution 繼續。

### Pirate Danger and Sailing Events

Pirate Danger 是 Region risk input，不是硬性 route lock。初期以資料化值建立低、中、高風險差異；Danger growth、reduction 與 Patrol 的完整 feedback loop 延後，避免玩家面對只能惡化而無法處理的永久狀態。

Event definition 描述 eligibility、權重、時間點與結構化 outcome。第一批事件保持單段 resolution，不加入需要 Skills、Trade Strategy 或多層選擇樹的條件。所有 outcome 都透過同一 Voyage result transaction 套用並留下玩家可見原因。

### Shared Combat and Fleet Condition

Combat resolver 接收已計算完成的雙方 HP 與 Attack，不理解船型、Skill、equipment 名稱或 UI。Round sequence 固定、必然終止並產生可摘要的 round records；Pirate enemy selection 可以由 Voyage seed 與 Danger 決定。

Fleet HP 是跨航程 persisted condition。Port repair 消耗 Gold 並成為 financial expense；修復命令與出航資格使用相同的 application mutation boundary。Medicine 與 Rope & Sails 可以由特定事件或修復結果使用，但不引入 Skill check。

### Loss, Diversion and Accounting

Event 與 defeat outcome 先決定實際損失及後續 destination，再由既有 Cargo、accounting 與 arrival rules 套用。Cargo loss 分開記錄 Quantity 與 cost basis，不以 sale 模擬，不產生 revenue 或 Market Session trade。

Forced Retreat 或 redirect 只會前往 deterministic 可達 Port。實際進入 Port 才觸發 Market Session transition；已在更早 arrival 結算的 Mastery 不因後續 Cargo loss 被回溯。Voyage Result 分開呈現 Sale Profit、Cargo Loss、Supplies/Repair Cost 與整體 Trade Net Profit。

### Items and Event Rewards

Item inventory 與 Cargo 分離，不占 Cargo Unit。Event reward 或消耗透過 stable Item identity 記錄於 Voyage Result；reload 不得重複授予或再次消耗。第一批 Items 只需要少量、明確的事件用途與特殊物品保存，不加入 equipment slot、rarity economy 或隨機關鍵解鎖。

### Voyage Result and Recovery

Voyage Result 是 domain resolution 與 presentation 的邊界。UI 從 result 顯示事件順序、Combat 摘要、資源 delta、原因、實際目的地與後續可行動選項；不從目前 state 反推歷史經過。

完整 result 至少保留到玩家確認或開始下一個互斥 flow，摘要進入 bounded activity history。若 save 在航行中損壞、content 無法解析、事件結果不合法或 redirect 沒有可達 Port，系統進入明確 recoverable state，不部分套用未知結果。

### Child Overview

Child 依 Voyage capability 的可玩增量排序，且每一階段同步擴充共用 Result presentation 與 online/offline parity。

| Child | Focus                              | Observable outcome                                                                       | Current document                                                            |
| ----- | ---------------------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| 01    | Deterministic Voyage Resolution    | 航程保存 snapshot、seed 與 timeline，前景和離線產生相同基礎 Result                       | [Sketch](v4-voyage-risk-and-feedback_01_deterministic-resolution.sketch.md) |
| 02    | Sailing Events and Pirate Danger   | Region Danger 產生可量測且可重現的非戰鬥航行差異                                         | [Sketch](v4-voyage-risk-and-feedback_02_events-and-danger.sketch.md)        |
| 03    | Pirate Combat and Repair           | Pirate Encounter、Fleet HP、Ammunition 與 Port repair 形成可恢復循環                     | [Sketch](v4-voyage-risk-and-feedback_03_combat-and-repair.sketch.md)        |
| 04    | Loss, Defeat and Diversion         | Cargo/Supplies loss、defeat、redirect 與 financial accounting 正確協作                   | [Sketch](v4-voyage-risk-and-feedback_04_loss-and-diversion.sketch.md)       |
| 05    | Items and Event Rewards            | Item reward、inventory、event consumption 與 reload behavior 正確                        | [Sketch](v4-voyage-risk-and-feedback_05_items-and-rewards.sketch.md)        |
| 06    | Voyage Feedback and Risk Hardening | 所有 completion mode 有完整報告並通過 determinism、parity、balance 與 accessibility 回歸 | [Sketch](v4-voyage-risk-and-feedback_06_feedback-and-hardening.sketch.md)   |

## Non-Goals

1. Skills、Skill XP、Skill check 或 Skill-based modifier。
2. Patrol，以及 Pirate Danger growth/reduction 的完整長期循環。
3. Expedition、Region unlock 或 Expedition-specific event choice。
4. Trade Plan、Trade Strategy、自動航行或自動交易。
5. Guild Charter、Warehouse、Workshop 或 Regional Guild automation。
6. 命中、閃避、Defense、位置、船員配置、技能按鈕、即時操作或完整戰術海戰。
7. Equipment build、Item crafting、獨立 Item farming 或以無保底隨機 Item 鎖住必要進度。
8. 永久 Fleet destruction、角色死亡或 save deletion penalty。

## Acceptance Criteria

1. 相同 Voyage snapshot、seed 與 content 重算時，事件順序、Combat rounds、資源 delta、redirect、arrival 與 reward 完全一致。
2. 前景完成、關閉後離線完成與中途 reload 後繼續的同一 Voyage 產生相同最終 state，而且 outcome 不會重複套用。
3. 不同 Pirate Danger content 產生可量測的風險差異，但不會直接鎖死 route；Patrol 尚未存在時 Danger 不形成只能永久上升的狀態。
4. Combat 在任一方 HP 歸零時終止，Attack 下限避免無限回合；victory、defeat、Ammunition 消耗、Fleet HP 與 repair 都有一致且可理解的結果。
5. Cargo loss 正確減少指定 Goods/Quality 的 Quantity、以 Weighted Average Unit Cost 記錄 Cargo Loss、保留剩餘 cost basis，且不產生 sale revenue 或回溯 Mastery。
6. Forced Retreat 或 redirect 只對實際進入的 Port 執行 Market Session transition；原定但未進入的目的地不刷新價格或取得 progression。
7. Item 取得、保存、reload 與事件消耗不改變 Cargo Unit，並且每個變化都只套用一次且出現在 Voyage Result。
8. 玩家能從 Voyage Result 分辨航行時間、Supplies、事件、Combat、HP、Cargo/Item 得失、Cargo Loss、實際目的地及 Market/Progression settlement。
9. 正常抵達、延誤、戰勝、戰敗撤退、強制改道、仍在航行與 recoverable error 都有不同且可存取的 rendered state。
10. 每個 Child 的 focused verification 與 repository-required checks 通過，最終回歸覆蓋 RNG determinism、online/offline parity、Combat termination、accounting、migration、repair、mid-voyage reload 與 accessibility。
