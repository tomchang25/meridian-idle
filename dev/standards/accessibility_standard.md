# Accessibility Standard

- 使用語意化 landmark：`header`、`nav`、`main`、`aside`、`section`。
- 所有互動使用原生 `button`、`a`、`input`，不要用 clickable `div`。
- 鍵盤操作必須可達，focus indicator 不得移除。
- 不以顏色作為唯一狀態訊號。
- 動畫遵守 `prefers-reduced-motion`。
- Action locked、running、selected 等狀態需提供文字或 ARIA state。
- 最小觸控目標與文字對比在 mobile layout 一併驗證。
