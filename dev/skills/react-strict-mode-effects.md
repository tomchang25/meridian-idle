# React Strict Mode Effects

React development mode 可能重複 mount、cleanup 再 mount effect，用來暴露不安全 side effects。不要用「只讓 effect 執行一次」的 flag 遮掩問題；讓 effect 可重複執行且 cleanup 完整。

## Hazard

- Effect 裡直接發放 reward、扣除資源或寫入 save，重跑時會產生雙倍 mutation。
- Timer、subscription、event listener 或 async callback 沒有 cleanup，會留下重複 owner。
- 使用 module/global `didRun` flag 會在 remount、test isolation 或多個 component instance 之間泄漏。

## Safe shape

1. Gameplay mutation 由 explicit application command 觸發，不由 render/effect 的存在本身觸發。
2. Effect 只協調 external system；每次 setup 都回傳對稱 cleanup。
3. Async work 使用 AbortController、request identity 或 disposed flag 拒絕 stale completion。
4. Autosave 以 state revision/checkpoint 去重，不以 effect invocation count 當成 transaction identity。
5. Tests 在 Strict Mode 下驗證 subscription 數量、cleanup 與 mutation 只發生一次。

## Review prompts

- Remount 後是否會重複 reward、timer 或 persistence write？
- 舊 async result 是否可以覆寫較新 state？
- Cleanup 是否移除同一個 listener/subscription identity？
