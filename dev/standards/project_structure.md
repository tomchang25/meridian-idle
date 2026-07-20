# Project Structure

## Top-level ownership

```text
app/                    route shell、metadata、global styles
game/domain/            Meridian-specific types、content contracts、pure rules
game/application/       commands、store orchestration、use cases
game/infrastructure/    browser and persistence adapters
game/features/          feature-owned UI、hooks、styles
game/shared/            Meridian 內跨 feature 共用的 UI
public/                 browser-served static assets
dev/                    non-runtime docs、standards、workflows、tools
tests/                  cross-boundary tests and shared fixtures
```

## `common` policy

目前不建立頂層 `common/`。真正能跨遊戲無修改使用的程式碼，在出現第二個 consumer 後抽成 package；Meridian-specific shared code 放 `game/shared/`。

不要因為兩個 feature 都使用某檔案，就把它包裝成跨專案 framework。

## Enforcement

以下的分層依賴規則由 ESLint 強制執行,違反會使 `npm run lint` 與 `npm run verify` 失敗:

- `game/domain` 不得 import 任何 UI framework,也不得 import 其他任何 layer。
- `game/application` 與 `game/infrastructure` 不得 import `game/features`、`game/shared` 或 `app`。Adapter 可以實作 application 擁有的 port contract,但不得反向呼叫 UI。
- `game/features` 不得直接 import `game/infrastructure` 或 `app`,必須經由 `game/application`。
- `game/domain`、`game/application`、`game/infrastructure` 的跨目錄 import 必須使用 `@/` alias,不得使用 `../`。同目錄 `./` 不受限。

Lint 失敗代表程式碼放錯位置。修法是依下方 Placement test 搬移程式碼,不是放寬規則。

## Placement test

- 是遊戲公式或狀態語意？放 `game/domain`。
- 是流程協調或 state mutation gateway？放 `game/application`。
- 直接接觸 browser API？放 `game/infrastructure`。
- 是某畫面的 component、hook 或 style？放 owning `game/features/<feature>`。
- 是多個 Meridian feature 的 presentation primitive？放 `game/shared`。
- 是 route、document metadata 或 global CSS？放 `app`。

Page-scale 或 feature-root component 必須和自己的 CSS module、tests、fixtures 盡量靠近，避免依 artifact type 建立巨大 `components/`、`hooks/`、`utils/` 資料夾。
