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
              // `@/content/*` is deliberately absent: core rules currently read authored
              // content directly. Inverting that dependency is real work owned by a later
              // architecture-foundation child, not by the layout migration.
              group: ["@/runtime/*", "@/platform/*", "@/ui/*", "@/shared/*", "@/app/*"],
              message: "src/core must not depend on any outer layer. See dev/standards/project_structure.md.",
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
              group: ["@/runtime/*", "@/platform/*", "@/ui/*", "@/shared/*", "@/app/*"],
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
              group: ["@/ui/*", "@/shared/*", "@/app/*"],
              message: "src/runtime must not depend on presentation layers. See dev/standards/project_structure.md.",
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
              group: ["@/ui/*", "@/shared/*", "@/app/*"],
              message:
                "src/platform must not depend on presentation layers. Adapters may implement runtime-owned port contracts, but never call into UI. See dev/standards/project_structure.md.",
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
              group: ["@/platform/*", "@/app/*"],
              message:
                "src/ui must reach browser and persistence adapters through src/runtime, not directly. See dev/standards/project_structure.md.",
            },
          ],
        },
      ],
    },
  },
  prettierConfig,
]);

export default eslintConfig;
