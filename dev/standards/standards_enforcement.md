# Standards Enforcement

Governance prose 只有在能防止重要契約被靜默刪除時才可靠。`dev/tools/check-governance.mjs` 保護文件分層、canonical work lifecycle、TODO pointer integrity、active plan shape 與 package-script integration。

## What is enforced

- Required canonical governance files 存在，且保留 load-bearing sections/phrases。
- `work_lifecycle.md` 保留完整 canonical flow 與每個 transition gate，而 artifact standards 會指回它。
- 七個 `workflows/commands/` operational contracts 存在、從 trigger map/lifecycle 可發現，並不回流 Godot-specific commands 或 file types。
- `dev/README.md` trigger map 指向實際存在的 Web skills 與 workflows。
- `TODO.md` 保留 Active、Plan、Chore、Bug 與 Draft sections，不建立 Done tier。
- TODO 中的 plan reference 指向實際 active plan file。
- Child sketch/spec 擁有 `Parent Plan` marker，而且 parent 存在。
- Active Main Plan 保留 Goal、Requirements 與 Acceptance Criteria，不保留 completed checklists 或 implemented/superseded status。
- V3 product schema 不回流到 generic state standard。
- `package.json` 提供 `governance:check`，且 `verify` 會執行它。

## What remains prose-reviewed

- Architecture 決策是否正確，而不只是 heading 存在。
- Plan requirements 是否完整且沒有混入 implementation coordinates。
- Spec Relational Context 是否覆蓋實際 blast radius。
- Skill 是否仍是具體 task reference、format recipe 或 hazard card，而不是第二份 architecture standard。
- Closeout 是否真的達成 acceptance criteria。

## Adding a machine-checkable rule

1. 只在規則有過靜默遺失風險、可以準確判斷，且 false positive 低時加入 linter。
2. 在 canonical document 先寫人類可讀規則，再讓 linter 保護該契約；linter 不成為唯一文件。
3. 錯誤訊息要指出檔案、遺失契約與修正方向。
4. 不用字串檢查強迫架構偏好、文案措辭或可透過 TypeScript/ESLint/tests 更準確驗證的事。
5. 修改 checker 後執行 `npm run governance:check` 與 `npm run verify`。

## Verification scope

- Docs-only 或 TODO-only change：執行 changed-file Prettier check 與 `npm run governance:check`。
- Governance checker 或 package scripts 變更：執行完整 `npm run verify`。
- Program change：`npm run verify` 會先執行 governance checker，再執行 format、typecheck、lint、tests 與 build。
