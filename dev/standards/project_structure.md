# Project Structure

## Top-level ownership

```text
src/app/                route shell、metadata、global styles
src/core/               Meridian-specific types、content contracts、pure rules
src/content/            authored world data（ports、routes、products、supplies）
src/runtime/            commands、store orchestration、use cases
src/platform/           browser and persistence adapters
src/ui/                 feature-owned UI、hooks、styles
src/shared/             Meridian 內跨 feature 共用的 UI（尚未建立）
src/presentation/       canvas renderers 與 event-driven timelines（尚未建立）
src/harness/            scenarios、fixtures、debug API（尚未建立）
public/                 browser-served static assets
worker/、db/、drizzle/   deployment 與 server 關注點，不屬於遊戲分層
dev/                    non-runtime docs、standards、workflows、tools
tests/                  cross-boundary tests and shared fixtures
e2e/                    browser acceptance tests
```

這套分層命名與姊妹專案 tickstrike-web 一致,兩邊共用同一組 placement 規則與邊界規則。`src/shared/`、`src/presentation/`、`src/harness/` 在擁有它們的工作實際發生前不預先建立空目錄。

## `common` policy

目前不建立頂層 `common/`。真正能跨遊戲無修改使用的程式碼，在出現第二個 consumer 後抽成 package；Meridian-specific shared code 放 `src/shared/`。

不要因為兩個 feature 都使用某檔案，就把它包裝成跨專案 framework。

## Enforcement

以下的分層依賴規則由 ESLint 強制執行,違反會使 `npm run lint` 與 `npm run verify` 失敗:

- `src/core` 與 `src/content` 不得 import 任何 UI framework。
- `src/core` 不得 import `runtime`、`platform`、`ui`、`shared` 或 `app`。
- `src/content` 只能依賴 core contract,不得 import `runtime`、`platform`、`ui`、`shared` 或 `app`。
- `src/runtime` 與 `src/platform` 不得 import `ui`、`shared` 或 `app`。Adapter 可以實作 runtime 擁有的 port contract,但不得反向呼叫 UI。
- `src/ui` 不得直接 import `platform` 或 `app`,必須經由 `runtime`。
- `core`、`content`、`runtime`、`platform` 的跨目錄 import 必須使用 `@/` alias,不得使用 `../`。同目錄 `./` 不受限。

`@/*` alias 指向 `src/`,宣告於 `tsconfig.json`、`vite.config.ts` 與 `vitest.config.ts` 三處,必須同步修改。

Lint 失敗代表程式碼放錯位置。修法是依下方 Placement test 搬移程式碼,不是放寬規則。

### 已知例外

`src/core` 目前**未**被禁止 import `src/content`:現行 rules 直接讀取 authored content 的查詢函式。將這個依賴反轉成「由外部把 content 傳進 rules」是行為性重構,由後續的 content-catalog 工作負責,不在 layout 遷移範圍內。在那之前這條限制刻意留空,而不是以抑制註解假裝滿足。

## Placement test

- 是遊戲公式或狀態語意？放 `src/core`。
- 是被創作出來的世界資料（某個港口、某條航線的數值）？放 `src/content`。
- 是流程協調或 state mutation gateway？放 `src/runtime`。
- 直接接觸 browser API？放 `src/platform`。
- 是某畫面的 component、hook 或 style？放 owning `src/ui/<feature>`。
- 是多個 Meridian feature 的 presentation primitive？放 `src/shared`。
- 是 route、document metadata 或 global CSS？放 `src/app`。

Page-scale 或 feature-root component 必須和自己的 CSS module、tests、fixtures 盡量靠近，避免依 artifact type 建立巨大 `components/`、`hooks/`、`utils/` 資料夾。
