# Meridian Idle V5 — Skills

> 狀態：Frozen extension design  
> 依賴：[V5 Core](meridian-idle_v5.md)

## 定位

Skills 是未來的全局永久能力成長層，用來放大玩家已在 Core 中理解的決策，而不是替代 Product、Port Level、Supplies、Combat 或 Expedition。V5 Core 不保存 Skill、Skill XP、modifier 或 placeholder UI。

## 候選 Skill Set

| Skill       | 未來可能影響                                                    |
| ----------- | --------------------------------------------------------------- |
| Commerce    | 商業委託、Port XP gain 或 trade event；不直接改寫 Market Factor |
| Navigation  | Voyage event、route stability 與 Supplies efficiency            |
| Crafting    | Automation and Logistics 的 processing 與 recipe                |
| Gunnery     | Fleet Attack、Pirate Combat 與 Patrol                           |
| Repair      | Repair cost、Fleet recovery 與事故 outcome                      |
| Exploration | Expedition progress 與 exploration event                        |
| Medicine    | Expedition survival、treatment 與 disease event                 |

### Growth principle

Skill XP 必須來自與用途一致的行為：

- Trade／commercial event → Commerce
- Voyage／navigation event → Navigation
- Processing → Crafting
- Combat → Gunnery
- Repair／condition event → Repair
- Expedition progress → Exploration
- Treatment／survival event → Medicine

被動等待、reload、重播同一 persisted result 或沒有實際 cost／risk 的零時間 action 不提供 Skill XP。

## Integration constraints

- Market Session 的 Category Factor 與 Sale Modifier 在沒有明確產品決策前不受 Skill 改寫。
- Skill modifier 必須作用於 canonical resolver，不能只修改 UI preview。
- Offline 與 online 使用相同 Skill snapshot 與 resolution order。
- 新 Skill state 需要獨立 save migration；Core 不預留空 record。
- Port Level 保持每 Port progression，Skills 保持全局 progression，兩者不互相取代。

## Frozen decisions

- Skill level curve、cap 與 XP formula。
- Commerce 是否增加 Port XP，以及 modifier 上限。
- Skill check、success chance 與 failure consequence。
- Equipment、Items 與 Skills 的 stacking order。
- 是否存在 respec、specialization 或 unlock tree。

## 非目標

- 不以 Skills 修補失衡的 Core price formula。
- 不讓 Skill 自動完成 Manual Trade 或 Expedition。
- 不在 V5 Core runtime 顯示 unavailable Skill panel。
