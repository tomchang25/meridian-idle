# Meridian Idle V5 — Quality Trade

> 狀態：Frozen extension design  
> 依賴：[V5 Core](meridian-idle_v5.md)

## 定位

Quality Trade 是未來加入同 Product 不同品質、稀有交易機會與加工品質傳遞的擴充。V5 Core 每個 Product ID 只有一個 inventory stack，不保存 Quality distribution 或 Quality-specific cost basis。

Regional Specialty 與 Quality 是不同概念：

- Regional Specialty 是 Core 中具有 origin Port／Region 與 transport bonus 的獨立 Product。
- Quality 是未來套在 Product stack 上的品質層。

Faro Pig 可以是 Regional Specialty；未來若啟用 Quality，它才可能再分為 Standard Faro Pig、Fine Faro Pig 或 Exceptional Faro Pig。

## 候選 Quality Tiers

| Quality     | 定位                         |
| ----------- | ---------------------------- |
| Standard    | 一般市場與基礎生產的主要品質 |
| Fine        | 低比例高價值品質             |
| Exceptional | 稀少、高階交付或特殊用途     |

Quality 未來可能影響：

- Market Reference Value。
- Buy acquisition outcome。
- Cargo identity 與 cost basis。
- Sale preview 與 Port XP ledger。
- Expedition／contract requirement。
- Automation processing input 與 output。

## Integration constraints

- Quality acquisition 必須明確決定玩家選擇或 deterministic distribution，不得由 UI 隨機抽取。
- 同一 Product 不同 Quality 必須有獨立 quantity 與 cost basis。
- Buy affordability、Cargo capacity 與 actual acquired Quality 必須原子結算。
- Market Session 必須保存足以防止 reload 重抽的 Quality outcome 或 RNG state。
- General Product、Regional Specialty 與 Quality modifier 的計算順序必須唯一。
- Port XP 必須避免同一 Product 不同 Quality 被錯誤互相抵銷。

## Frozen decisions

- Quality distribution 是 listing 固定、每次購買抽取，或有限 lot。
- Quality price multipliers。
- Exceptional 的保底機制。
- Quality 是否影響 Specialty Supply 20／40 Units。
- Processing 的 input threshold 與 output Quality rule。

## 非目標

- 不在 V5 Core save 中加入 Quality 欄位。
- 不把 Regional Specialty 當成 Fine／Exceptional 的替代名稱。
- 不以無保底 Exceptional drop 鎖住必要 Region progression。
