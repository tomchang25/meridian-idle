# Web Platform Standard

- 支援最新版 Chromium、Firefox、Safari 與 Edge。
- Responsive layout 的實際結構由目前 product/layout design 決定；standard 只要求 desktop、tablet 與 mobile 不遺失內容或核心操作。
- PWA service worker 只在 production 註冊，development 不快取 HMR 資源。
- 不假設 background timer 精準；恢復頁面時以 wall-clock timestamp 重算。
- 所有 browser API 在使用前做 capability check。
- 避免把大型遊戲資料放進 localStorage；正式 save 使用 IndexedDB。
- Offline cache version 必須可清理舊 cache。
