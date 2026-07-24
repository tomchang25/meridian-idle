import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";
import prettierConfig from "eslint-config-prettier/flat";

const eslintConfig = defineConfig([
  globalIgnores(["dist/**", "coverage/**", "dev/foundation/**", "build/**"]),
  js.configs.recommended,
  ...tseslint.configs.recommended,
  reactHooks.configs["recommended-latest"],
  // Plain JS tooling scripts run under Node. TypeScript files get their globals
  // from the type checker, so this only covers the .mjs/.js build and governance tools.
  {
    files: ["**/*.mjs", "**/*.js"],
    languageOptions: {
      globals: { console: "readonly", process: "readonly" },
    },
  },
  // Layer boundary enforcement. The placement rules these encode live in
  // `dev/standards/project_structure.md`; a violation means code is misplaced,
  // so relocate the code rather than widening a pattern here.
  {
    files: ["src/core/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["react", "react-dom", "react/*", "react-dom/*", "next", "next/*"],
              message:
                "src/core must stay framework-free — no UI framework imports. See dev/standards/project_structure.md.",
            },
            {
              group: ["@/content/*", "@/runtime/*", "@/platform/*", "@/ui/*", "@/shared/*", "@/app/*", "@/harness/*"],
              message:
                "src/core must not depend on any outer layer, and must never name a particular world; rules receive content as an argument. See dev/standards/project_structure.md.",
            },
            {
              group: ["../*"],
              message: "Cross-directory imports must use the @/ alias so layer rules apply.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/content/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["react", "react-dom", "react/*", "react-dom/*", "next", "next/*"],
              message:
                "src/content is authored data and must stay framework-free. See dev/standards/project_structure.md.",
            },
            {
              group: ["@/runtime/*", "@/platform/*", "@/ui/*", "@/shared/*", "@/app/*", "@/harness/*"],
              message: "src/content may depend on core contracts only. See dev/standards/project_structure.md.",
            },
            {
              group: ["../*"],
              message: "Cross-directory imports must use the @/ alias so layer rules apply.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/runtime/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/ui/*", "@/shared/*", "@/app/*", "@/harness/*"],
              message:
                "src/runtime must not depend on presentation layers or on the test harness. See dev/standards/project_structure.md.",
            },
            {
              group: ["../*"],
              message: "Cross-directory imports must use the @/ alias so layer rules apply.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/platform/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/ui/*", "@/shared/*", "@/app/*", "@/harness/*"],
              message:
                "src/platform must not depend on presentation layers or on the test harness. Adapters may implement runtime-owned port contracts, but never call into UI. See dev/standards/project_structure.md.",
            },
            {
              group: ["../*"],
              message: "Cross-directory imports must use the @/ alias so layer rules apply.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/ui/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/platform/*", "@/app/*", "@/harness/*"],
              message:
                "src/ui must reach browser and persistence adapters through src/runtime, and must never depend on the test harness. See dev/standards/project_structure.md.",
            },
          ],
        },
      ],
    },
  },
  prettierConfig,
]);

export default eslintConfig;
