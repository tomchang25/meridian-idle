# Conventional Commits

本專案的 commit subjects 使用 Conventional Commits 結構：

```text
<type>[optional scope][!]: <description>

[optional body]

[optional footer]
```

## Types

- `feat`：新增 user-facing 或 system capability。
- `fix`：修正 bug 或 regression。
- `docs`：只修改文件內容。
- `test`：只修改 tests 或 fixtures。
- `refactor`：不改變可觀察行為的程式重組。
- `perf`：已驗證的 performance improvement。
- `build`：build system 或 dependencies。
- `ci`：CI pipeline 或 automation configuration。
- `chore`：development process、tooling 或 housekeeping。
- `revert`：回復先前變更。

## Rules

- Type 與 scope 使用 lowercase。Scope 是穩定 codebase/product area 的簡短名詞，不是 filename。
- Description 簡潔描述 outcome，不加結尾句點，不使用「update files」這類無語意文字。
- Body 與 subject 之間留一個空行，並依 `change_summary_standard.md` 描述 logical outcomes。
- Breaking change 在 type/scope 後使用 `!`，或加入 `BREAKING CHANGE: <description>` footer。有舊 save/API/schema 不相容時必須說明 migration path。
- 若 staged diff 存在多個不相關 outcomes，優先拆 commit，不用含糊 subject 遮掩。

## Examples

```text
feat(trade): persist port market sessions
fix(save): prevent pre-hydration autosave overwrite
docs(design): define the V4 manual trade loop
chore(governance): add verified work lifecycle commands
feat(save)!: replace the legacy action payload
```

Breaking footer example：

```text
feat(save): migrate fleet cargo accounting

BREAKING CHANGE: Save payloads now require migration through version 3 before loading.
```
