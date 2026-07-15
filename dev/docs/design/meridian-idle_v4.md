# Meridian Idle 遊戲設計文件

> 版本：v4.0  
> 類型：航海貿易／管理／增量遊戲  
> 平台：Web

---

## 一、設計定位

### 核心概念

玩家從里斯本出發，親自往返港口、觀察行情、配置貨艙並完成交易。隨著 Port Mastery 與 Regional Guild 成長，玩家可以把已經理解的交易流程編成自動 Trade Plan，建立倉庫與工坊，將不同產地的 Goods 集中加工，並透過 Expedition 解鎖西非。

遊戲的主要決策不是即時操船，而是：

- 去哪個 Port
- 買入、賣出或搬運哪些 Goods
- Cargo 要如何分配給 Goods 與 Supplies
- 目前行情是否值得交易
- 要先開拓 Port Mastery，還是集中資金建設 Regional Guild
- 航行時採取什麼 Strategy
- 何時停止貿易，改為 Patrol 或 Expedition

### 一句話定位

> 親自學會一條商路，再把它逐步交給商會與船隊自動運作。

### 系統分工

| 系統           | 主要作用                                     |
| -------------- | -------------------------------------------- |
| Manual Trade   | 初期港口交易、價格判斷、精準配置 Cargo       |
| Trade Plan     | 中期主要 Idle 經濟循環                       |
| Port Mastery   | 港口熟悉度、自動化與地區成長來源             |
| Regional Guild | 自動交易、Warehouse、Workshop 與區域基礎建設 |
| Skill          | 玩家組織與船隊的全局永久能力                 |
| Pirate Danger  | 各 Region 的航行風險                         |
| Patrol         | 主動降低 Pirate Danger                       |
| Combat         | Trade、Patrol 與 Expedition 共用的戰鬥規則   |
| Expedition     | 手動推進並解鎖新 Region                      |

### 設計邊界

- 只有一支主角船隊，不做多艦隊並行管理。
- 不做玩家自訂條件、分支、Jump 或多層 Action Queue。
- 不做交易量驅動的供需與動態價格模擬。
- 不做買價／賣價差；同一 Market Session 使用同一價格。
- 不做獨立陸戰系統。
- 不做專門的考古、採集或 Item Farming Action。
- 不做完整戰術海戰；戰鬥使用共用的數值回合規則。

---

## 二、核心循環

### 初期：手動貿易

```text
查看已知 Port 的市場資訊
→ 航向 Port
→ 手動購買 Goods、裝載 Supplies
→ 前往另一個 Port
→ 處理航行 Event 或海盜遭遇
→ 販賣 Goods
→ 累積 Gold、Skill 與 Port Mastery
```

### 中期：商會與自動 Trade Plan

```text
累積 Regional Hub Port Mastery 與 Guild XP
→ 取得 Charter
→ 建立 Regional Guild
→ 編排最多八格 Trade Plan
→ 船隊依序自動航行與交易
→ 建造 Warehouse
→ 集中不同 Port 的 Goods
→ 建造 Workshop
→ 將 Goods 加工成中間品或成品
```

### 地區開拓

```text
準備 Fleet、Goods、Supplies 與 Items
→ 開始 Expedition
→ 手動處理 Event 與 Combat
→ 累積 Expedition Progress
→ 抵達終點並交付 Goods
→ 解鎖 Region
→ 在新 Region 重新建立 Port Mastery 與 Regional Guild
```

### 成熟自動化

```text
高 Port Mastery
→ 解鎖當地 Standard Goods 的長期供應
→ Goods 固定流入所屬 Regional Guild
→ Regional Guild 之間建立固定運輸
→ 主角船隊轉向高品質交易、新 Port 與 Expedition
```

---

## 三、世界結構

### 名詞

| 名詞           | 定義                                                                |
| -------------- | ------------------------------------------------------------------- |
| Region         | 一組相鄰 Port、航線、Pirate Danger 與一個 Regional Guild 的地理區域 |
| Port           | 所有可停靠、查看 Market 並進行交易的城市或村莊據點                  |
| Regional Hub   | Region 內唯一能成立 Regional Guild 的最大 Port                      |
| Regional Guild | 玩家在該 Region 的商會據點                                          |
| Headquarters   | 玩家位於 Lisbon 的總會                                              |

### Region 配置

| Region                | Regional Hub         | 初始狀態                        |
| --------------------- | -------------------- | ------------------------------- |
| North Sea             | London               | 開放                            |
| Iberian Atlantic      | Lisbon               | 開放；玩家起始地與 Headquarters |
| Western Mediterranean | Marseille            | 開放                            |
| Eastern Mediterranean | Alexandria           | 開放                            |
| West Africa           | Expedition 終點 Port | 鎖定；完成 Expedition 後開放    |

### Port 結構

```text
Port
└── Market
    ├── Specialty Products Section
    └── General Products Section
```

普通 Port 只能進行 Market 交易。Store、Withdraw 與 Processing 只存在於已建成對應設施的 Regional Hub。

### Regional Hub 結構

```text
Regional Hub
├── Market
└── Regional Guild
    ├── Charter
    ├── Warehouse
    └── Workshop
```

---

## 四、Fleet 與 Cargo

### Fleet

玩家控制一支主角船隊。Fleet 保存：

- 當前 Port 或航行狀態
- Fleet Speed
- Cargo Capacity
- Goods Cargo
- Supplies Cargo
- Combat HP 與 Attack 的來源數值
- 裝備與 Items
- 當前 Manual／Trade Plan／Patrol／Expedition 狀態

所有 Manual 操作與自動 Trade Plan 使用同一支 Fleet，不存在背景中的第二支免費船隊。

### Cargo Unit

Goods 與 Supplies 共用 Cargo Capacity，皆以 Cargo Unit 計算。

例：Cargo Capacity 300 的卡維爾帆船可以配置為：

```text
Food 10 + Water 12 + Medicine 3 + Ammunition 5 + Rope & Sails 10
+ Goods 260
= 300 Cargo Units
```

玩家可以極端減少 Supplies 以提高 Goods 載量，也可以犧牲收益換取航行安全。系統不替玩家保留免費的 Supplies 空間。

### Goods

所有可交易、儲存、加工與交付的貨物皆為 Goods。Materials 不構成獨立分類。

```text
Pig → Pork → Cured Meat
Iron + Wood → Tools
Iron + Wood + Tools → Cannon
```

同一個 Goods 可以同時是：

- 可直接交易的商品
- Workshop Recipe 的輸入
- 另一個 Recipe 的中間品
- Contract 或 Expedition 的交付物
- 可轉為某類 Supplies 的物資

### Supplies

Supplies 分為五類：

| Supply                 | 用途方向                                       |
| ---------------------- | ---------------------------------------------- |
| Food                   | 航行與 Expedition 的基礎消耗                   |
| Water                  | 航行與 Expedition 的基礎消耗；不能由 Food 取代 |
| Medicine               | 治療、疫病與 Expedition 生存                   |
| Gunpowder & Ammunition | Patrol、Combat 與武裝航行                      |
| Rope & Sails           | 航行事故、修復與特殊 Event                     |

Supplies 歸零不會摧毀帳號進度，但會造成 Trade Plan 停止、Expedition 撤退或 Event 結果惡化。

### Items

Items 不占 Cargo Unit，暫時沒有持有數量上限。Items 包含：

- 武器
- 裝備
- 特殊工具
- Event 物品
- 收藏或關鍵物品

Items 主要由航行 Event 隨機取得。關鍵 Region 解鎖不得只依賴無保底的隨機 Item 掉落。

---

## 五、Goods Quality 與 Processing

### Quality

Goods 使用三段品質：

| Quality     | 定位                                         |
| ----------- | -------------------------------------------- |
| Standard    | 一般市場與基礎生產的主要品質                 |
| Fine        | Specialty Port 或較高加工能力取得的高品質    |
| Exceptional | 低比例高階品質，用於高階 Contract 或特殊用途 |

Quality 影響 Goods Price、Contract 接受條件與 Recipe 結果。Quality 與稀有度不是同一概念；特殊 Item 的稀有性不使用 Goods Quality 表示。

### Recipe

Recipe 定義：

- 輸入 Goods 與數量
- 可接受的最低 Quality
- 輸出 Goods、數量與 Quality 規則
- Processing Time
- 所需 Workshop Line
- 相關 Skill

Processing 只能在已建成 Workshop 的 Regional Hub 執行。

### Workshop 輸入規則

- Workshop 只從當地 Warehouse 取用材料。
- Workshop 不會自動從 Market 補買缺少的材料。
- 材料不足時，該 Production Line 等待，不消耗 Gold。
- Warehouse 空間不足時，該 Production Line 等待。
- 完成品進入當地 Warehouse。
- 若要出售完成品，必須由 Manual 操作或 Trade Plan 執行 Withdraw 與 Sell。

---

## 六、Market

### Market Listing

每個 Goods 在每個 Port 的 Market Listing 包含：

- Goods ID
- 是否為 Specialty Product
- Quality Distribution
- Current Market Multiplier
- Current Price by Quality

Specialty 只是 Listing 屬性；玩家介面將 Listing 分到 Specialty Products 或 General Products Section。

### Specialty Products

- Current Market Multiplier 在 `0.75–0.90` 之間。
- 可以供應 Standard、Fine 或 Exceptional。
- 各 Port 的 Quality Distribution 不同。
- 購買時依實際取得的 Quality 支付對應價格。

### General Products

- Current Market Multiplier 在 `0.95–1.25` 之間。
- 當地市場只主動供應 Standard Quality。
- Market 仍會收購玩家運入的 Fine 與 Exceptional Goods。

### Price Formula

```text
Price
= Goods Base Price
× Quality Multiplier
× Current Market Multiplier
```

Buy 與 Sell 使用同一個 Current Price。Commerce Skill、Port Mastery 與 Guild Level 不直接修改 Current Price。

例：

```text
Pig Base Price = 100
Fine Quality Multiplier = 1.5
Faro Current Market Multiplier = 0.8

Standard Pig Price = 80
Fine Pig Price = 120
```

在同一 Market Session 中，Fine Pig 的 Buy Price 與 Sell Price 都是 120。

### Supply

Market Supply 不設數量上限。玩家可交易的數量只受以下因素限制：

- Gold
- Fleet Cargo Capacity
- Warehouse Capacity
- Trade Plan Operating Fund
- Goods 的實際 Quality Distribution

玩家交易不會改變 Current Market Multiplier。

---

## 七、Market Session

### 定位

Market Session 同時負責：

- 保存玩家目前所屬 Port 的市場行情
- 防止重開介面或重新載入洗價格
- 累積該次停港的淨交易紀錄
- 在真正進入另一個 Port 時結算 Port Mastery

### Saved State

```text
Market Session
├── portId
├── currentMarketPrices
└── netTrades
    └── Goods ID + Quality → signed quantity
```

`signed quantity > 0` 表示淨購買，`signed quantity < 0` 表示淨販賣。

### Market Session Lifecycle

當 Fleet 進入 Port 時：

```text
if enteredPortId == marketSession.portId
  保留 Current Market Prices
  保留 netTrades
  不結算 Port Mastery

if enteredPortId != marketSession.portId
  結算上一個 Port 的 netTrades
  增加上一個 Port 的 Port Mastery
  清除上一個 Market Session
  為新 Port 產生 Current Market Prices
  建立新 Market Session
```

只有實際停靠另一個 Port 才算切換 Market Session。海上繞行、Event、Combat 或回到相同 Port 都不刷新行情。

### 範例：原港買賣

```text
Faro Buy Pig ×40
→ 出港但未停靠其他 Port
→ 返回 Faro
→ Sell Pig ×40

Net Trade = 0
Port Mastery Gain = 0
Market Price 不刷新
```

### 範例：有效市場切換

```text
Faro Buy Pig ×40
→ 停靠 Porto

進入 Porto 時：
  結算 Faro Net Buy ×40
  增加 Faro Port Mastery
  建立 Porto Market Session
```

若之後返回 Faro，Faro 會產生一組新的 Current Market Prices。

### Random 與 Persistence

- Current Market Prices 在建立 Market Session 時產生。
- 產生結果必須寫入 Save。
- 開啟 Market UI 不得重抽。
- Buy／Sell 不得重抽。
- Reload 不得重抽。
- Trade Plan 與 Offline Resolution 必須按照實際停港順序建立 Market Session。

---

## 八、Manual Port Operations

### 可用性

Manual Port Operations 從遊戲開始即可使用，是初期主要玩法，也是自動 Trade Plan 之外的精準控制手段。

玩家可以查看已知 Port 的市場資料，但只有 Fleet 當前所在 Port 能執行交易。

### Manual Actions

| Action   | 規則                                           |
| -------- | ---------------------------------------------- |
| Buy      | 指定 Goods 與數量；受 Gold 與 Cargo 限制       |
| Sell     | 指定 Goods、Quality 與數量；使用 Current Price |
| Store    | 只在已建成 Warehouse 的 Regional Hub 可用      |
| Withdraw | 只在已建成 Warehouse 的 Regional Hub 可用      |
| Process  | 只在已建成 Workshop 的 Regional Hub 可用       |

手動操作不需要額外 Action Timer。航行、Processing、Patrol 與 Expedition 才消耗主要時間。

### 與 Trade Plan 的關係

- 玩家手動接管 Fleet 時，Trade Plan 暫停。
- Manual 與 Trade Plan 共用 Fleet Position、Cargo、Supplies、Gold 與 Market Session。
- 玩家完成手動整理後可以恢復 Trade Plan。
- Trade Plan 不得在玩家操作時於背景改變相同 Cargo。

---

## 九、Trade Plan

### 定位

Trade Plan 是玩家將已理解的港口操作轉成 Idle 循環的主要系統。它不是條件式物流程式，而是一張固定順序的航行清單。

### Slot

一份 Trade Plan 最多有八個 Slot：

```text
Slot
├── Port
├── Action
└── Goods
```

可用 Action 只有：

- Buy
- Sell
- Store
- Withdraw

Processing 不屬於 Slot，由 Workshop 的 Production Line 執行。

### Execution

```text
讀取 Current Slot
→ 若 Fleet 不在 Slot Port，航向 Slot Port
→ 進港並處理 Market Session
→ 執行 Slot Action
→ Slot Index +1
→ Slot 8 後回到 Slot 1
```

若連續 Slot 指向同一 Port，Fleet 不需要航行，Current Market Prices 與 Market Session 也不刷新。

### 範例：雙向商路

```text
1. Faro   — Buy Pig
2. Lisbon — Sell Pig
3. Lisbon — Buy Firearms
4. Faro   — Sell Firearms
```

### 範例：集中加工材料

```text
1. Iron Source Port — Buy Iron
2. Lisbon           — Store Iron
3. Wood Source Port — Buy Wood
4. Lisbon           — Store Wood
5. Lisbon           — Withdraw Tools
6. Tool Demand Port — Sell Tools
```

Lisbon Workshop 在背景從 Warehouse 取用 Iron 與 Wood，加工完成的 Tools 回到 Lisbon Warehouse。

### Action Semantics

| Action   | 自動規則                                                     |
| -------- | ------------------------------------------------------------ |
| Buy      | 在 Cargo 與 Operating Fund 允許下，盡量購買指定 Goods        |
| Sell     | 販賣 Fleet Cargo 內所有指定 Goods                            |
| Store    | 將 Fleet Cargo 內所有指定 Goods 盡量存入 Warehouse           |
| Withdraw | 從 Warehouse 取出指定 Goods，直到 Cargo 無剩餘空間或庫存歸零 |

Slot 不提供自訂數量、百分比、條件、重複次數或優先序。

### Plan Settings

整份 Trade Plan 只有：

- 八個 Slot
- 一個航行 Strategy
- 一筆 Operating Fund
- 一個 `On Blocked` 設定：Skip 或 Stop

Operating Fund 是自動 Buy 與必要航行支出的上限。Trade Plan 不得直接無限制使用玩家全部 Gold。

### Blocked Behavior

Slot 可能因以下原因無法執行：

- Operating Fund 不足
- Cargo 已滿
- 指定 Goods 不存在
- Warehouse 未建成
- Warehouse 已滿
- Supplies 不足以航行
- 對應 Region 尚未成立 Regional Guild，不能自動交易

```text
On Blocked = Skip
  不執行該 Slot，繼續尋找下一個可執行 Slot

On Blocked = Stop
  暫停整份 Trade Plan，等待玩家處理
```

若完整掃描八個 Slot 後沒有任何 Slot 可執行，Trade Plan 必須自動停止，避免零時間無限循環。

### Supplies

Trade Plan 使用 Fleet 當前裝載的 Supplies，不會隱藏購買無限 Supplies。當 Supplies 不足以進行下一段航行時，依 `On Blocked` 規則處理；玩家可暫停 Plan 並手動補給。

### Automation Requirements

- Manual Buy／Sell 不需要 Regional Guild。
- 自動 Buy／Sell 需要該 Slot 所屬 Region 已取得 Guild Charter。
- Store／Withdraw 需要該 Regional Hub 已建成 Warehouse。
- Workshop Processing 需要該 Regional Hub 已建成 Workshop。

---

## 十、Port Mastery

### 定位

Port Mastery 代表玩家對該 Port 的行情、供應、人脈與商業運作熟悉程度。每個 Port 只有一條可見 Mastery，不拆分 Export 與 Import。

Port Mastery 主要影響：

- Regional Guild Charter 門檻
- Guild XP 來源
- Port 相關自動化
- 高 Mastery 長期供應
- Commerce Skill 的成長回饋

### Market Session Gain

進入另一個 Port 時，上一個 Market Session 依每個 `Goods + Quality` 的淨交易量結算：

```text
Net Quantity
= Bought Quantity
− Sold Quantity
```

```text
Mastery Basis
= Σ abs(Net Quantity_i) × Current Price_i
```

Mastery XP 由 Mastery Basis 經資料曲線轉換，並套用 Commerce Skill 的 Port Mastery 加成。曲線必須保持單調成長，同時避免高單價 Goods 完全壓過其他商品。

### Examples

```text
Buy Pig ×40
Sell Pig ×40
→ Net 0
→ Mastery 0
```

```text
Buy Pig ×40
Sell Pig ×10
→ Net Buy 30
→ 依 30 Pig 的 Current Price 結算
```

不同 Goods 與 Quality 分開計算，不互相抵銷。

### Non-Market Gain

- Store 不提供 Port Mastery。
- Withdraw 不提供 Port Mastery。
- Workshop 成功完成 Recipe 時，增加 Regional Hub Port Mastery。
- Expedition 與 Patrol 不增加 Port Mastery。

### Cargo Loss

Port Mastery 在進入下一個 Port 時，依上一個 Market Session 已完成的交易結算。之後發生的海盜搶奪不會回頭扣除來源 Port 已取得的 Mastery。

---

## 十一、Regional Guild

### 定位

Regional Guild 是玩家在 Region 的唯一商業據點。每個 Region 的 Regional Guild 固定設於 Regional Hub。

Regional Guild 負責：

- 自動 Buy／Sell 權限
- Warehouse
- Workshop
- 長期供應
- 地區內的商業自動化

### Guild XP

當 Region 內任一 Port Mastery 增加時，依資料公式增加該 Region 的 Guild XP。

```text
Guild XP Gain
= f(Port Mastery XP Gain)
```

Guild XP 是實際保存的進度，不從目前 Port Mastery 即時計算回推。

Patrol、Pirate Danger 與 Expedition Progress 不增加 Guild XP。

### Charter

取得 Regional Guild Charter 需要：

- Regional Hub Port Mastery 達到門檻
- 已累積足以達到 Guild Lv.1 的 Guild XP

Guild XP 可以在 Charter 前累積，但未取得 Charter 時，Effective Guild Level 最高顯示為 Lv.1，且所有 Guild 功能鎖定。

Lisbon Headquarters 在遊戲開始時已持有 Iberian Atlantic Charter，作為玩家第一個 Regional Guild。

### Guild Level

#### Lv.1：Regional Guild

- 解鎖該 Region 的自動 Buy／Sell。
- 解鎖 Guild 介面與設施建造入口。

#### Lv.2：Warehouse Permit

- 允許建造 Warehouse。
- Warehouse 建成後才解鎖 Store／Withdraw。
- Warehouse Capacity 以 Cargo Unit 計算。
- Warehouse 可以多次擴充，每次擴充成本提高。

#### Lv.3：Workshop Permit

- 允許建造 Workshop。
- Workshop 建成後才解鎖 Processing。
- 初始 Workshop 提供一條 Production Line。
- 每次 Workshop 擴充增加一條 Production Line。
- 每次擴充成本提高。

### Facility Rule

Guild Level 只提供建造許可，不會免費生成 Warehouse 或 Workshop。玩家必須另外支付建造與擴充成本。

### Long-Term Supply

高 Port Mastery 可以解鎖該 Port Specialty 的長期供應：

- 只供應 Standard Quality。
- 以固定 Throughput 直接送往所屬 Regional Guild Warehouse。
- 不使用主角 Fleet Cargo。
- 受 Guild 的供應容量限制。
- 不會提供 Fine 或 Exceptional Goods。

此系統代表已成熟的採購與地區內運輸，讓主角 Fleet 不必永久重跑已完全熟練的基礎採購。

### Inter-Guild Transport

已成立的 Regional Guild 可以建立固定 Guild-to-Guild Transport：

- 從來源 Guild Warehouse 取貨。
- 按固定 Throughput 運送至目標 Guild Warehouse。
- 受來源庫存、目標容量與 Transport Capacity 限制。
- 不參與主角 Fleet 的八格 Trade Plan。

Inter-Guild Transport 用於集中 Standard Goods；高品質與臨時需求仍由主角 Fleet 處理。

---

## 十二、Financial Accounting

### Cost Basis

每個 `Goods + Quality` 庫存保存：

- Quantity
- Weighted Average Unit Cost

多次購買相同 Goods 與 Quality 時，重新計算加權平均成本。UI 可以只顯示合併後的庫存與平均成本，不需要展示內部批次。

### Sale Profit

```text
Sale Revenue
= Sold Quantity × Current Price

Sold Cost Basis
= Sold Quantity × Weighted Average Unit Cost

Realized Sale Profit
= Sale Revenue − Sold Cost Basis
```

### Processing Cost

Workshop 成品的 Cost Basis 由以下項目組成：

- 消耗原料的 Cost Basis
- Recipe Processing Cost
- 直接 Guild 費用

成本平均分配到實際產出的 Goods。

### Cargo Loss

海盜或 Event 搶走 Goods 時：

- 減少 Quantity。
- 按 Weighted Average Unit Cost 記錄 Cargo Loss。
- 不重新分配已經結算的 Port Mastery。

### Trade Net Profit

```text
Trade Net Profit
= Sale Revenue
− Goods Cost Basis
− Cargo Loss
− Supplies Cost
− Repair Cost
− Direct Trade Fees
```

Financial Accounting 必須向玩家分開顯示 Sale Profit、Cargo Loss 與完整 Trade Net Profit，避免玩家只看到售價而無法理解實際虧損來源。

---

## 十三、Skill

### 定位

Skill 代表玩家組織、船隊與人員累積的全局永久能力。Skill 不屬於特定 Captain。

### Initial Skill Set

| Skill       | 主要用途                                 |
| ----------- | ---------------------------------------- |
| Commerce    | Port Mastery 加成、商業委託、Trade Event |
| Navigation  | 航行 Event、路線穩定性、Supplies 效率    |
| Crafting    | Workshop Recipe、品質與加工 Event        |
| Gunnery     | Fleet Attack、Patrol 與 Pirate Combat    |
| Repair      | 船況、Combat 後恢復與事故 Event          |
| Exploration | Expedition Event 與進展效率              |
| Medicine    | Expedition 生存、治療與疫病 Event        |

### Commerce

Commerce 明確不影響：

- Current Market Price
- Buy／Sell 價格倍率
- Fleet Speed
- Trade Plan 航行循環速度

Commerce 影響：

- Port Mastery XP 取得量
- 商業委託報酬
- Trade Event 判定
- 正向 Realized Sale Profit 所提供的 Commerce XP

Commerce XP 不因虧損倒扣。Cargo Loss 與航行成本仍會降低玩家實際 Trade Net Profit。

### Skill Growth

Skill XP 來源必須與實際用途一致：

- Trade 與商業 Event → Commerce
- 航行與航行 Event → Navigation
- Workshop Processing → Crafting
- Combat → Gunnery
- 船況與修復 Event → Repair
- Expedition 進展與探索 Event → Exploration
- 治療、疫病與生存 Event → Medicine

---

## 十四、Pirate Danger 與 Patrol

### Pirate Danger

每個 Region 有獨立 Pirate Danger。Pirate Danger 影響：

- 航行時觸發 Pirate Event 的機率
- Pirate Encounter 的敵方強度範圍
- Cargo Loss、船況損失與航行延誤風險

Pirate Danger 不會直接鎖死 Port 或 Trade Plan；它改變風險與期望損失。

### Trade Influence

頻繁航行與高價 Cargo 可以依資料規則增加 Pirate Danger。Danger 成長必須緩慢且有上限，避免 Patrol 變成每隔數分鐘必須繳交的維護稅。

### Patrol

MVP 海事 Action 只有：

```text
Region → Patrol
```

Patrol：

- 暫停 Trade Plan並占用主角 Fleet。
- 消耗時間、Food、Water、Ammunition 與必要修復。
- 使用共用 Combat System。
- 成功擊敗海盜後降低該 Region 的 Pirate Danger。
- 提供 Gunnery 與相關 Skill XP。
- 不增加 Port Mastery。
- 不增加 Guild XP。

---

## 十五、Trade Strategy

每份 Trade Plan 只有一個整體 Strategy。Strategy 影響所有航行段，不提供 per-Slot 設定。

初始 Strategy：

| Strategy   | 行為                                                            |
| ---------- | --------------------------------------------------------------- |
| Evasive    | 優先嘗試避開 Pirate Combat；依賴 Navigation，失敗後進入 Combat  |
| Balanced   | 依一般 Encounter 規則處理，不偏向追擊或逃避                     |
| Aggressive | 優先進入 Combat，提高 Ammunition 與 Repair 消耗，增加戰利品機會 |

Strategy 只影響 Event 與 Combat 路徑，不修改 Market Price。

---

## 十六、Combat

### 定位

Trade Pirate Event、Patrol 與 Expedition Pirate Encounter 共用同一套 Combat Resolver。

### Combat Stats

最小 Combatant 定義：

```text
Combatant
├── HP
└── Attack
```

Fleet HP 與 Attack 由船隻、裝備、Items、Gunnery、Repair 與 Event 修正，在 Combat 開始前計算完成。Combat Resolver 不直接理解船型或裝備名稱。

### Round Resolution

```text
while Player HP > 0 and Enemy HP > 0
  Enemy HP -= Player Attack

  if Enemy HP <= 0
    Victory
  else
    Player HP -= Enemy Attack

if Player HP <= 0
  Defeat / Forced Retreat
```

Attack 必須至少為 1，避免無限 Combat。戰鬥不包含命中、Defense、位置、技能按鈕或即時操作。

### Outcomes

| Context    | Victory                       | Defeat                                          |
| ---------- | ----------------------------- | ----------------------------------------------- |
| Trade      | 繼續航行，可能取得 Loot／Item | Cargo Loss、船況損失，視狀態繼續或停靠最近 Port |
| Patrol     | 降低 Pirate Danger            | Patrol 結束並返港                               |
| Expedition | 取得進展、繼續前進            | Expedition 撤退                                 |

Defeat 不摧毀永久裝備、不刪除 Save，也不造成角色死亡。

---

## 十七、Expedition

### 定位

Expedition 是完全手動操作的特殊行動，用於解鎖 Region。West Africa 是初始內容中唯一需要 Expedition 解鎖的 Region。

Expedition 不屬於 Trade Plan，不會自動循環。

### Preparation

玩家出發前配置：

- Fleet
- Goods
- Food
- Water
- Medicine
- Gunpowder & Ammunition
- Rope & Sails
- Items 與裝備

Goods 可以同時是途中 Event 的解法與終點交付需求。過度裝載交付 Goods 會壓縮 Supplies，形成 Expedition 的主要 Cargo 取捨。

### Progress

```text
開始 Expedition
→ 消耗 Supplies 前進
→ 觸發手動 Event 選擇
→ 進行 Navigation／Exploration／Medicine 判定
→ 遭遇 Pirate 時進入共用 Combat
→ 累積 Expedition Progress
→ 撤退或抵達終點
```

### Retreat

以下情況強制撤退：

- Fleet HP 歸零
- 關鍵 Supplies 歸零
- Event 明確要求撤退
- 玩家主動撤退

撤退時：

- 保留途中已取得的部分 Expedition Progress。
- 保留未被消耗或搶走的 Goods、Supplies 與 Items。
- 不完成終點交付。
- 不解鎖 Region。

### Completion

Expedition 完成需要：

- 抵達終點
- Fleet HP 大於 0
- 滿足終點要求
- 交付指定 Goods

完成後：

- 大量增加或直接完成 Expedition Progress。
- 解鎖對應 Region 與 Port。
- 允許開始累積新 Region 的 Port Mastery 與 Guild XP。
- 不直接增加其他 Region 的 Guild XP。

---

## 十八、Event 與 Item Drops

### Sailing Event

航行 Event 可以影響：

- Supplies 消耗
- Fleet HP
- Cargo Loss
- Market 或 Port 情報
- Skill XP
- Pirate Combat
- Item Drop

### Item Drop

Items 主要由 Sailing Event 隨機取得。掉落機率應依航程、危險度與 Event 難度計算，不依單純「完成航線次數」計算，避免刷最短航線成為唯一解。

關鍵 Expedition 完成物不得只依賴無保底的隨機掉落。隨機 Item 主要提供：

- Event 替代解法
- Combat 或 Expedition 優勢
- 額外收益
- 收藏價值

---

## 十九、資訊透明

### Market UI

玩家必須能看到：

- Specialty／General Section
- Goods Base Price
- Current Market Multiplier
- Quality Multiplier
- Current Buy／Sell Price
- Fleet 持有量
- Weighted Average Unit Cost
- 預估 Sale Profit
- 當前 Market Session 的 Net Trade

### Trade Plan UI

玩家必須能看到：

- 八個 Slot 與執行順序
- Fleet 當前位置與 Current Slot
- Strategy
- Operating Fund
- Cargo 與 Supplies
- 下一段航程
- Slot 被 Skip／Stop 的原因
- 最近一輪收入、成本、Cargo Loss 與 Net Profit

### Regional Guild UI

玩家必須能看到：

- Charter Requirements
- Guild XP 與 Effective Guild Level
- Region 內各 Port Mastery 貢獻
- Warehouse Capacity
- Workshop Production Lines
- 缺少的 Recipe Inputs
- Long-Term Supply 與 Transport Capacity

### Expedition UI

玩家必須能看到：

- Expedition Progress
- 距離下一個進展節點或終點的距離
- Fleet HP
- 五種 Supplies
- Cargo 與終點交付需求
- 目前 Event 與選項結果
- 撤退時可保留的進度

---

## 二十、初始實作範圍

### 包含

- 一支主角 Fleet
- Goods、三段 Quality、五類 Supplies 與 Items
- Cargo Unit 共用容量
- 五個 Region，其中 West Africa 鎖定
- 每個開放 Region 一個 Regional Hub
- Manual Buy／Sell／Store／Withdraw
- Market Session 與進港價格刷新
- Weighted Average Cost 與 Trade Profit 顯示
- 每個 Port 一條 Port Mastery
- Regional Guild Charter 與 Guild Lv.1–3
- Warehouse 與 Capacity Expansion
- Workshop 與多 Production Line Expansion
- 最多八格 Trade Plan
- Evasive／Balanced／Aggressive Strategy
- Pirate Danger
- Region Patrol
- 共用 HP／Attack Combat
- 一個解鎖 West Africa 的 Expedition
- Sailing Event Item Drops

### 不包含

- 多支 Fleet 同時運作
- 多 Regional Guild 共存於同一 Region
- 交易量改變市場價格
- 有限 Market Stock
- Bid／Ask Spread
- Workshop 自動從 Market 補料
- 玩家自訂 Route 條件與分支
- 獨立陸戰系統
- 完整戰術海戰
- 專門考古或 Item Farming Action

---

## 二十一、資料化數值

下列數值必須由內容資料控制，而非散落在 UI 或 Offline Resolver：

- Goods Base Price
- Quality Multiplier
- Port Specialty 與 Quality Distribution
- Market Multiplier Range
- Fleet Speed 與 Cargo Capacity
- Supplies Consumption
- Port Mastery Curve
- Commerce Port Mastery Bonus
- Guild XP Conversion
- Charter Threshold
- Guild Level Threshold
- Warehouse／Workshop Construction Cost
- Facility Expansion Cost
- Recipe Input、Output、Time 與 Cost
- Pirate Danger Growth／Reduction
- Enemy HP／Attack
- Patrol Duration 與 Reward
- Expedition Event、Progress 與 Completion Requirement
- Long-Term Supply Throughput
- Inter-Guild Transport Capacity

所有亂數結果必須由 Domain Resolution 產生並寫入 Save，確保在線、離線與重新載入使用相同結果。

---

_v4.0 product design baseline_
