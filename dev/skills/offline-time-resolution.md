# Offline Time Resolution

Browser timers 在 background、suspend 或關閉頁面後不可信。Offline progression 不應補跑遺失的 interval callbacks，而應從 persisted timestamp 與 persisted operation snapshot 計算 elapsed outcome。

## Hazard

- 以 `setInterval` tick count 當成遊戲時間，background throttling 後進度過少。
- Online 和 Offline 使用兩套 resolver，相同期間得到不同 reward、loss 或 event order。
- Pure domain rule 直接讀 `Date.now()` 或呼叫 random global，使 tests 無法重現。
- System clock 往回調整產生負 elapsed time 或無上限 reward。

## Safe shape

1. Application layer 取得 `now`，domain resolver 只接收 explicit timestamps、content 與 persisted operation state。
2. Online heartbeat、visibility resume、reload hydration 與 offline return 全部呼叫同一 resolver。
3. Elapsed time 使用 `max(0, now - lastResolvedAt)` 並應用明確 offline cap。
4. Resolver 回傳結構化 result 與新 state，UI 只決定如何顯示。
5. 有 RNG 時保存 seed 或已決定 event inputs，使相同 snapshot 可 deterministic replay。
6. Tests 比較一次解算整段時間、多次小段解算與 save/reload 中斷的結果。

## Review prompts

- 不同進入點是否共用同一 state transition？
- `lastResolvedAt` 何時更新，失敗時是否可能重複結算？
- Cap、rounding 與 event order 是否有可觀察定義與 tests？
