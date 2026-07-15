# Meridian Idle — Web Layout 設計文件

> 版本：layout v1.0  
> 目標平台：Web / React / TypeScript  
> 對應主設計：meridian-idle v3（單主角、無 Prestige / Reset、副官系統）

---

## 一、Layout 定位

### 核心畫面目標

本遊戲的主畫面應同時滿足三件事：

1. **讓玩家清楚知道目前正在掛什麼 Action**
2. **讓玩家快速理解自己下一個可推進目標**
3. **保留航海題材的氛圍，而不是變成純表格工具**

整體方向是：

```text
左側：長期狀態與導航
中上：Pixel 橫向氛圍場景
中下：Action 選擇主區
右側：目前 Action 詳情、判定、報酬與事件紀錄
```

### 設計語氣

```text
航海日誌
+
策略管理桌
+
Pixel 航行場景
+
Melvor-like 數值面板
```

不是全畫面 RPG，也不是純資料表格，而是「中間有一個小型航海世界正在運作，玩家主要透過下方 Action 與左右面板做決策」。

---

## 二、主畫面 Wireframe

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Top Bar：船長名 / 金幣 / 名聲 / 離線收益 / 設定 / 儲存狀態                  │
├───────────────┬──────────────────────────────────────────────┬───────────────┤
│ Left Sidebar  │ Scene Panel                                  │ Right Sidebar │
│               │                                              │               │
│ 船長摘要       │  Pixel 船隻 / 港口 / 遺跡 / 海戰橫向場景       │ 目前 Action    │
│ 船隻摘要       │                                              │ 進度條         │
│ 副官摘要       │  目前 Action 名稱                            │ 剩餘時間       │
│ 目前海域       │  地點 / 天氣 / 狀態                           │ 成功率         │
│               │                                              │ 大成功率       │
│ 主選單         │  ████████████░░░░░░ 64%                       │ 報酬預覽       │
│ - 海域         │                                              │ 判定拆解       │
│ - Knowledge    │ Action Panel                                 │ 副官支援       │
│ - Mastery      │                                              │ Event Log      │
│ - 副官         │ [海域 Tabs]                                  │               │
│ - 船隻         │ [全部] [商業] [探險] [航海] [海事] [遠征]      │               │
│ - 母港         │                                              │               │
│ - 遠征         │ ┌──────────────┐ ┌──────────────┐             │               │
│               │ │ 橄欖油貿易    │ │ 海峽探勘      │             │               │
│               │ │ 4m 30s        │ │ 8m 00s        │             │               │
│               │ │ 成功率 92%    │ │ 成功率 73%    │             │               │
│               │ │ Mastery 47    │ │ Mastery 12    │             │               │
│               │ │ [開始]        │ │ [開始]        │             │               │
│               │ └──────────────┘ └──────────────┘             │               │
└───────────────┴──────────────────────────────────────────────┴───────────────┘
```

---

## 三、桌機版 Layout 規格

### 建議尺寸

```text
Top Bar：56px
Left Sidebar：260px
Right Sidebar：320px
Scene Panel：220px ~ 300px
Action Panel：剩餘高度
Main Area 最小寬度：720px
```

### CSS Grid 草案

```css
.game-layout {
  display: grid;
  grid-template-columns: 260px minmax(720px, 1fr) 320px;
  grid-template-rows: 56px minmax(220px, 32vh) 1fr;
  height: 100vh;
  overflow: hidden;
}

.top-bar {
  grid-column: 1 / 4;
  grid-row: 1;
}

.left-sidebar {
  grid-column: 1;
  grid-row: 2 / 4;
  overflow-y: auto;
}

.scene-panel {
  grid-column: 2;
  grid-row: 2;
}

.action-panel {
  grid-column: 2;
  grid-row: 3;
  overflow-y: auto;
}

.right-sidebar {
  grid-column: 3;
  grid-row: 2 / 4;
  overflow-y: auto;
}
```

---

## 四、Top Bar

### 職責

Top Bar 只放全局資訊，不承擔主要操作。

```text
左側：遊戲名 / 船長名 / 目前 Rank
中間：金幣、名聲、主要資源
右側：離線收益、儲存狀態、設定
```

### 範例

```text
Meridian Idle | 卡洛斯 Lv.18 | 金幣 12,480 | 名聲 340 | 離線收益 2h 13m | Saved
```

---

## 五、Left Sidebar

### 定位

左側是「長期狀態與導航」。玩家看這裡應該知道：

```text
我是誰
我現在在哪
我的船如何
我的副官配置如何
我要去哪個系統頁面
```

### 區塊結構

```text
Captain Summary
Ship Summary
Officer Summary
Current Region Summary
Main Navigation
```

### Captain Summary

```text
船長：卡洛斯
Lv.18　地方航海士
主傾向：商業 / 探險

核心 Skill：
會計 42
社交 31
操帆 38
檢查 27
```

### Ship Summary

```text
小型卡拉維爾帆船
速度 42
載貨 80
耐久 100%
補給效率 +6%
```

### Officer Summary

```text
會計長：交易收益 +8%
翻譯官：希臘語 / 拉丁語
航海長：航行時間 -6%
```

### Main Navigation

```text
海域
Knowledge
Mastery
副官
船隻
母港
遠征
紀錄
設定
```

### 設計規則

- 左側不放 Action 開始按鈕。
- 左側不顯示過細的 EXP 條，避免資訊過載。
- 左側每個摘要都可以點擊進入完整頁面。
- 目前正在影響 Action 的項目可用小標記提示。

---

## 六、Scene Panel

### 定位

中上區域是氛圍展示，不是主要操作區。

它的職責是讓玩家感覺：

```text
我的船正在航行
我的角色正在行動
世界不是靜態表格
```

### 根據 Action 類型切換場景

| Action 類型 | Scene 表現                   |
| ----------- | ---------------------------- |
| 商業        | 港口、碼頭、搬貨、商人往來   |
| 探險        | 遺跡、森林、洞窟、角色前進   |
| 航海        | 船隻橫向航行、海浪、雲、海鳥 |
| 海事        | 雙船對峙、砲火、煙霧、海盜旗 |
| 遠征        | 大海圖、遠洋、特殊地標、風暴 |

### 場景上可顯示的資訊

```text
目前 Action 名稱
目前海域
剩餘時間
進度條
天氣 / 狀態標籤
```

### 範例

```text
┌────────────────────────────────────────────┐
│ 東地中海 — 海峽探勘                         │
│                                            │
│        ☁        ☁                          │
│                                            │
│              ⛵~~~~~~~                      │
│ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ │
│                                            │
│ ████████████░░░░░░  64%                    │
└────────────────────────────────────────────┘
```

### 設計規則

- Scene Panel 不要塞大量數值。
- 場景動畫純氛圍，不影響判定。
- 動畫狀態由目前 Action 類型與 Event 狀態決定。
- 沒有 Action 執行時，顯示港口待命或海圖畫面。

---

## 七、Action Panel

### 定位

Action Panel 是主操作區。玩家大部分決策都在這裡完成。

核心流程：

```text
選海域
→ 選 Action 類型
→ 比較 Action Card
→ 開始掛機
```

### 結構

```text
Region Tabs
Action Category Filter
Action Grid
```

### Region Tabs

```text
[西地中海] [東地中海] [北海] [黑海] [西非] [印度洋] [新大陸]
```

每個海域 Tab 可顯示簡要狀態：

```text
東地中海
Familiarity Lv.3
12 Actions
```

### Action Category Filter

```text
[全部] [商業] [探險] [航海] [海事] [遠征]
```

### Action Card：可執行狀態

```text
┌────────────────────────────┐
│ 橄欖油貿易                  │
│ 商業 / 東地中海              │
├────────────────────────────┤
│ 時間：4m 30s                │
│ 成功率：92%                 │
│ 大成功率：18%               │
│ 預期：金幣 480              │
│ EXP：貿易知識 +24           │
│ Mastery：47 / 99            │
├────────────────────────────┤
│ 下個節點：Lv.50 批發模式     │
│ [開始]                      │
└────────────────────────────┘
```

### Action Card：鎖定狀態

```text
┌────────────────────────────┐
│ 希臘遺跡發掘        🔒       │
│ 探險 / 東地中海              │
├────────────────────────────┤
│ 需要：考古學 Lv.20           │
│ 需要：地理學 Lv.10           │
│ 目前：考古學 Lv.16           │
├────────────────────────────┤
│ 解鎖後：發現物 / 名聲 / 遺跡  │
└────────────────────────────┘
```

### Action Card：執行中狀態

```text
┌────────────────────────────┐
│ 海峽探勘          執行中     │
│ 航海 / 東地中海              │
├────────────────────────────┤
│ ████████████░░░░ 64%        │
│ 剩餘：03:42                 │
├────────────────────────────┤
│ [查看詳情] [取消]            │
└────────────────────────────┘
```

### 設計規則

- 鎖定 Action 不要隱藏，應顯示缺少的門檻。
- 每張 Card 必須顯示時間、成功率、主要報酬、Mastery、下一節點。
- Card 上的資訊以「能幫助玩家選擇」為準，不顯示完整公式。
- 完整判定拆解放在 Right Sidebar。

---

## 八、Right Sidebar

### 定位

右側是「目前 Action 的詳細回饋」。

玩家看右側應該知道：

```text
我現在在做什麼
還要多久
成功率怎麼來
哪些 Knowledge / Skill / 副官 / 船隻正在發揮作用
這次獲得了什麼
剛剛發生了什麼 Event
```

### 區塊結構

```text
Current Action
Reward Preview
Check Breakdown
Officer Support
Event Log
```

### Current Action

```text
目前 Action：海峽探勘
海域：東地中海
類型：航海
進度：64%
剩餘：03:42
```

### Reward Preview

```text
預期報酬
金幣：120 ~ 180
地理學 EXP：+24
操帆 Skill EXP：+12
Action Mastery：+1
可能掉落：海圖碎片
```

### Check Breakdown

```text
成功率：73%
大成功率：9%

Base Score：42
- 地理學 Knowledge +15
- 操帆 Knowledge +8
- Action Mastery +12
- 船隻 Status +7

Roll Range：8 ~ 25
- 主角操帆 Skill 34
- Event Requirement 50
```

### Officer Support

```text
副官支援
航海長：航行時間 -6%
翻譯官：情報事件成功率 +4%
```

### Event Log

```text
[12:04] 開始：海峽探勘
[12:06] 遭遇順風：進度 +8%
[12:08] 發現暗礁：掌舵判定成功
[12:08] 掌舵 Skill +9 EXP
[12:09] 地理學 Knowledge +12 EXP
```

### 設計規則

- 右側不作為主要導航。
- Event Log 保留最近 20 ~ 50 筆即可。
- 判定拆解要能解釋成功 / 失敗原因。
- 完成 Action 時，右側應短暫高亮最新報酬。

---

## 九、彈窗與詳細頁

主畫面保持穩定，細節透過 modal / drawer 顯示。

### 適合用 Modal 的內容

```text
副官詳細資料
船隻改裝
Knowledge 完整列表
Mastery 節點樹
Action 詳細公式
遠征需求確認
離線收益結算
```

### 離線收益 Modal

```text
離線 2h 13m

完成 Action：海峽探勘 × 16
獲得金幣：2,880
地理學 EXP：+384
操帆 Skill EXP：+192
Action Mastery：+16
特殊事件：發現海圖碎片 ×1

[確認]
```

---

## 十、React Component 結構

```text
<AppShell>
  <TopBar />

  <LeftSidebar>
    <CaptainSummary />
    <ShipSummary />
    <OfficerSummary />
    <RegionSummary />
    <MainNav />
  </LeftSidebar>

  <MainArea>
    <ScenePanel />
    <ActionPanel>
      <RegionTabs />
      <ActionCategoryFilters />
      <ActionGrid>
        <ActionCard />
      </ActionGrid>
    </ActionPanel>
  </MainArea>

  <RightSidebar>
    <CurrentActionPanel />
    <RewardPreview />
    <CheckBreakdown />
    <OfficerSupport />
    <EventLog />
  </RightSidebar>

  <ModalHost />
</AppShell>
```

---

## 十一、TypeScript 型別草案

```ts
type ActionCategory = "trade" | "exploration" | "navigation" | "combat" | "expedition";

type ActionStatus = "available" | "locked" | "running";

type RewardType = "gold" | "fame" | "knowledgeExp" | "skillExp" | "masteryExp" | "item";

type RequirementType =
  "knowledgeLevel" | "skillLevel" | "masteryLevel" | "regionFamiliarity" | "officerLanguage" | "shipStat" | "item";

type GameAction = {
  id: string;
  name: string;
  regionId: string;
  category: ActionCategory;
  durationSec: number;
  masteryLevel: number;
  status: ActionStatus;
  unlockRequirements: Requirement[];
  rewards: RewardPreview[];
  nextMasteryNode?: MasteryNodePreview;
};

type CurrentAction = {
  actionId: string;
  startedAt: number;
  endsAt: number;
  progress: number;
  currentEventId?: string;
};

type Requirement = {
  type: RequirementType;
  targetId: string;
  requiredValue: number | string;
  currentValue?: number | string;
  isMet: boolean;
};

type RewardPreview = {
  type: RewardType;
  targetId?: string;
  label: string;
  minAmount?: number;
  maxAmount?: number;
};

type MasteryNodePreview = {
  level: number;
  label: string;
};

type CheckBreakdown = {
  successRate: number;
  greatSuccessRate: number;
  baseScore: number;
  baseSources: ScoreSource[];
  rollMin: number;
  rollMax: number;
  skillId: string;
  skillValue: number;
  eventRequirement: number;
};

type ScoreSource = {
  label: string;
  value: number;
  sourceType: "knowledge" | "skill" | "mastery" | "ship" | "officer" | "region";
};

type OfficerSummary = {
  id: string;
  name: string;
  role: OfficerRole;
  activeBonuses: string[];
  languages: string[];
};

type OfficerRole = "accountant" | "navigator" | "explorer" | "gunner" | "translator" | "surgeon";
```

---

## 十二、狀態管理切分

### UI State

```text
目前選擇海域
目前 Action 類型篩選
目前開啟的 Modal
Sidebar 折疊狀態
Action Card hover / selected 狀態
```

### Game State

```text
船長資料
船隻資料
副官配置
Knowledge 等級
Skill 等級
Action Mastery
Region Familiarity
目前執行中的 Action
背包 / 資源
Event Log
```

### Derived State

```text
Action 是否解鎖
Action 成功率
Action 大成功率
Action 報酬預覽
副官實際加成
船隻實際加成
下一個可達成節點
```

設計上，Action Card 與 Right Sidebar 應大量使用 derived selectors，避免在 component 裡重複計算規則。

---

## 十三、響應式設計

### Desktop

```text
三欄 Layout：左 Sidebar + 中央主區 + 右 Sidebar
```

### Tablet

```text
左 Sidebar 可折疊
右 Sidebar 改成可開合 Drawer
中央保留 Scene + Action Panel
```

### Mobile

```text
Top Bar
Scene Panel
Current Action Compact Panel
Action Panel
Bottom Navigation
```

手機版不建議硬塞三欄，應改成 bottom nav：

```text
[Action] [船長] [副官] [船隻] [紀錄]
```

---

## 十四、視覺層級

### 最重要

```text
目前 Action
剩餘時間
Action 可選項
成功率
解鎖缺口
```

### 次重要

```text
報酬預覽
Mastery 進度
副官支援
Knowledge / Skill EXP
```

### 輔助資訊

```text
完整判定公式
詳細 Event 歷史
完整 Knowledge 列表
完整副官數值
```

---

## 十五、避免的畫面方向

### 不要做成純表格

```text
Action 名稱 | 時間 | 收益 | EXP | 成功率 | 開始
```

這會失去航海感。

### 不要做成純 RPG 場景

```text
大畫面角色走路 + 少量按鈕
```

這會讓 idle / incremental 所需的資訊密度不足。

### 不要讓左右 Sidebar 都變成操作區

左右面板應該提供狀態與回饋。主要操作集中在中下 Action Panel。

---

## 十六、MVP 畫面範圍

第一版可以只做：

```text
Top Bar
Left Sidebar
Scene Panel
Action Panel
Right Sidebar
Action Card
Current Action
Event Log
Offline Reward Modal
```

暫時不需要完整做：

```text
副官詳細頁
船隻改裝頁
Knowledge 完整頁
Mastery 節點樹
母港建設頁
遠征完整流程
```

但主畫面要先保留入口，避免後續改版破壞 layout。

---

## 十七、核心結論

最適合本遊戲的 Web Layout 是：

```text
中上給航海氛圍
中下給 Action 決策
左側給角色 / 船 / 副官 / 導航
右側給目前行動 / 報酬 / 判定 / Log
```

這能同時保留 Melvor-like 的資訊清楚度，以及大航海題材需要的世界感。
