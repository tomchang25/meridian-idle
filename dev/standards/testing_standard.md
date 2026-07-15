# Testing Standard

## Layers

- Domain tests：公式、unlock、offline、migration；快且不使用 DOM。
- Application tests：commands、transaction、save scheduling。
- Component tests：可見資訊、disabled state、keyboard-accessible interaction。
- Build smoke：production bundle 可以生成與啟動。

## Rules

- 對時間、亂數、storage 使用 explicit input 或 adapter。
- 測試 observable behavior，不鎖死 component implementation details。
- 每個 bug fix 至少包含一個在修正前會失敗的 regression test。
- Snapshot test 不能取代對重要文字、狀態與互動的 assertion。
