# V4 Manual Trade Core

## Goal

建立一個沒有隨機航行風險、但已能完整遊玩的手動跨港貿易版本。玩家從 Lisbon 開始，能配置 Cargo、購買 Goods 與 Supplies、安全航向另一個 Port、出售貨物、理解成本與收益，並在重新載入或離線後保留一致結果。

## Requirements

1. V4 runtime 以 Region、Port、Fleet、Cargo、Market Session、Port Mastery 與 Regional Guild progression 為核心，不再保留 V3 Captain、Knowledge、Action、Action Mastery 或 Captain Skill 的 runtime 行為。
2. 新遊戲從 Lisbon 開始，提供足以完成雙向手動貿易循環的資料化 Port、route、Goods、Quality 與 Market content；世界內容可以擴充而不改變核心交易規則。
3. 只有一支玩家 Fleet。Fleet 在停靠 Port 或航行中二者擇一，並保存 Speed、Cargo Capacity、Goods、Supplies 與目前位置或航程。
4. Goods 與五類 Supplies 共用 Cargo Unit。五類 Supplies 為 Food、Water、Medicine、Gunpowder & Ammunition、Rope & Sails；這份 Plan 只有 Food 與 Water 會在航行中固定消耗。
5. 所有 Cargo、Gold、交易與航行 command 都必須先驗證數量、資金、容量、位置及當前 Fleet 狀態；無效操作不得產生部分 mutation。
6. 每個 Port Market 將 Listing 分成 Specialty Products 與 General Products，並依 Goods Base Price、Quality Multiplier 與當次 Market Multiplier 產生 Current Price。
7. 同一 Market Session 的 Buy 與 Sell 使用同一 Current Price。Market UI 開關、Buy、Sell、reload、出港後返回相同 Port 都不得重抽價格。
8. 只有實際停靠不同 Port 才結算上一個 Market Session、產生新 Port 報價並建立新 Session。
9. 玩家可以檢視已知 Port 的市場資訊，但只能在 Fleet 當前停靠的 Port 購買 Goods、出售 Goods 或裝載 Supplies。
10. 每個 Goods 與 Quality 組合保存 Quantity 與 Weighted Average Unit Cost。販賣時分開計算 Sale Revenue、Sold Cost Basis 與 Realized Sale Profit。
11. Market Session 依 Goods 與 Quality 保存 signed net trade。玩家在同一 Session 內買回又賣出的淨零數量不得產生 Port Mastery。
12. 當 Fleet 實際進入不同 Port 時，上一個 Session 依淨交易量與當次價格結算 Port Mastery，並由實際增加的 Mastery 轉換成該 Region 的 persisted Guild XP。
13. Guild XP 可以累積與顯示，但本 Plan 不提供 Charter、Guild facilities 或 automation 功能。
14. 玩家可以從目前 Port 選擇可到達的目的 Port。航程時間由資料化 route distance 與 Fleet Speed 決定，航行期間不能執行 Port transaction。
15. 出航前必須有足夠 Food 與 Water 完成預定航程；不足時阻止出航。這份 Plan 不在海上產生飢餓、漂流、事故或其他隨機結果。
16. 關閉應用程式後，航程依保存的出發與預定抵達時間結算；相同航程在前景等待與離線回歸後必須得到相同位置、Supplies、Market Session 與 progression 結果。
17. V4 save transition 必須保留能安全保留的玩家價值，並明確呈現無法映射的 V3 progression；不得將無法轉換的 Captain、Knowledge、Action 或 Skill 資料靜默偽裝成 V4 進度。
18. 玩家介面必須清楚呈現目前 Port 或航行狀態、Fleet capacity、Cargo、Supplies、Market、交易預覽、財務結果、Port Mastery、Guild XP、save 狀態及最近 activity。
19. 每個交付切片都必須同時包含其必要的 state、persistence、UI、accessibility、error handling 與 tests，不把 presentation 或 verification 全部推遲到最後一個 Child。

## Design

### Release Boundary and Playable Loop

這份 Plan 的完成邊界是一個安全但完整的手動經濟循環：查看行情、配置貨艙、交易、跨港、再次交易、理解結果並累積地區進度。航行沒有事件或戰鬥，但不是 mock flow；Gold、Cargo、Supplies、成本帳、Market Session、Mastery、Guild XP 與 save 都使用正式契約。

初始內容只需要支撐可重複驗證的跨港循環，不把所有 V4 Region 的最終內容量當成核心系統的完成條件。Port、Goods、Quality、route 與數值皆由 content data 控制，後續增加內容不需要另造交易規則。

### V4 World and Save Transition

V4 直接取代現有 V3 Action-based runtime，不同時維護兩套可玩的 state machine。新狀態以單一 Fleet、world location、resources、cargo、market session 與 progression 為玩家進度來源；畫面 tab、filter、draft quantity 與 modal state 不進入 save。

已發布的 V3 save 仍是 compatibility input。轉換必須使用 versioned migration，保留可安全映射的共通價值，並把 degraded 或 dropped data 當成可觀察的 load result。若舊資料不足以建立合法 V4 狀態，玩家可以安全進入明確標示的 recovered new game，而不是啟動失敗或被初始 state 靜默覆寫。

### Fleet, Cargo and Provisioning

Fleet 是 Cargo 與航行狀態的唯一 owner。Goods 與 Supplies 使用相同容量預算，Cargo used、remaining capacity、affordability 與航行 eligibility 都從 canonical state 和 content 推導。

Port provisioning 使用與 Goods transaction 相同的 command discipline，但 Supplies 不參與 Market Session net trade 或 Port Mastery。Medicine、Gunpowder & Ammunition、Rope & Sails 在這份 Plan 中可以購買、保存與占用容量，實際風險用途留給後續 Voyage Risk Plan。

### Market, Session and Manual Trade

Market content 定義 Listing、Specialty、可供應 Quality 與 multiplier range；Market Session 保存本次停港已產生的價格及各 Goods/Quality 的 net trade。價格只在建立 Session 時產生並立即成為 persisted result，任何 presentation read 都不能重新產生價格。

Remote Market view 是資訊介面，不取得 transaction authority。實際 Buy、Sell 與 provisioning 都必須再次以 Fleet 當前位置驗證，避免僅靠 disabled UI 保護進度。

### Financial Accounting

相同 Goods 與 Quality 的多次買入合併為 Quantity 與 Weighted Average Unit Cost。部分出售只移除對應數量的 cost basis；剩餘貨物維持同一平均單位成本。交易回饋分開顯示收入、成本與實現利潤，不以 Gold 變化代替財務說明。

這份 Plan 尚未產生 Cargo Loss、Repair Cost 或 voyage risk expense，但成本帳形狀必須能在後續 Plan 加入這些結果，而不回寫或重新解釋已完成的交易。

### Safe Voyage and Offline Arrival

出航建立不可變的起點、終點、出發時間與預定抵達時間。安全航程只消耗預先可計算的 Food 與 Water；沒有中途事件、HP 或改道。抵達 transaction 依固定順序完成航程、扣除 Supplies、更新位置、結算上一個 Market Session，最後建立目的 Port Session。

前景 timer 與 application hydration 都使用同一航程完成語意。Reload 不得重新開始航程、重複扣除 Supplies、重複結算 progression 或重抽目的 Port 價格。

### Port Progression

Port Mastery 只對完成的 Market Session 淨交易結算。不同 Goods 與 Quality 分開計算，淨零項目不貢獻；出港後回到同一 Port 不結算。Guild XP 是由實際 Mastery gain 轉換並保存的地區進度，不從總 Mastery 即時計算回推。

這份 Plan 只顯示累積結果與其來源，不解鎖 Guild Charter 或任何自動化能力。Skills 整體延後，因此 Mastery 與 Guild XP 公式在本 Plan 不套用 Skill modifier。

### Player Feedback and Recovery

每個 transaction 都要提供成功結果或可行動的拒絕原因。Market 顯示價格構成、持有量、平均成本、預估出售結果與 Session net trade；Voyage 顯示目的地、時間、Food/Water 需求及抵達狀態；progression 顯示本次與累積增量。

Hydration、saving、storage unavailable、recovered save、empty cargo、insufficient funds、insufficient capacity 與 invalid quantity 都有明確 rendered state。各 Child 交付自己的語意化標籤、鍵盤操作與 responsive presentation；最後一個 Child 只負責跨系統 hardening，不承接先前未完成的基礎 UI。

### Child Overview

Child 依可觀察垂直成果排序；每個 Child 在即將實作時才建立 codebase-verified Implementation Spec。

| Child | Focus                                 | Observable outcome                                                     | Current document                                                    |
| ----- | ------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------- |
| 01    | V4 Bootstrap and Migration            | 新遊戲與舊 save 都能進入合法 V4 world，V3 runtime 不再是可玩路徑       | [Sketch](v4-manual-trade-core_01_bootstrap-and-migration.sketch.md) |
| 02    | Cargo and Port Provisioning           | 玩家可以在容量、Gold 與位置規則下管理 Goods 與五類 Supplies            | [Sketch](v4-manual-trade-core_02_cargo-and-provisioning.sketch.md)  |
| 03    | Market Session and Manual Trade       | 玩家可以使用 persisted 報價買賣，並理解持有成本與交易結果              | [Sketch](v4-manual-trade-core_03_market-and-manual-trade.sketch.md) |
| 04    | Safe Voyage and Offline Arrival       | 玩家可以安全跨港，online/offline 抵達與 Market Session transition 一致 | [Sketch](v4-manual-trade-core_04_safe-voyage-and-offline.sketch.md) |
| 05    | Port Progression and Trade Settlement | 異港抵達正確結算 Port Mastery 與 Guild XP，同港操作不可刷進度          | [Sketch](v4-manual-trade-core_05_port-progression.sketch.md)        |
| 06    | End-to-End Core Hardening             | 完整循環在 save recovery、responsive、keyboard 與整合邊界下可穩定遊玩  | [Sketch](v4-manual-trade-core_06_core-hardening.sketch.md)          |

## Non-Goals

1. Skills、Skill XP、Skill modifier 或 placeholder Skill state/UI。
2. Sailing Event、Pirate Danger、Combat、Fleet HP、Cargo Loss、repair、Items 或 random voyage reward。
3. Regional Guild Charter、Warehouse、Workshop、long-term supply、inter-guild transport 或其他 Guild facility。
4. Trade Plan、Trade Strategy 或任何自動 Buy/Sell。
5. Patrol、Expedition 或 Region unlock flow。
6. 多 Fleet、有限 Market stock、交易量供需、bid/ask spread 或玩家可程式化 route。
7. 完整 V4 世界內容量與最終 balance；本 Plan 交付可擴充 content contract 與足以驗證循環的初始資料集。

## Acceptance Criteria

1. 玩家可以從 Lisbon 開始，在至少兩個不同 Port 間完成「補給、買貨、航行、賣貨、再航行」循環，且不需要任何尚未交付的 Risk 或 Guild system。
2. 新遊戲、合法舊 save、損壞 save 與 storage unavailable 都能進入明確且可恢復的 UI 狀態，不會在 hydration 前以初始資料覆寫既有 save。
3. Goods 與 Supplies 永遠不超過 Fleet Cargo Capacity；負數、零、超額、超出持有量、超出 Gold 或錯誤位置的 command 不產生部分 mutation。
4. 同一 Market Session 的價格在 UI reopen、Buy、Sell、reload、出港後返回原 Port 時保持不變；只有進入不同 Port 後才建立新 Session。
5. 混合不同買入成本後部分出售相同 Goods/Quality 時，顯示的 Weighted Average Unit Cost、Sold Cost Basis、Realized Sale Profit 與剩餘 cost basis 正確。
6. 只有進入不同 Port 才結算上一個 Session；同港買入後賣回、出港後返回同港或淨交易為零都不能產生 Port Mastery。
7. Port Mastery gain 只增加所屬 Region 的 persisted Guild XP，且 Charter、Guild facilities 與 automation 維持不可用。
8. 相同航程在前景等待與離線回歸後產生相同抵達時間、Food/Water 消耗、位置、Market Session、Mastery 與 Guild XP，而且重複 reload 不會再次結算。
9. Market、Cargo、Voyage、progression、save/error 與 activity feedback 在 desktop 和 mobile layout 可理解，主要操作可用鍵盤完成並具有明確 label、focus 與 disabled reason。
10. 每個 Child 的 focused verification 與 repository-required checks 通過，最終整合驗收覆蓋完整手動貿易循環及 migration、persistence、domain、application 與 UI boundaries。
