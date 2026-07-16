# Meridian Idle V5 — Automation and Logistics

> 狀態：Frozen extension design  
> 依賴：[V5 Core](meridian-idle_v5.md)

## 定位

Automation and Logistics 是玩家已理解手動貿易後，將重複工作交給組織、設施與固定運輸的未來擴充。它不屬於 V5 Core，不建立 runtime state、空 UI、save placeholder 或 active implementation plan。

恢復開發時，Core 的單 Fleet、Product、Market Session、Port Progression、Cargo、Financial Accounting 與 Voyage contract 仍是唯一基礎；extension 不得另造免費背景 Fleet、第二套價格或第二套 inventory accounting。

## 預定系統

### Regional Guild

每個 Region 最多一個 Regional Guild，設於指定 Regional Hub。Guild 是地區物流與自動化 owner，不取代 Port Level。

未來 Guild progression 可能控制：

- Automatic Trade Route 權限。
- Warehouse／Storage 建造與擴充。
- Workshop／Manufactory 建造與 Production Line。
- Long-Term Supply。
- Inter-Guild Transport。

V5 Core 不保存 Guild XP、Charter、Guild Level 或 facility state。未來門檻必須以當時 live Port Progression 與 economy 重新設計，不能直接沿用 V4 Guild XP conversion。

### Automatic Trade Route

預定方向是固定順序、有限 slot 的航行與交易清單，而不是玩家可程式化的條件系統。

可能的 action：

- Buy
- Sell
- Store
- Withdraw

自動 route 必須使用主角 Fleet、正式 Market Session、Specialty Supply、Supplies、Combat、Cargo Loss 與 Financial Accounting。玩家手動接管時 automation 暫停，不得在背景修改相同 Cargo。

### Warehouse and Storage

Warehouse 只存在於已建成 facility 的 Regional Hub：

- Capacity 使用 Cargo Unit。
- Store／Withdraw 不提供 Port XP。
- Product identity、quantity 與 cost basis 必須完整保存。
- Items 是否使用 Warehouse 需要恢復設計時決定。
- V5 Core 不提供任何遠端 storage。

### Workshop and Manufactory

Processing 將 Product 轉為其他 Product：

- Input 只來自當地 Warehouse。
- 不自動從 Market 補買材料。
- Output 回到當地 Warehouse。
- Processing Time、cost basis、line capacity 與 recipe 由資料控制。
- Quality Trade 若同時啟用，必須明確定義 Quality propagation。

`Workshop` 與 `Manufactory` 的最終分工尚未鎖定；恢復設計時應先決定兩者是 tier、不同 facility，或只保留一個正式名稱。

### Long-Term Supply and Inter-Guild Transport

成熟 Port progression 未來可以提供有限 throughput，而不是直接給玩家無限 Product：

- Long-Term Supply 將來源 Port Product 送到所屬 Regional Guild。
- Inter-Guild Transport 在已成立的 Guild 間搬運 Warehouse inventory。
- 兩者受來源 supply、目標 capacity、time 與 transport cost 限制。
- Regional Specialty 不應預設加入無限被動供應。

## Frozen decisions

以下決策在恢復前保持未定，不進入 Core：

- Guild unlock currency、level curve 與 Charter 是否存在。
- Automatic Route slot 數與 blocked behavior。
- Warehouse、Workshop、Manufactory 的建造與擴充成本。
- Automation 是否能使用有限 Specialty Supply。
- Processing recipe、production time 與 facility ownership。
- Long-Term Supply 與 Inter-Guild Transport 的 throughput economy。

## 非目標

- 不修改 V5 Core 的 Product pricing 或 Port Level。
- 不建立第二支免費 Fleet。
- 不以 frozen 文件授權任何 runtime implementation。
- 不在 Core save 中預留 optional Guild、Warehouse、Route 或 Production state。
