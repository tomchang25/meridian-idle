# Project Structure Addendum

Canonical repository layout, root vocabulary, source layers, import boundaries, and the placement test are owned by `dev/foundation/platforms/web-react/standards/project_structure_standard.md`. This addendum records only Meridian's deltas and project-owned trees. Do not restate the shared standard here.

## Project-owned root trees

以下 root trees 位於遊戲分層詞彙之外：

```text
index.html              Vite entry；載入 src/app/main.tsx
public/                 需要 stable URL 的靜態資產（favicon 等）
```

`public/` 的使用符合 shared standard 的 stable-URL 保留規則；一般遊戲內容仍走 `src/` 的 owning layer。Production build 由 plain Vite 產出至 `dist/`（靜態 client bundle，無 server 或 worker 產物）。

## Earned layers 現況

`src/shared/` 與 `src/presentation/` 尚未 earned，在擁有它們的工作實際發生前不建立。`src/harness/` 以 `?scenario=` 載入預置世界並提供可控時鐘；只有 route shell（`src/app`）可以接線 harness。

## `common` policy

不建立頂層 `common/`。真正能跨遊戲無修改使用的程式碼，在出現第二個 consumer 後抽成 package；Meridian-specific shared code 屆時放 `src/shared/`。不要因為兩個 feature 都使用某檔案，就把它包裝成跨專案 framework。

## Boundary enforcement delta

分層 import 邊界由 ESLint 強制執行（rules 定義於 `eslint.config.mjs`），違反會使 `npm run lint` 與 `npm run verify` 失敗。因此 shared command surface standard 的 lint stage 與 boundary-check stage 在 Meridian 共用同一個 ESLint 指令；boundary 規則的 prose 與 `eslint.config.mjs` 必須在同一個 change 內同步修改。

`@/*` alias 指向 `src/`，宣告於 `tsconfig.json`、`vite.config.ts` 與 `vitest.config.ts` 三處，必須同步修改。
