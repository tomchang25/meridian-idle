# Sketch Standard

Sketch 是 Main Plan 與 Implementation Spec 之間的探索文件。它可以記錄 candidate implementation shape、目前 codebase evidence、risks 與 sequencing，但不是可直接執行的交付。

Sketch 的進入條件、略過條件與轉入 Spec 的 gate 由 `work_lifecycle.md` 定義。

當 child 即將實作時，必須依 `implementation_spec_standard.md` 重新驗證 live code。Sketch 中的 file、symbol 與 relationship 判斷全部是 provisional context，與 spec-time codebase read 衝突時以後者為準。

## Use this for

- Main Plan 中需要實作向探索的 non-trivial child。
- Durable design 已清楚，但 code movement、migration seam 或 ownership 尚需討論的切片。
- 有多個 candidate shapes，需要先排除錯誤方向再建立 spec 的工作。

不適用於：

- 最終實作交付；使用 Implementation Spec。
- Durable product intent；使用 Main Plan 或 GDD。
- 還沒有方向的問題備忘；留在 TODO Draft 並先討論。
- 小型 bug fix 或 chore。

## Required structure

標題下第一行必須是：

```md
Parent Plan: `<plan_filename.md>`
```

### 1. Goal

一至三句，說明這個 child 切片探索什麼、為什麼需要獨立拆出。

### 2. Summary

選用但建議使用。描述目前偏好方向、它解決的 seam、後續 spec 必須驗證的事與預期結果。

### 3. Sketch

允許：

- Candidate implementation shapes 與 trade-offs。
- 目前找到的 file paths、class/function names、fields 與 high-level call relationships。
- Risks、ownership seams、migration hazards 與 wrong shapes to avoid。
- 後續 spec 應驲證的 candidate files。

規則：

- 未在本次查閱中驗證的說法使用「likely」、「candidate」或「verify」。
- 若列檔案，heading 必須是 `Candidate files to inspect`，不得假裝是最終 Files to Change。
- 不寫可被 implementation agent 直接執行的指令。
- Requirements 由 parent plan 擁有，Sketch 不複製。

### 4. Non-Goals

編號清單。明確排除其他 children、future phase 或不屬於本 seam 的清理。

### 5. Acceptance Criteria

從 parent plan 切出這個 child 負責的可觀察結果，不寫 code coordinates。

## Decision and lifecycle rules

- Sketch 不保留 open questions。會改變產品行為或範圍的決策必須在交付 Sketch 前透過對話解決。
- Child sketch 命名為 `dev/docs/plans/<parent_scope>_<NN>_<slug>.sketch.md`，只由 parent overview 指向。
- 建立 spec 時，重新查閱 codebase。當 parent 改指 spec 後，active plans 不保留另一個可被誤當成交付的 sketch。
- Child 交付後封存 spec，並封存或刪除舊 sketch。

## Template

```md
# <Title>

Parent Plan: `<plan_filename.md>`

## Goal

<Slice and reason.>

## Summary

<Current favored direction and what the later spec must verify.>

## Sketch

- <Candidate shape, evidence, risk, or seam.>

### Candidate files to inspect

- `<path>`

## Non-Goals

1. <Explicit exclusion.>

## Acceptance Criteria

1. <Observable child outcome.>
```
