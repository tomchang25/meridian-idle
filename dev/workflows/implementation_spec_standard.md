# Implementation Spec Standard

Implementation Spec 是唯一可直接執行的實作交付。它在即將實作時才根據 live codebase 建立，定義要修改的 ownership、relationships、files、landing order、edge cases 與驗收結果。

Spec 的進入、批准、實作、verification 與 closeout transition gates 由 `work_lifecycle.md` 定義。

Spec 不是 Main Plan 也不是 Sketch：

- Main Plan 擁有 durable product/design intent。
- Sketch 探索 candidate implementation shape，但不是執行權威。
- Spec 最後撰寫，必須重新驗證 current code，並可取代 sketch 中已過時的判斷。

## Lifecycle routes

- 小型 feature request → standalone Implementation Spec。
- Main Plan → Child Sketch → Child Implementation Spec。
- 邊界已小且明確的 plan child 可略過 Sketch，但不可略過 codebase verification。

## Decision gate

寫檔前必須：

1. 讀取 source request、parent plan 與 sketch（若有），擷取已確定的 requirements、non-goals 與 acceptance criteria。
2. 獨立查閱 live code，追蹤 state owner、call direction、data flow、persistence、UI states、error recovery 與 tests。
3. 實作架構選擇由 spec author 依已確定行為與 codebase constraints 解決，不將 file placement、API shape 或 test placement 不必要地丟回給使用者。
4. 若仍有選擇會改變玩家可見行為、產品範圍、compatibility promise 或數值語意，停止撰寫並先取得使用者決定。
5. Spec 不得包含 open questions。

## Required structure

標題下第一行必須是：

```md
Parent Plan: `<plan_filename.md>`
```

Standalone spec 使用：

```md
Parent Plan: none (standalone spec)
```

### 1. Goal

一至三句。對 plan child 而言，從 parent goal 壓縮出這一切片的目的，不放實作細節。

### 2. Summary

人類 review 與批准界面。使用短段落、具體標籤的 bullets 或 compact table，讓讀者能判斷：

- 為什麼要改。
- 哪些行為或契約會改變。
- 大致如何落地。
- 交付後可觀察到什麼。

Summary 只壓縮後文，不能藏著未在正文出現的限制。

### 3. Requirements (standalone only)

只有 standalone spec 寫 requirements。Plan child 由 parent plan 擁有 requirements，不在 spec 複製。

### 4. Relational Context

使用單層 bullet list。必須列出本次 blast radius 內所有被觸及的 system relationships，包括：

- Call direction：誰呼叫誰，讀或寫。
- State ownership：哪個 owner 是唯一 mutation authority。
- Changed integration contract：before → after。
- Save envelope、schema version、migration、hydration 與 recovery 影響。
- Selectors 與 rendered states，包含 loading、empty、locked、error、responsive 與 keyboard/accessibility behavior。
- Persistence、browser API 與 UI presentation 之間的邊界。
- Wrong shapes to avoid：容易被寫錯的耦合方式。

邊界是「本次變更影響的關係」，不是「只列不明顯的關係」。

### 5. Scope

#### Included

簡短列出本 spec 負責的交付項。

#### Excluded

簡短列出容易 scope bleed 但已排除的項目。

### 6. Files to Change

| File     | Change Size            | Purpose                    |
| -------- | ---------------------- | -------------------------- |
| `<file>` | Small / Medium / Large | 此檔在本次改動中負責的結果 |

這是 ownership 與影響範圍表，不是 line-by-line edit recipe。

### 7. Execution Outline

使用編號清單列出建議 landing order。每步是一個可 review 的 implementation beat，並在順序重要時說明原因。測試、migration、移除舊路徑與驗證應位於同一安全順序。

### 8. Implementation Notes

只寫 implementation agent 容易判斷錯誤的決策、hazards 與 non-obvious branching。不重複 live code 已清楚表達的邏輯，不寫逐行指令。

### 9. Edge Cases

| Case     | Expected Handling               |
| -------- | ------------------------------- |
| `<case>` | `<observable or state outcome>` |

沒有有意義 edge case 時可略過。

### 10. Verification

列出需要更新或新增的 tests，以及交付前必須執行的 focused checks 與 repository verify。

### 11. Acceptance Criteria

編號清單。只寫可觀察行為、compatibility、recovery 與 edge outcomes，不包含 file paths 或 function names。

## Lifecycle

- Standalone spec 放在 `dev/docs/plans/<scope>_<description>.implementation_spec.md`，並在 TODO Active 或 Plan 保留一行指針。
- Child spec 放在 parent plan 旁，由 child overview 指向，不另建 TODO 條目。
- 從 sketch 建立 spec 時，重新查閱 codebase，移除已過時內容；不保留兩個 active executable handoffs。
- 交付後依 Closeout workflow 封存 spec，移除 TODO 或 parent child pointer，並更新 CHANGELOG。

## Template

```md
# <Title>

Parent Plan: `<plan_filename.md>`

## Goal

<Capability and reason.>

## Summary

<Human approval surface.>

## Relational Context

- <Every touched system relationship.>

## Scope

### Included

- <Included work>

### Excluded

- <Excluded work>

## Files to Change

| File     | Change Size            | Purpose   |
| -------- | ---------------------- | --------- |
| `<file>` | Small / Medium / Large | <Purpose> |

## Execution Outline

1. <Reviewable implementation beat.>

## Implementation Notes

<Hazards and non-obvious decisions only.>

## Edge Cases

| Case     | Expected Handling |
| -------- | ----------------- |
| `<case>` | `<handling>`      |

## Verification

- <Focused and repository checks.>

## Acceptance Criteria

1. <Observable outcome.>
```
