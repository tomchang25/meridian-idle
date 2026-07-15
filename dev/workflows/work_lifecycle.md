# Work Lifecycle

本文件是 forward work 從想法進入實作、驗證與封存的唯一 lifecycle owner。Plan、Sketch、Implementation Spec 與 Closeout standards 各自定義 artifact 的內容與品質；`dev/docs/README.md` 定義 tracking 位置。其他文件可以指向本流程，不另行建立競爭的完整狀態機。

## Canonical flow

中大型、需要切片的 feature 使用：

```text
TODO Draft
→ Main Plan
→ Child Sketch
→ Child Implementation Spec
→ Implementation
→ Verify
→ Child Closeout
→ next child or Main Plan Closeout
```

Sketch 是 non-trivial child 的預設探索階段，但不是強制形式關卡。當 child 的產品邊界、ownership seam 與實作影響都已小且明確時，可以從 Main Plan 直接建立 Child Implementation Spec。

小型但仍橫跨多個 architecture layers 的工作使用：

```text
Feature request or TODO item
→ Standalone Implementation Spec
→ Implementation
→ Verify
→ Standalone Closeout
```

單檔、純 config、文案或邊界明確的 bug fix 可直接實作，並使用 compact implementation note 記錄必要契約。這不取消 tests、verification 或 closeout 要求。

## Transition gates

### TODO Draft → Main Plan

當一個 Draft 需要子結構、明確順序、多個可 review 切片或穩定連結時：

1. 依 `plan_standard.md` 建立 Main Plan。
2. 將 Draft 內容移入 Plan，不保留兩份 requirements source of truth。
3. 從 TODO Draft 刪除該 section，在 TODO Plan 留一行指針。

Main Plan 進入 queued state 前，Goal、Requirements、Non-Goals、Acceptance Criteria 與必要 child overview 必須完整，且不能尚有會改變產品範圍的未決問題。

### Main Plan → Child Sketch

當 child 的 durable behavior 已由 Main Plan 確定，但 candidate code shape、migration seam、ownership 或 landing boundary 仍需要探索時：

1. 依 `sketch_standard.md` 建立 sibling Sketch。
2. Parent child overview 指向 Sketch，Child 不建立獨立 TODO 條目。
3. Sketch 可以記錄 provisional codebase context，但不取得 implementation authority。

若 child 邊界已經小且明確，可略過此轉移，直接進入 codebase-verified Spec。

### Sketch → Implementation Spec

當 child 已是下一個要實作的切片，且所有玩家可見行為、數值語意、compatibility promise 與 scope 決策已鎖定時：

1. 依 `implementation_spec_standard.md` 從 live codebase 重新建立實作模型。
2. Sketch 只是 context；Spec author 驗證或取代每個 file、symbol、relationship 與 sequencing 判斷。
3. Parent child overview 改指 Spec。Active plans 不同時保留兩個可被誤當為 executable handoff 的文件。

Spec 不包含 open questions。若 live code 暴露會改變已確定產品行為的衝突，停止並回到使用者決策，而不在 Spec 中靜默改寫 Plan。

### Implementation Spec → Implementation

只有在以下條件都成立時才開始程式變更：

- Spec Summary 已是可 review 的 approval surface。
- Relational Context 覆蓋 Files to Change blast radius 內的 ownership 與 call direction。
- Scope、migration、error recovery、UI/accessibility、edge cases 與 verification 已無未決問題。
- Parent plan 或 TODO 只指向這份 executable handoff。

實作期間若 codebase 現況與 Spec 有局部差異，可在不改變 approved behavior 的前提下修正實作細節。若差異會改變 requirements、scope 或 compatibility，停止並回到 Plan/Spec decision gate。

### Implementation → Verify

實作完成不等於交付完成。在 closeout 前：

1. 執行 Spec 定義的 focused tests 與 migration/browser/UI checks。
2. 依 `agent_rules/lint_before_finish.md` 執行 repository-required verification。
3. 失敗時回到 Implementation，修正後重新執行受影響 checks。
4. 只有在 acceptance criteria 與要求 checks 通過，或未驗證項目已取得使用者接受時，才可進入 Closeout。

### Verify → Child Closeout

依 `closeout.md` 執行：

- 將可觀察交付結果記錄於 CHANGELOG。
- 從 parent child overview 移除已交付 child。
- 封存 Spec，並封存或刪除舊 Sketch。
- Parent Main Plan 仍有 child 時，回到下一個 child 的 Sketch 或 Spec gate。

### Child Closeout → Main Plan Closeout

當 Main Plan 已無未交付 children，而且所有 acceptance criteria 都由 shipped behavior 滿足時：

1. 將需要長期保留的 current contract 寫入 evergreen system docs（若需要）。
2. 封存 Main Plan。
3. 從 TODO Active/Plan 移除指針。
4. 不保留 Done list；shipped history 只由 CHANGELOG 擁有。

## Review position

Review 是可在 Main Plan、Sketch、Spec 或 code change 上執行的 quality activity，不是另一個必然的 tracking state。當使用者要求 review，依 `review_standard.md` 以 read-only 方式執行；只有明確要求修正時才回到對應 artifact 或 Implementation 進行修改。

## Operational commands

Artifact standards 定義「正確的產物長什麼樣子」；`commands/` 定義「如何安全執行這個操作」。

| Operation                             | Command contract               | Mutation boundary           |
| ------------------------------------- | ------------------------------ | --------------------------- |
| 擷取 focused codebase context         | `commands/research-context.md` | Read-only                   |
| 解決 Spec 前 user-authority decisions | `commands/spec-discuss.md`     | Read-only                   |
| 建立 codebase-verified Spec           | `commands/spec-build.md`       | Documentation/tracking only |
| 審查 Git index snapshot               | `commands/stage-review.md`     | Read-only                   |
| 執行 Child/Flow Closeout              | `commands/closeout.md`         | Documentation/tracking only |
| 產生 staged commit message            | `commands/commit-msg.md`       | Read-only                   |
| 審查 branch 並撰寫 PR text            | `commands/pr-review.md`        | Read-only                   |

這些文件是 operational contracts，不是可執行 shell scripts 或自動註冊的 client commands。使用者以 command 名稱或同義請求觸發時，agent 必須讀取對應 contract。

## Tracking states

- TODO Draft：討論中，尚未擁有 standalone Plan。
- TODO Plan：Main Plan 已存在，但尚未是當前執行 flow。
- TODO Active：當前正在建立 child handoff、實作或驗證。
- TODO Chore/Bug：不需要 Main Plan 的單行工作。
- CHANGELOG：唯一 shipped history。
- `dev/docs/archived/`：已完成或被取代的交付文件，不再是 active authority。

Tracking 位置與檔案命名的詳細規則由 `dev/docs/README.md` 擁有。
