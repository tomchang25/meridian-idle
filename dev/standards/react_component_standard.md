# React Component Standard

- Feature component 放在 `game/features/<feature>`，style 與測試靠近 owner。
- Server component 為預設；需要 state、effect 或 browser API 時才加入 `"use client"`。
- Component 負責 rendering 與 interaction wiring，不負責遊戲公式。
- Props 使用具名 type；避免 `any`、boolean flag explosion 與不透明的 `Record<string, unknown>`。
- 重複兩次不代表需要抽象；只有共享語意穩定後才移到 `game/shared`。
- 列表 key 使用 stable domain id，不使用 index。
- Effect 必須具備 cleanup，並處理 Strict Mode 重跑。
