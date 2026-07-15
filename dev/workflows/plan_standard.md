# Plan Standard

Implementation plan 應描述可驗證的結果，不只列檔案：

1. 目前行為與問題邊界。
2. State ownership 與資料流影響。
3. Persistence / migration 影響。
4. UI、responsive、accessibility 影響。
5. Tests 與 build 驗證。

每一步只能有一個明確 owner，避免同一 state 同時由 component 與 store 修改。
