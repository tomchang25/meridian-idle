# Web Skill Cards

`dev/skills/*.md` 是 repository-local task references 與 hazard cards，由 `dev/README.md` trigger map 指定何時閱讀。它們不是 Codex 平台可安裝的 `SKILL.md` package，也不會僅因為放在此資料夾就自動載入。

## Boundary

- Skill 是具體任務的 recipe、format reference，或可重複發生的 API/framework/tooling hazard 與安全修正 shape。
- Standard 定義 codebase 在正確時的長期契約。不把 architecture 規則複製為 skill。
- Agent rule 定義 agent 的權限、必做動作與環境行為。不把安全限制改寫成可選 recipe。
- Workflow 定義 Plan、Sketch、Spec、Review 與 Closeout 如何流轉。

## Current cards

- `react-strict-mode-effects.md`：effect rerun、cleanup、stale async completion 與重複 mutation。
- `indexeddb-upgrade-transactions.md`：database upgrade transaction、blocked connection 與 payload/schema version 分離。
- `offline-time-resolution.md`：background timer 不可信與 online/offline deterministic parity。
- `service-worker-cache-versioning.md`：deployment asset mixing、worker takeover 與 scoped cache cleanup。
- `conventional-commits.md`：staged change 的 commit type、scope、breaking marker 與 message shape。
- `pr-convention.md`：PR title、Summary、Changes、Testing 與 breaking-change presentation。

新增 Skill 前先確認它是已出現的重複任務、格式契約或實際 hazard，並將它加入 trigger map；不為假設的未來 technology 建立卡片。
