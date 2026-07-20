import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettierConfig from "eslint-config-prettier/flat";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    ".vinext/**",
    ".wrangler/**",
    "coverage/**",
    "dev/foundation/**",
    "dist/**",
    "out/**",
    "outputs/**",
    "build/**",
    "work/**",
    "next-env.d.ts",
  ]),
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
