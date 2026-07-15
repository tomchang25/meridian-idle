#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const errors = [];

const REQUIRED_CONTRACTS = {
  "AGENTS.md": ["dev/README.md", "npm run verify"],
  "dev/README.md": [
    "## Placement",
    "## Trigger map",
    "workflows/work_lifecycle.md",
    "workflows/sketch_standard.md",
    "skills/react-strict-mode-effects.md",
    "skills/indexeddb-upgrade-transactions.md",
    "skills/offline-time-resolution.md",
    "skills/service-worker-cache-versioning.md",
    "workflows/commands/research-context.md",
    "workflows/commands/spec-discuss.md",
    "workflows/commands/spec-build.md",
    "workflows/commands/stage-review.md",
    "workflows/commands/closeout.md",
    "workflows/commands/commit-msg.md",
    "workflows/commands/pr-review.md",
  ],
  "dev/agent_rules/agent_startup.md": ["## Reading behavior", "dev/README.md", "standards_enforcement.md"],
  "dev/agent_rules/git_operations.md": ["read-only", "git reset --hard", "mutation 失敗"],
  "dev/agent_rules/save_migrations.md": [
    "append-only",
    "v1 → v2 → v3",
    "declared compatibility break",
    "degraded/dropped data",
  ],
  "dev/workflows/plan_standard.md": [
    "work_lifecycle.md",
    "## Child decomposition",
    ".sketch.md",
    ".implementation_spec.md",
    "Child 只由 parent overview 指向",
  ],
  "dev/workflows/sketch_standard.md": [
    "work_lifecycle.md",
    "Parent Plan: `<plan_filename.md>`",
    "Candidate files to inspect",
    "provisional context",
  ],
  "dev/workflows/implementation_spec_standard.md": [
    "work_lifecycle.md",
    "Parent Plan: none (standalone spec)",
    "### 2. Summary",
    "### 4. Relational Context",
    "### 7. Execution Outline",
    "### 10. Verification",
  ],
  "dev/workflows/review_standard.md": [
    "## Finding priority",
    "### Stale/redundant check",
    "### Robustness check",
    "## Per-file review summary",
  ],
  "dev/workflows/closeout.md": [
    "work_lifecycle.md",
    "## Child closeout",
    "## Flow closeout",
    "CHANGELOG.md",
    "dev/docs/archived/",
  ],
  "dev/workflows/work_lifecycle.md": [
    "## Canonical flow",
    "TODO Draft",
    "→ Child Implementation Spec",
    "### TODO Draft → Main Plan",
    "### Main Plan → Child Sketch",
    "### Sketch → Implementation Spec",
    "### Implementation Spec → Implementation",
    "### Implementation → Verify",
    "### Verify → Child Closeout",
    "### Child Closeout → Main Plan Closeout",
    "## Review position",
    "## Operational commands",
    "commands/research-context.md",
    "commands/spec-discuss.md",
    "commands/spec-build.md",
    "commands/stage-review.md",
    "commands/closeout.md",
    "commands/commit-msg.md",
    "commands/pr-review.md",
    "## Tracking states",
  ],
  "dev/workflows/commands/research-context.md": [
    "read-only",
    "Relevant Codebase Context",
    "Spec-Time Decisions",
    "不寫 Plan",
  ],
  "dev/workflows/commands/spec-discuss.md": ["read-only", "/spec-build", "Locked Decisions", "Build Readiness"],
  "dev/workflows/commands/spec-build.md": [
    "## Decision gate",
    "Relational Context",
    "npm run governance:check",
    "不實作程式",
  ],
  "dev/workflows/commands/stage-review.md": [
    "git diff --cached --check",
    "git show :<path>",
    "per-file summary",
    "needs changes",
  ],
  "dev/workflows/commands/closeout.md": [
    "documentation/tracking cleanup",
    "## Detect scope",
    "Child Closeout",
    "/commit-msg",
  ],
  "dev/workflows/commands/commit-msg.md": [
    "git diff --cached --name-status",
    "conventional-commits.md",
    "不讀 unstaged/untracked changes",
  ],
  "dev/workflows/commands/pr-review.md": [
    "git diff <base>...HEAD",
    "review_standard.md",
    "pr-convention.md",
    "不開 PR",
  ],
  "dev/docs/README.md": [
    "## Tracking ownership",
    "## TODO maturity",
    "## Plan lifecycle",
    "dev/workflows/work_lifecycle.md",
    "CHANGELOG.md",
  ],
  "dev/standards/standards_enforcement.md": [
    "dev/tools/check-governance.mjs",
    "workflows/commands/",
    "## What is enforced",
    "## Adding a machine-checkable rule",
  ],
  "dev/standards/change_summary_standard.md": ["## Core rule", "durable outcome", "## Scope by artifact"],
  "dev/skills/README.md": [
    "repository-local task references",
    "不是 Codex",
    "## Current cards",
    "conventional-commits.md",
    "pr-convention.md",
  ],
  "dev/skills/conventional-commits.md": ["<type>[optional scope][!]", "BREAKING CHANGE", "## Types"],
  "dev/skills/pr-convention.md": ["## Summary", "## Changes", "## Testing", "## Breaking changes"],
  "dev/skills/react-strict-mode-effects.md": ["## Hazard", "## Safe shape"],
  "dev/skills/indexeddb-upgrade-transactions.md": ["## Hazard", "versionchange"],
  "dev/skills/offline-time-resolution.md": ["## Hazard", "同一 resolver"],
  "dev/skills/service-worker-cache-versioning.md": ["## Hazard", "Cache names"],
};

function read(relativePath) {
  const absolutePath = path.join(ROOT, relativePath);
  if (!fs.existsSync(absolutePath)) {
    errors.push(`missing required governance file: ${relativePath}`);
    return null;
  }
  return fs.readFileSync(absolutePath, "utf8");
}

for (const [relativePath, fragments] of Object.entries(REQUIRED_CONTRACTS)) {
  const contents = read(relativePath);
  if (contents === null) continue;

  for (const fragment of fragments) {
    if (!contents.includes(fragment)) {
      errors.push(`${relativePath}: missing load-bearing contract ${JSON.stringify(fragment)}`);
    }
  }
}

const COMMAND_PATHS = [
  "dev/workflows/commands/research-context.md",
  "dev/workflows/commands/spec-discuss.md",
  "dev/workflows/commands/spec-build.md",
  "dev/workflows/commands/stage-review.md",
  "dev/workflows/commands/closeout.md",
  "dev/workflows/commands/commit-msg.md",
  "dev/workflows/commands/pr-review.md",
];
const GODOT_ONLY_COMMAND_FRAGMENTS = [
  ".gd",
  ".tscn",
  "/godot-test",
  "python dev/tools/lint_standards.py",
  "GDScript",
  "SceneRouter",
  "CLAUDE.md",
];

for (const relativePath of COMMAND_PATHS) {
  const contents = read(relativePath);
  if (contents === null) continue;

  for (const fragment of GODOT_ONLY_COMMAND_FRAGMENTS) {
    if (contents.includes(fragment)) {
      errors.push(
        `${relativePath}: Godot-specific command contract leaked into Web governance: ${JSON.stringify(fragment)}`,
      );
    }
  }
}

const stateStandard = read("dev/standards/state_management.md");
if (stateStandard !== null) {
  for (const staleTerm of ["船長", "Captain Skill", "Knowledge", "current action"]) {
    if (stateStandard.includes(staleTerm)) {
      errors.push(
        `dev/standards/state_management.md: product-specific V3 term must not live in the generic standard: ${JSON.stringify(staleTerm)}`,
      );
    }
  }
}

const todo = read("TODO.md");
if (todo !== null) {
  for (const heading of ["## Active", "## Plan", "## Chore", "## Bug", "## Draft"]) {
    if (!todo.includes(heading)) {
      errors.push(`TODO.md: missing forward-surface section ${heading}`);
    }
  }

  if (/^## Done\s*$/mu.test(todo)) {
    errors.push("TODO.md: Done history belongs in CHANGELOG.md, not a forward-work section");
  }

  for (const match of todo.matchAll(/\[ref plans\/([^\]<\s]+)\]/gu)) {
    const relativePlanPath = path.join("dev/docs/plans", match[1]);
    if (!fs.existsSync(path.join(ROOT, relativePlanPath))) {
      errors.push(`TODO.md: plan pointer has no active target: ${relativePlanPath}`);
    }
  }
}

const plansDirectory = path.join(ROOT, "dev/docs/plans");
if (fs.existsSync(plansDirectory)) {
  for (const entry of fs.readdirSync(plansDirectory, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".md")) continue;

    const relativePath = path.posix.join("dev/docs/plans", entry.name);
    const contents = fs.readFileSync(path.join(plansDirectory, entry.name), "utf8");

    if (/Status:\s*(Done|Implemented|Superseded)/iu.test(contents)) {
      errors.push(`${relativePath}: completed or superseded work must leave active plans`);
    }
    if (/^- \[[xX]\]/gmu.test(contents)) {
      errors.push(`${relativePath}: completed checklist history belongs in CHANGELOG.md`);
    }

    const isSketch = entry.name.endsWith(".sketch.md");
    const isSpec = entry.name.endsWith(".implementation_spec.md");
    if (isSketch || isSpec) {
      const parentMatch = contents.match(/^Parent Plan: `([^`]+)`$/mu);
      const standaloneSpec = isSpec && contents.includes("Parent Plan: none (standalone spec)");
      if (!parentMatch && !standaloneSpec) {
        errors.push(`${relativePath}: child artifact is missing its Parent Plan marker`);
      } else if (parentMatch) {
        const parentPath = path.join(plansDirectory, parentMatch[1]);
        if (!fs.existsSync(parentPath)) {
          errors.push(`${relativePath}: parent plan does not exist: ${parentMatch[1]}`);
        }
      }
      continue;
    }

    for (const heading of ["## Goal", "## Requirements", "## Non-Goals", "## Acceptance Criteria"]) {
      if (!contents.includes(heading)) {
        errors.push(`${relativePath}: Main Plan is missing ${heading}`);
      }
    }
  }
}

const packageJson = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
const governanceScript = packageJson.scripts?.["governance:check"] ?? "";
const verifyScript = packageJson.scripts?.verify ?? "";
if (!governanceScript.includes("dev/tools/check-governance.mjs")) {
  errors.push("package.json: governance:check must execute dev/tools/check-governance.mjs");
}
if (!verifyScript.includes("node dev/tools/check-governance.mjs")) {
  errors.push(
    "package.json: verify must execute dev/tools/check-governance.mjs without relying on a nested package runner",
  );
}

if (errors.length > 0) {
  for (const error of errors) {
    console.error(`governance: ERROR: ${error}`);
  }
  process.exitCode = 1;
} else {
  console.log(`governance: OK (${Object.keys(REQUIRED_CONTRACTS).length} canonical documents)`);
}
