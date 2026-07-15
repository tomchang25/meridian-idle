# Meridian Idle

Meridian Idle 是以大航海時代為背景的 Web-first 增量遊戲。玩家培養一名永久船長，透過 Knowledge、Captain Skill、Action Mastery、船隻、副官與遠征逐步開拓世界。

## Stack

- React 19 + TypeScript
- Vite / Vinext
- CSS Modules
- IndexedDB device-local saves
- Vitest + React Testing Library
- Cloudflare-compatible Web build

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
app/                    Route shell、metadata 與全局 CSS
game/domain/            無 UI、可獨立測試的遊戲規則與狀態型別
game/application/       use cases、store orchestration、commands
game/infrastructure/    IndexedDB、PWA、browser adapters
game/features/          功能 UI 與 feature-local components
game/shared/            Meridian 內跨 feature 共用元件
public/                 Manifest、service worker 與靜態資產
dev/                    Web 專屬規範、工作流程與設計文件
tests/                  跨模組與 rendering tests
```

詳細規則見 [dev/README.md](dev/README.md)。
