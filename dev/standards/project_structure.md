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

## Placement test

- 是遊戲公式或狀態語意？放 `game/domain`。
- 是流程協調或 state mutation gateway？放 `game/application`。
- 直接接觸 browser API？放 `game/infrastructure`。
- 是某畫面的 component、hook 或 style？放 owning `game/features/<feature>`。
- 是多個 Meridian feature 的 presentation primitive？放 `game/shared`。
- 是 route、document metadata 或 global CSS？放 `app`。

Scene-style component 必須和自己的 CSS module、tests、fixtures 盡量靠近，避免依 artifact type 建立巨大 `components/`、`hooks/`、`utils/` 資料夾。
