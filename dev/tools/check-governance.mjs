#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const errors = [];

const REQUIRED_LOCAL_CONTRACTS = {
  "AGENTS.md": [
    "dev/foundation/core/agent_rules/foundation_startup.md",
    "dev/foundation/platforms/web-react/platform_startup.md",
    "dev/agent_rules/agent_startup.md",
    "dev/agent_rules/test_operations.md",
  ],
  "dev/README.md": [
    "foundation/core/agent_rules/foundation_startup.md",
    "foundation/platforms/web-react/platform_startup.md",
    "foundation/core/workflows/work_lifecycle.md",
    "foundation/platforms/web-react/standards/project_structure_standard.md",
    "standards/project_structure.addendum.md",
    "foundation/core/standards/runtime_ownership.md",
  ],
  "dev/agent_rules/agent_startup.md": [
    "dev/foundation/core/agent_rules/foundation_startup.md",
    "dev/foundation/platforms/web-react/platform_startup.md",
    "git_operations.md",
    "test_operations.md",
  ],
  "dev/agent_rules/git_operations.md": ["dev/foundation/core/agent_rules/git_operations.md"],
  "dev/agent_rules/test_operations.md": ["# Test Operations", "npm run governance:check", "npm run verify"],
  "dev/docs/README.md": ["dev/foundation/core/workflows/work_lifecycle.md", "CHANGELOG.md"],
  "dev/standards/standards_enforcement.md": [
    "dev/foundation/tools/verify_consumer.py",
    "dev/tools/check-governance.mjs",
    "npm run governance:check",
  ],
  "dev/standards/react_component.addendum.md": [
    "dev/foundation/platforms/web-react/standards/react_component_standard.md",
    '"use client"',
  ],
  "dev/standards/persistence.addendum.md": [
    "dev/foundation/core/standards/persistence_standard.md",
    "dev/foundation/platforms/web-react/standards/browser_persistence_standard.md",
    "SaveEnvelope",
  ],
  "dev/standards/web_platform.addendum.md": [
    "dev/foundation/platforms/web-react/standards/web_platform_standard.md",
    "Chromium",
    "service worker",
  ],
  "dev/standards/project_structure.addendum.md": [
    "dev/foundation/platforms/web-react/standards/project_structure_standard.md",
    "Do not restate the shared standard here",
  ],
  "dev/skills/README.md": ["Meridian-specific", "offline-time-resolution.md"],
  "dev/skills/offline-time-resolution.md": ["## Hazard", "同一 resolver"],
};

const LEGACY_SHARED_FILES = [
  "dev/agent_rules/lint_before_finish.md",
  "dev/agent_rules/save_migrations.md",
  "dev/standards/accessibility_standard.md",
  "dev/standards/change_summary_standard.md",
  "dev/standards/naming_conventions.md",
  "dev/standards/persistence_standard.md",
  "dev/standards/react_component_standard.md",
  "dev/standards/runtime_ownership.md",
  "dev/standards/testing_standard.md",
  "dev/standards/web_platform_standard.md",
  "dev/skills/conventional-commits.md",
  "dev/skills/indexeddb-upgrade-transactions.md",
  "dev/skills/pr-convention.md",
  "dev/skills/react-strict-mode-effects.md",
  "dev/skills/service-worker-cache-versioning.md",
];

const LOCAL_GOVERNANCE_DOCS = [
  "AGENTS.md",
  "dev/README.md",
  "dev/agent_rules/agent_startup.md",
  "dev/agent_rules/git_operations.md",
  "dev/agent_rules/test_operations.md",
  "dev/docs/README.md",
  "dev/standards/standards_enforcement.md",
  "dev/standards/react_component.addendum.md",
  "dev/standards/persistence.addendum.md",
  "dev/standards/web_platform.addendum.md",
  "dev/standards/project_structure.addendum.md",
  "dev/skills/README.md",
];

function absolute(relativePath) {
  return path.join(ROOT, relativePath);
}

function read(relativePath) {
  const target = absolute(relativePath);
  if (!fs.existsSync(target)) {
    errors.push(`missing required Meridian governance file: ${relativePath}`);
    return null;
  }
  return fs.readFileSync(target, "utf8");
}

for (const [relativePath, fragments] of Object.entries(REQUIRED_LOCAL_CONTRACTS)) {
  const contents = read(relativePath);
  if (contents === null) continue;

  for (const fragment of fragments) {
    if (!contents.includes(fragment)) {
      errors.push(`${relativePath}: missing load-bearing contract ${JSON.stringify(fragment)}`);
    }
  }
}

if (!fs.existsSync(absolute("dev/foundation/consumer_manifest.json"))) {
  errors.push("dev/foundation is missing or uninitialized; run git submodule update --init --recursive");
}

try {
  const foundationConfig = JSON.parse(fs.readFileSync(absolute("dev/foundation.config.json"), "utf8"));
  if (foundationConfig.schema_version !== 2) {
    errors.push("dev/foundation.config.json: schema_version must be 2");
  }
  if (foundationConfig.platform !== "web-react") {
    errors.push("dev/foundation.config.json: platform must be web-react");
  }
  if (!Array.isArray(foundationConfig.profiles) || foundationConfig.profiles.length !== 0) {
    errors.push("dev/foundation.config.json: Meridian must select no foundation profile");
  }
} catch (error) {
  errors.push(`dev/foundation.config.json: invalid JSON (${error.message})`);
}

for (const relativePath of LEGACY_SHARED_FILES) {
  if (fs.existsSync(absolute(relativePath))) {
    errors.push(`${relativePath}: shared foundation compatibility copy must be removed`);
  }
}

const legacyWorkflowsDirectory = absolute("dev/workflows");
function containsFile(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).some((entry) => {
    if (entry.isFile()) return true;
    return entry.isDirectory() && containsFile(path.join(directory, entry.name));
  });
}

if (fs.existsSync(legacyWorkflowsDirectory) && containsFile(legacyWorkflowsDirectory)) {
  errors.push("dev/workflows: shared foundation compatibility files must be removed");
}

for (const relativePath of LOCAL_GOVERNANCE_DOCS) {
  const contents = read(relativePath);
  if (contents?.includes("dev/workflows/")) {
    errors.push(`${relativePath}: use the canonical foundation workflow path instead of dev/workflows/`);
  }
}

if (fs.existsSync(absolute("dev/standards/state_management.md"))) {
  errors.push(
    "dev/standards/state_management.md: state lifecycle rules are owned by foundation/core/standards/runtime_ownership.md; do not recreate the local copy",
  );
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
    if (!fs.existsSync(absolute(relativePlanPath))) {
      errors.push(`TODO.md: plan pointer has no active target: ${relativePlanPath}`);
    }
  }
}

const plansDirectory = absolute("dev/docs/plans");
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

const packageJson = JSON.parse(fs.readFileSync(absolute("package.json"), "utf8"));
const foundationCheck = packageJson.scripts?.["foundation:check"] ?? "";
const governanceCheck = packageJson.scripts?.["governance:check"] ?? "";
const verify = packageJson.scripts?.verify ?? "";
if (!foundationCheck.includes("python dev/foundation/tools/verify_consumer.py --root .")) {
  errors.push("package.json: foundation:check must execute the pinned consumer verifier");
}
if (
  !governanceCheck.includes("npm run foundation:check") ||
  !governanceCheck.includes("node dev/tools/check-governance.mjs")
) {
  errors.push("package.json: governance:check must run foundation and Meridian governance verification");
}
if (!verify.includes("npm run governance:check")) {
  errors.push("package.json: verify must execute governance:check before application verification");
}

if (errors.length > 0) {
  for (const error of errors) {
    console.error(`governance: ERROR: ${error}`);
  }
  process.exitCode = 1;
} else {
  console.log("governance: OK (Meridian local contracts)");
}
