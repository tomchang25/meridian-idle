# Meridian Idle 遊戲設計文件

> 版本：v5.0  
> 狀態：Core product baseline  
> 類型：航海貿易／管理／增量遊戲  
> 平台：Web

---

## 一、設計定位

### 核心概念

玩家從 Lisbon 出發，觀察各港 Category 行情、配置 Product 與 Supplies、親自完成航程與交易，並透過 Port Level 解鎖當地更多 Product。高價值 Regional Specialty 具有有限供應，鼓勵玩家往返不同港口囤貨並承擔航行成本與風險。玩家最終以累積的資金、物資、Items 與航海成果完成 Expedition，解鎖新的 Region。

遊戲的主要決策是：

- 哪個 Port 的 Category 行情值得利用。
- 哪些 Product 在目的港屬於當地過剩或外地需求。
- 是否值得為有限供應的 Regional Specialty 安排跨 Region 航程。
- Cargo 要如何分配給 Product 與五類 Supplies。
- 是否繼續交易、修復 Fleet，或投入 Expedition。

### 一句話定位

> 親自建立跨港商路，在有限貨艙、行情與航行風險之間累積足以開拓新地區的資本。

### V5 Core 系統

| 系統             | 主要作用                                                       |
| ---------------- | -------------------------------------------------------------- |
| Manual Trade     | 唯一的交易方式；玩家親自 Buy、Sell 與 Provision                |
| Product System   | 定義 Product Family、Category、港口生產與 Regional Specialty   |
| Market Session   | 保存本次停港的 Category 行情、Specialty Supply 與交易紀錄      |
| Port Progression | 解鎖當地 Product、Specialty 供應與採購折扣                     |
| Voyage           | 消耗時間與 Supplies，處理 Event、Item Drop 與 Pirate Encounter |
| Combat           | Trade Voyage 與 Expedition 共用的簡單 HP／Attack 規則          |
| Expedition       | 手動投入資源並解鎖新 Region                                    |

### Frozen extensions

以下系統不屬於 V5 Core，也不建立 runtime placeholder：

- [Automation and Logistics](meridian-idle_v5_automation-and-logistics.md)
- [Skills](meridian-idle_v5_skills.md)
- [Quality Trade](meridian-idle_v5_quality-trade.md)
- [Pirate Danger and Patrol](meridian-idle_v5_pirate-danger-and-patrol.md)

Frozen extension 只有未來產品方向，不是 active implementation authority。恢復任何 extension 前必須重新確認 Core live contract，建立新 plan，並為新增 persisted state 定義 migration。

### 設計邊界

- 只有一支玩家 Fleet。
- 不做自動交易、Warehouse、Storage、Workshop、Manufactory 或 Guild progression。
- 不做 Skill、Skill XP 或 Skill modifier。
- 不做 Goods Quality；每個 Product stack 只有一個 Product identity。
- 不做動態 Pirate Danger 或 Patrol；Core 使用 route-authored static risk。
- 不做交易量驅動的行情變化；Category factor 只在建立 Market Session 時產生。
- 不做距離型 Specialty bonus 或跨區 spoilage；Core 使用固定 Region modifier。
- 不做完整戰術海戰、角色死亡或永久 Fleet destruction。

---

## 二、核心循環

### 手動貿易

```text
查看已知 Port 與當前 Market Session
→ 在目前 Port 購買已解鎖 Product 與 Supplies
→ 配置 Cargo
→ 手動選擇 Route 並出航
→ 處理 Sailing Event、Item Drop 或 Pirate Encounter
→ 抵達另一個 Port
→ 販賣 Product、查看完整財務結果
→ 結算來源 Port 的淨交易與 Port XP
→ 補給、修復或開始下一段航程
```

### Port 成長

```text
在 Port 完成有效淨交易
→ 實際進入另一個 Port
→ 結算上一個 Market Session
→ 增加上一個 Port 的 XP 與 Level
→ 解鎖更多當地 Product
→ 解鎖有限供應的 Regional Specialty
→ 提高 Specialty Supply 或取得採購折扣
```

### Region 開拓

```text
累積 Gold、Product、Supplies 與 Items
→ 修復並準備 Fleet
→ 開始 Expedition
→ 手動處理 Event 與 Combat
→ 累積 Expedition Progress
→ 撤退或抵達終點
→ 交付指定 Product
→ 解鎖新 Region 與 Port
```

---

## 三、世界結構

### 名詞

| 名詞          | 定義                                                     |
| ------------- | -------------------------------------------------------- |
| Region        | 一組相鄰 Port、Route 與 Expedition boundary 的地理區域   |
| Port          | 可停靠、查看 Market、交易、補給與修復的據點              |
| Route         | 兩個 Port 間的資料化航程，保存 distance、risk 與可達方向 |
| Known Port    | 玩家已解鎖並可查看情報的 Port                            |
| Locked Region | 只能透過對應 Expedition 解鎖的 Region                    |

### 初始世界

| Region                | 初始狀態                         |
| --------------------- | -------------------------------- |
| North Sea             | 開放                             |
| Iberian Atlantic      | 開放；Lisbon 為玩家起始地        |
| Western Mediterranean | 開放                             |
| Eastern Mediterranean | 開放                             |
| West Africa           | 鎖定；完成指定 Expedition 後開放 |

V5 Core 的第一批 authored content 不必一次填滿所有 Port，但資料契約必須支援上述世界。可玩的最小內容至少包含 Lisbon、同 Region 的貿易 Port、跨 Region 目的港，以及 West Africa Expedition 終點。

---

## 四、Product System

### Product Family

Product Family 是定價與分類資料，不是可持有的 Cargo identity。它定義：

- Base Price
- Category
- 顯示名稱與描述

例如：

```text
Product Family: Pig
├── Base Price: 100
└── Category: Livestock
```

### Product

Product 是實際可購買、持有、販賣、損失與交付的唯一 Cargo identity。它定義：

- Product ID
- Product Family
- 是否為 Regional Specialty
- Specialty Origin Port 與 Region（僅 Specialty）
- Item／Expedition 相關 metadata（需要時）

例如：

```text
Product: Faro Pig
├── Family: Pig
├── Category: Livestock
├── Specialty Origin Port: Faro
└── Specialty Region: Iberian Atlantic
```

不存在另一套可交易的通用 Goods inventory。若多個 Product 使用相同 Family，它們仍以不同 Product ID 保存與交易。

### Port Product Catalog

每個 Port 的完整生產 catalog 固定包含十種 Product：

| Port Level |        新增可購買內容 | 累積可購買數量 |
| ---------- | --------------------: | -------------: |
| Lv.1       |      4 Basic Products |              4 |
| Lv.20      |   3 Advanced Products |              7 |
| Lv.50      |  1 Regional Specialty |              8 |
| Lv.75      |  2 Remaining Products |             10 |
| Lv.100     | 所有 Buy Price `−10%` |             10 |

Port 是否生產某 Product 由完整十種 catalog 決定，不受玩家目前 Level 或 unlock 狀態改變。Unlock 只控制玩家能否在該 Port 購買；所有 Product 在所有已開放 Port 都可以出售。

### Regional Specialty

每個 Port 的 Lv.50 Product 是該 Port 唯一的 Regional Specialty。Specialty 是某個 Product Family 的地區變種，使用獨立 Product ID。

Specialty Supply 規則：

- Lv.50 解鎖後，每次新 Market Session 提供 20 Units。
- Lv.75 後，每次新 Market Session 提供 40 Units。
- 購買會扣除該 Session 的 persisted Specialty Supply。
- UI reopen、Buy、Sell、reload、出港後返回相同 Session 都不補充。
- 只有實際停靠不同 Port 並在之後重新進入原產 Port，建立新 Market Session 時才補充。
- 普通 Product 在 V5 Core 不設 Market Supply 上限。

這個限制讓 Specialty 的高收益由實際航程、時間、Supplies 與風險約束，而不是無限購買。

---

## 五、Market 與價格

### Category Market Factor

每個 Product Family 屬於一個 Category，例如 Livestock、Food、Textile、Metal 或 Luxury。每個 Port 的 Market Session 為有 listing 或交易需要的 Category 產生一個 Current Category Market Factor：

```text
0.85–1.20
```

Category factor 同時影響 Buy 與 Sell 的市場參考價。它代表該 Port 當次停港期間的整體行情，不代表港口產能、災害或玩家造成的供需變化。

### Market Reference Unit Value

```text
Raw Market Reference Unit Value
= Product Family Base Price
× Current Category Market Factor
```

Buy 與 Sell 都從未 round 的 Raw Market Reference 計算，避免中途 rounding 改變結果。UI 與 Port Progression 使用的整數參考價為：

```text
Market Reference Unit Value
= max(1, round-half-up(Raw Market Reference Unit Value))
```

所有最終 Buy／Sell Unit Price 也只在完整公式最後套用 `max(1, round-half-up(raw price))`。Preview、command、accounting 與 progression 使用同一個 rounding rule。

### Buy Price

玩家只能購買目前 Port 已依 Port Level 解鎖的 Product。

```text
Buy Price
= Raw Market Reference Unit Value
× Producer Buy Modifier
× Port Mastery Buy Modifier
```

V5 Core 固定：

```text
Producer Buy Modifier = 0.80

Port Level 1–99  → Port Mastery Buy Modifier = 1.00
Port Level 100   → Port Mastery Buy Modifier = 0.90
```

Producer Buy Modifier 只作用於 Buy。它代表玩家直接在生產港採購，不作用於目的港收購價。

### Sell Price

```text
Sell Price
= Destination Raw Market Reference Unit Value
× Sale Modifier
```

Sale Modifier 是互斥結果，不彼此相乘：

| 判定                                           | Sale Modifier |
| ---------------------------------------------- | ------------: |
| Destination Port 的完整 catalog 生產該 Product |        `0.50` |
| Regional Specialty 賣到同 Region 的其他 Port   |        `1.50` |
| Regional Specialty 賣到不同 Region             |        `3.00` |
| 普通 Product 賣到不生產該 Product 的 Port      |        `1.20` |

判定順序：

```text
if Destination Port produces Product
  0.50
else if Product is Regional Specialty
  if Destination Region == Specialty Origin Region
    1.50
  else
    3.00
else
  1.20
```

Specialty Bonus 取代普通外地 Product 的 `1.20`，不再額外相乘。距離、跨區邊界 spoilage 與動態需求留給未來設計。

### Worked Example

```text
Pig Base Price = 100
Faro Livestock Factor = 0.90
Producer Buy Modifier = 0.80

Faro Buy Price
= 100 × 0.90 × 0.80
= 72 Gold
```

若目的港 Livestock Factor 為 `1.00`：

```text
普通外地 Pig Sell Price
= 100 × 1.00 × 1.20
= 120 Gold

Faro Pig sold inside Iberian Atlantic
= 100 × 1.00 × 1.50
= 150 Gold

Faro Pig sold in another Region
= 100 × 1.00 × 3.00
= 300 Gold
```

Specialty 的高毛利是刻意設計，主要由有限 Session Supply、Cargo、航程時間、Supplies、Combat 與 Cargo Loss 控制。

---

## 六、Market Session

### Saved State

```text
Market Session
├── sessionId
├── portId
├── currentCategoryFactors
├── specialtySupplyRemaining
└── netTrades
    └── Product ID → signed quantity
```

`signed quantity > 0` 表示淨購買，`signed quantity < 0` 表示淨販賣。

### Lifecycle

當 Fleet 進入 Port 時：

```text
if enteredPortId == marketSession.portId
  保留 Category Factors
  保留 Specialty Supply
  保留 netTrades
  不結算 Port Progression

if enteredPortId != marketSession.portId
  結算上一個 Session 的 netTrades
  增加上一個 Port 的 XP
  關閉上一個 Session
  為新 Port 產生 Category Factors
  依該 Port Level 建立 Specialty Supply
  建立新 Market Session
```

只有實際停靠不同 Port 才切換 Session。UI reopen、Buy、Sell、reload、海上 Event、Combat、Forced Return 或未停靠其他 Port 的回航都不刷新。

所有 Market Session random result 在 domain resolution 中產生並立即保存。Presentation 不直接呼叫 random global。

### Remote Market Information

玩家可以查看已知 Port 的：

- 完整十種生產 catalog 與 unlock levels。
- Product Family、Category 與 Base Price。
- 上次實際停靠時觀察到的 Category Factors 與觀察時間。
- 尚未觀察時的 factor range，而不是虛構 current quote。

Remote view 不建立或刷新 Market Session，也不能執行交易。

---

## 七、Fleet、Cargo 與 Supplies

### Fleet

玩家只有一支 Fleet。Fleet 保存：

- 當前 Port 或 active Voyage／Expedition。
- Fleet Speed。
- Cargo Capacity。
- Product Cargo。
- 五類 Supplies。
- Fleet HP 與 Attack。
- Items。

Fleet 不能同時執行 Voyage 與 Expedition，也不存在背景免費 Fleet。

### Cargo Unit

Product 與 Supplies 共用 Cargo Capacity，全部使用正整數 Cargo Unit。Quantity command 只接受正整數；零、負數、fraction、NaN 或超出安全整數範圍全部拒絕。

五類 Supplies：

| Supply                 | 核心用途                                        |
| ---------------------- | ----------------------------------------------- |
| Food                   | Voyage 與 Expedition 基礎消耗                   |
| Water                  | Voyage 與 Expedition 基礎消耗；不能由 Food 取代 |
| Medicine               | Event、治療與 Expedition 生存                   |
| Gunpowder & Ammunition | Pirate Combat 與武裝 Event                      |
| Rope & Sails           | 修復、航行事故與 Event                          |

系統不為 Supplies 保留免費容量。玩家可以犧牲收益增加航行安全，也可以承擔補給不足風險；出航 eligibility 仍會阻止必然無法完成的航程。

### Provisioning

每個 Port 的 Supply unit price 由 content data 定義。Provisioning 不寫入 Product Market Session net trade，也不提供 Port XP。

Supply stack 保存 Quantity 與 Total Acquisition Cost Basis。消耗 Supplies 時，按 stack 的 weighted average unit cost 移除相應 cost basis，並將實際消耗列入 Voyage 或 Expedition Result。

卸除 Supplies 代表丟棄：不退款、不產生 Sale Revenue，也不回復 cost basis。

玩家可為每類 Supply 設定持久化的 Fleet target，並選擇在 Voyage 抵達後自動補給。Target 本身不交易；手動整批補給與自動補給只會購買低於 target 的缺口，會先驗證全部缺口的 Gold 與 Cargo Capacity，不能完整補足時不做部分購買。自動補給在目的港 settlement 後依目的港價格執行，失敗不回滾已完成的抵達，且不會自動丟棄高於 target 的 Supply。

---

## 八、Manual Port Operations

Manual operation 從遊戲開始即可使用。只有 Fleet 目前停靠的 Port 能執行 mutation。

| Action        | 規則                                                    |
| ------------- | ------------------------------------------------------- |
| Buy Product   | 購買目前 Port 已解鎖且有供應的 Product                  |
| Sell Product  | 所有 Product 都可出售；依目的港 Sale Modifier 計價      |
| Buy Supplies  | 依 Port content price 補給五類 Supplies                 |
| Restock Fleet | 一次購買全部 Supply target 缺口；可選擇在抵達時自動執行 |
| Discard Cargo | 丟棄 Product 或 Supplies，不產生收入                    |
| Repair        | 支付 Gold，恢復 Fleet HP；實際費用記入 accounting       |

Manual Port Operations 不需要額外 Action Timer。Voyage、Repair duration（若 content 設為非零）與 Expedition 才消耗主要時間。

所有 command 必須重新驗證 location、Fleet state、quantity、Gold、capacity、inventory、unlock 與 supply。無效 command 回傳單一明確原因，不產生 partial mutation。

---

## 九、Financial Accounting

### Product Cost Basis

每個 Product stack 保存：

- Quantity
- Total Cost Basis

Weighted Average Unit Cost 由兩者推導：

```text
Weighted Average Unit Cost
= Total Cost Basis / Quantity
```

購買時把實際支付 Gold 加入 Total Cost Basis。部分出售時按出售數量比例移除 cost basis；若出售整個 stack，移除所有剩餘 cost basis，避免 rounding remainder 留在空 stack。

```text
if Removed Quantity == Stack Quantity
  Removed Cost Basis = Total Cost Basis
else
  Removed Cost Basis
  = min(
      Total Cost Basis,
      round-half-up(Total Cost Basis × Removed Quantity / Stack Quantity)
    )

Remaining Cost Basis
= Total Cost Basis − Removed Cost Basis
```

Product sale、Cargo Loss、Discard 與 Supply consumption 都使用同一 cost-basis removal rule。

### Sale Result

```text
Sale Revenue
= Sold Quantity × Sell Unit Price

Realized Sale Profit
= Sale Revenue − Sold Cost Basis
```

### Cargo Loss

Event 或 Combat 移除 Product 時：

- 減少 Quantity。
- 按 weighted average unit cost 移除對應 cost basis。
- 記錄 Cargo Loss。
- 不產生 Sale Revenue。
- 不回溯取消已結算的 Port XP。

### Trade Net Profit

```text
Trade Net Profit
= Sale Revenue
− Sold Product Cost Basis
− Consumed Supplies Cost Basis
− Cargo Loss
− Repair Cost
− Direct Trade Fees
```

UI 必須分開顯示 Sale Profit、Supplies Cost、Repair Cost、Cargo Loss 與 Trade Net Profit。玩家不能只看到 Gold delta 而無法理解實際成本。

---

## 十、Port Progression

### 定位

每個 Port 有獨立的 Port XP 與 Level 1–100。Port Progression 只代表玩家對當地生產、人脈與市場操作的熟悉程度，不產生 Guild XP，也不依賴 Skills。

玩家第一次解鎖並進入 Port 時為 Lv.1。Level threshold 由單調成長的 content curve 定義。

### Market Session Gain

進入不同 Port 時，上一個 Market Session 依每個 Product 的淨交易量結算：

```text
Net Quantity
= Bought Quantity − Sold Quantity

Mastery Basis
= Σ abs(Net Quantity_i)
× Session Market Reference Unit Value_i
```

Mastery Basis 使用未套用 Producer Buy、Sale 或 Lv.100 modifier 的 Market Reference Unit Value，避免 Specialty bonus、當地懲罰或採購折扣扭曲 progression。

同一 Product 的 Buy 與 Sell 互相抵銷；不同 Product 不互相抵銷。Store、Supply purchase、Repair、Cargo Loss、Items、Combat 與 Expedition 不提供 Port XP。

### Unlocks

| Level  | Effect                                                         |
| ------ | -------------------------------------------------------------- |
| Lv.1   | 可購買 4 Basic Products                                        |
| Lv.20  | 解鎖 3 Advanced Products                                       |
| Lv.50  | 解鎖 Regional Specialty；20 Units／Session                     |
| Lv.75  | 解鎖最後 2 Products；Specialty Supply 提高至 40 Units／Session |
| Lv.100 | 所有當地 Product Buy Price `−10%`                              |

Level-up 可以一次跨越多個 threshold；所有 unlock 由最終 Level derived，不另外保存重複 boolean。

---

## 十一、Voyage、Event 與 Items

### Voyage Snapshot

每次出航保存不可變 snapshot：

- Voyage ID
- Origin 與 planned Destination
- Route ID 與 Region
- Departed At 與 planned Arrives At
- Route distance、static risk 與 resolution seed
- 預定最低 Food／Water cost
- 出航時 Fleet combat inputs

航程時間由 route distance 與 Fleet Speed 計算；Food／Water 最低消耗由 route content 與 distance 計算。所有 unit、rounding 與 content value 資料化，UI preview 與 command 使用同一 resolver。

### Deterministic Resolution

Online heartbeat、visibility resume、reload hydration 與 offline return 全部使用同一 resolver。Resolver 接收 explicit `now`、snapshot、content 與 RNG seed，不讀 browser timer count 或 random global。

有限 Voyage 不套用會阻止合法抵達的 reward cap；無論離線多久，只要 `now >= arrivesAt` 就解算至完成或 deterministic interruption。Clock rollback 使用 `max(0, now - lastResolvedAt)`，不得產生負進度。

### Static Route Risk

V5 Core 的 Pirate／Event risk 由 Route content 固定定義，不因玩家交易或時間永久成長。Dynamic Pirate Danger 與 Patrol 屬於 frozen extension。

### Sailing Event

第一批 Event 可以影響：

- Supplies consumption
- Fleet HP
- Cargo Loss
- Voyage delay 或 deterministic diversion
- Pirate Combat
- Item Drop

Event resolution 依 Voyage seed 產生 ordered beats。已套用 beat 保存 identity，reload 不得重複消耗、損失或發放 reward。

### Items

Items：

- 不占 Cargo Unit。
- 暫時沒有持有數量上限。
- 由 Sailing Event、Combat 或 Expedition 取得。
- 可以保存、顯示，並作為明確 Event／Expedition alternative。
- 不建立 equipment build、crafting、rarity economy 或專門 farming action。
- 必要 Region unlock 不得只依賴無保底 random Item Drop。

---

## 十二、Simple Combat 與 Repair

Trade Pirate Encounter 與 Expedition Pirate Encounter 共用同一 resolver。

### Combatant

```text
Combatant
├── HP
└── Attack
```

Fleet HP 與 Attack 在 Combat 開始前由 Fleet content、持有 Items 與當次 Event modifier 計算。Core 沒有 Skill modifier。

### Round Resolution

```text
while Player HP > 0 and Enemy HP > 0
  Enemy HP -= max(1, Player Attack)

  if Enemy HP <= 0
    Victory
  else
    Player HP -= max(1, Enemy Attack)
```

不包含命中、Defense、位置、技能按鈕或即時操作。

### Outcomes

| Context      | Victory                            | Defeat                                                      |
| ------------ | ---------------------------------- | ----------------------------------------------------------- |
| Trade Voyage | 繼續航行，可能取得 Product 或 Item | Cargo／Supplies／HP loss，deterministic return 或 diversion |
| Expedition   | 取得進展並繼續                     | Expedition 撤退                                             |

Defeat 不刪除 Save、不永久摧毀 Fleet／Items，也不造成角色死亡。

### Repair

Fleet HP 跨航程保存。Port Repair 使用 content-defined Gold cost，必要時消耗 Rope & Sails；Repair Result 記錄實際 cost basis 與恢復 HP。Fleet 不符合 route 或 Expedition 最低 condition 時不得出發。

---

## 十三、Expedition

### 定位

Expedition 是完全手動的特殊行動，用於解鎖 Region。West Africa 是 V5 Core 第一個 Expedition target。Expedition 不會自動循環。

### Preparation

玩家出發前配置：

- Fleet HP 與 Attack
- Product
- 五類 Supplies
- Items

Product 可以同時是 Event solution 與終點交付需求。過度裝載交付 Product 會壓縮 Supplies，形成主要 Cargo 取捨。

### Progress

```text
開始 Expedition
→ 消耗 Supplies 前進
→ 依 seed 處理 Event 或 Combat
→ 累積 Expedition Progress
→ 玩家選擇繼續或撤退
→ 抵達終點並交付 Product
```

### Retreat

以下情況撤退：

- Fleet HP 歸零。
- 關鍵 Supplies 歸零。
- Event 明確要求撤退。
- 玩家主動撤退。

撤退保留已取得的部分 Expedition Progress，以及未消耗或未損失的 Product、Supplies 與 Items；不完成終點交付，也不解鎖 Region。

### Completion

完成需要：

- 抵達終點。
- Fleet HP 大於 0。
- 滿足 completion requirements。
- 交付指定 Product。

完成後解鎖對應 Region、Port 與 Route。新 Port 初次進入時為 Lv.1，不直接增加其他 Port 的 XP。

---

## 十四、資訊透明

### Market UI

玩家必須能看到：

- Port 完整 catalog 與各 Product unlock level。
- Product Family、Category 與 Base Price。
- Current Category Market Factor。
- Market Reference、Buy／Sell Unit Price 與 modifier breakdown。
- Destination 是否生產該 Product。
- Specialty Origin、Region bonus 與剩餘 Session Supply。
- Fleet holding、weighted average cost 與 sale preview。
- 當前 Session net trade。

### Port Progression UI

玩家必須能看到：

- Current Level 與 XP。
- 下一個 unlock level、Product 與 effect。
- 本次 Session 預估或結算後的 XP basis。
- Specialty Supply 20／40 與 Lv.100 discount 狀態。

### Voyage／Combat UI

玩家必須能看到：

- Destination、route、remaining time 與 static risk。
- 預估及實際 Supplies cost。
- Fleet HP／Attack。
- Ordered Event／Combat summary。
- Product、Item、Cargo Loss、Repair 與實際抵達結果。

### Expedition UI

玩家必須能看到：

- Progress 與 completion requirements。
- Fleet condition、Product、Supplies 與 Items。
- 目前 Event／Combat result。
- Retreat 後可保留的進度。

所有主要操作必須支援 keyboard 與 touch，具有 semantic label、visible focus、disabled reason、非顏色狀態與 reduced-motion presentation。

---

## 十五、Save、Migration 與 Recovery

### Persisted authority

Save 保存 canonical game state、active operation snapshot、Market Session random result、inventory cost basis、Port XP、Items、world unlock 與最近尚未確認的 structured result。Tab、filter、draft quantity、modal 與 responsive state 不進入 Save。

### V3 to V5 transition

已發布的 V3 v1 save 使用 sequential migration：

- Gold 1:1 保留。
- V3 running Action 不再補算未提交的未來 cycle，migration 時停止。
- Fame、Captain、Knowledge、Skills、Action Mastery、selected Action filters 與 V3 logs 沒有 V5 等價物，明確列為 dropped data。
- Fleet、world、Product、Port Progression 與 Market Session 使用合法 V5 初始值建立。
- UI 顯示一次性 migration summary，玩家確認前不得把 dropped data 偽裝為 V5 progression。

若 save invalid、corrupt 或不足以建立合法 V5 state，應保留 unreadable payload，呈現 recoverable new-game choice；hydration settle 前不得 autosave 覆寫原資料。

Storage unavailable 時仍可開始非持久化 session，並持續顯示 persistence degraded 狀態。

---

## 十六、初始實作範圍

### 包含

- 一支 Fleet。
- 五類 Supplies 與 shared Cargo Capacity。
- Product Family、Product、Category 與每港十種 catalog contract。
- 每 Port／Category Market Factor。
- 固定 `0.80` Producer Buy Modifier。
- `0.50／1.20／1.50／3.00` Sell Modifier。
- Manual Buy／Sell／Provision／Discard／Repair。
- Weighted cost basis 與完整 Trade Net Profit。
- Market Session 與 Specialty 20／40 Units supply。
- Port Level 1–100 與五個 milestone。
- Deterministic Voyage、Sailing Event 與 Item Drop。
- Static route risk 與共用 HP／Attack Combat。
- 一個解鎖 West Africa 的 Expedition。
- V3 save migration、offline parity、recovery 與 accessible responsive UI。

### 不包含

- Automation and Logistics extension 的所有內容。
- Skills extension 的所有內容。
- Quality Trade extension 的所有內容。
- Dynamic Pirate Danger and Patrol extension 的所有內容。
- Dynamic Category supply/demand、傾銷或短缺。
- Port famine／prosperity 或其他 Production State。
- 距離型 Specialty modifier 或 spoilage。
- 多 Fleet、戰術海戰、角色死亡或永久 Fleet destruction。

---

## 十七、資料化數值

下列數值由 content data 控制，不散落在 UI 或 resolver：

- Product Family Base Price 與 Category。
- Port 的十種 Product catalog 與 unlock tier。
- Category Market Factor range。
- Producer Buy Modifier。
- Sale Modifiers。
- Specialty Supply 20／40。
- Port XP curve 與 Level thresholds。
- Supply unit price 與 Cargo Unit。
- Fleet Speed、Capacity、HP 與 Attack。
- Route distance、duration inputs、static risk 與 Supply consumption。
- Event weights、outcomes 與 Item drops。
- Enemy HP／Attack、Combat loss 與 reward。
- Repair cost 與 result。
- Expedition progress、events、retreat retention 與 completion requirements。

所有 random result 由 domain resolution 產生並保存，使前景、離線與 reload 使用相同結果。

---

_v5.0 core product design baseline_
