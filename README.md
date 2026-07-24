# Meridian Idle

Meridian Idle 是以大航海時代為背景的 Web-first 增量遊戲。玩家培養一名永久船長，透過 Knowledge、Captain Skill、Action Mastery、船隻、副官與遠征逐步開拓世界。

## Stack

- React 19 + TypeScript
- Vite（plain SPA）
- CSS Modules
- IndexedDB device-local saves
- Vitest + React Testing Library
- 桌面 Web；未來可打包為 Tauri

## Start

```powershell
npm install
npm run dev
```

開啟 `http://localhost:3000/`。

## Verification

```powershell
npm run verify
```

這會依序執行 Prettier format check、TypeScript、ESLint、Vitest 與 production build。

需要主動格式化整個 repository 時執行：

```powershell
npm run format
```

VS Code 使用者可以透過 `Terminal: Run Task` 執行相同的開發與驗證指令；`Verify` 是預設 build task。

## Structure

```text
index.html              Vite entry
src/app/                App 進入點（main.tsx）、composition root 與全局 CSS
src/core/               無 UI、可獨立測試的遊戲規則與狀態型別
src/content/            被創作的世界資料（ports、routes、products、supplies）
src/runtime/            use cases、store orchestration、commands
src/platform/           IndexedDB 與 browser adapters
src/ui/                 功能 UI 與 feature-local components
public/                 favicon 等靜態資產
dev/                    Web 專屬規範、工作流程與設計文件
test/unit/              跨模組與 rendering tests
test/e2e/               Browser acceptance tests
```

結構遵循 `dev/foundation/platforms/web-react/standards/project_structure_standard.md`，分層命名與姊妹專案 tickstrike-web 一致。`@/*` alias 指向 `src/`。

詳細規則見 [dev/README.md](dev/README.md)。
