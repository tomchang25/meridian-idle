# Plan Standard

Main Plan 是中大型 feature 的穩定設計文件，負責定義「要建立什麼、為什麼存在、玩家或系統將如何觀察它」。Main Plan 不是實作交付，不指定檔案、class、function 或 wiring；這些會變動的 code coordinates 由實作前才建立的 Implementation Spec 負責。

Main Plan 在整體 work lifecycle 中的進入、child 轉移與 closeout gates 由 `work_lifecycle.md` 定義。

適用於：

- 需要多個 reviewable slices 的 feature。
- 影響產品規則、多個 architecture layers 或 persistence contract 的改動。
- 實作後仍值得保留設計意圖的工作。

不適用於單檔小修正、明確 bug fix 或純 config 變更；這些可以直接建立 standalone Implementation Spec 或 compact implementation note。

## Required structure

### 1. Goal

一至三句。說明新能力、它解決的缺口與存在理由。

### 2. Requirements

編號清單。每項是可觀察的功能、限制或保留契約。非直覺決策的原因寫在同一項，不另建 rationale section。

### 3. Design

依 feature 複雜度建立子節。允許：

- 機制、state transitions 與行為規則。
- 公式、thresholds、tables 與 worked examples。
- 玩家可見 flow、fallback 與 compatibility expectations。
- Child overview 與 recommended landing order。

禁止：

- File paths、line numbers、function names、class names 或 code snippets。
- 只是假設將來會需要的 abstraction。
- 已排除於本 feature 以外的 future phase 細節。

### 4. Non-Goals

編號清單。排除容易在實作時被順便塞入的領域。

### 5. Acceptance Criteria

編號清單。只寫可觀察的完成結果、compatibility、edge behavior 與 fallback，不寫 test filenames 或實作 symbol。

## Child decomposition

當 Main Plan 太大，無法以一個 reviewable change 交付時：

1. 在 Design 內建立 child overview table，列出 child number、focus 與 current document。
2. 非小型 child 通常先建立 `<parent_scope>_<NN>_<slug>.sketch.md`。邊界已小且明確時可略過 sketch。
3. Child 只有在建立 `<parent_scope>_<NN>_<slug>.implementation_spec.md` 後才可直接實作。
4. Spec 在該 child 即將實作時才撰寫，並必須重新驗證當前 live code；不從舊 sketch 直接晉級內容。
5. Requirements 只屬於 Main Plan。Child sketch/spec 只切出相關邊界，不複製另一份 requirements source of truth。
6. Child 只由 parent overview 指向，不在 `TODO.md` 建立獨立條目。
7. Child 交付後從 overview 移除，將 spec/sketch 封存，並依 Closeout workflow 更新 CHANGELOG。

## Document rules

- 整份文件使用繁體中文或英文，同一文件保持一致；identifiers 保留實際英文。
- 不加 `Status: Done` 或 completed checklist。進行狀態由 `TODO.md` 位置表示，完成歷史由 CHANGELOG 擁有。
- 不將 child spec 內的 code coordinates 回填到 Main Plan。
- 只描述當前 feature boundary，延後工作留在 TODO 或另一份 plan。

## Template

```md
# <Title>

## Goal

<Capability, reason, and current gap.>

## Requirements

1. <Behavioral requirement; include why inline when non-obvious.>

## Design

<Rules, flows, formulas, examples, and child overview when needed. No code coordinates.>

## Non-Goals

1. <Explicit exclusion.>

## Acceptance Criteria

1. <Observable completion outcome.>
```
