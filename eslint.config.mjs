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
    files: ["game/domain/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["react", "react-dom", "react/*", "react-dom/*", "next", "next/*"],
              message:
                "game/domain must stay framework-free — no UI framework imports. See dev/standards/project_structure.md.",
            },
            {
              group: [
                "@/game/application/*",
                "@/game/infrastructure/*",
                "@/game/features/*",
                "@/game/shared/*",
                "@/app/*",
              ],
              message: "game/domain must not depend on any outer layer. See dev/standards/project_structure.md.",
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
    files: ["game/application/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/game/features/*", "@/game/shared/*", "@/app/*"],
              message:
                "game/application must not depend on presentation layers. See dev/standards/project_structure.md.",
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
    files: ["game/infrastructure/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/game/features/*", "@/game/shared/*", "@/app/*"],
              message:
                "game/infrastructure must not depend on presentation layers. Adapters may implement application-owned port contracts, but never call into UI. See dev/standards/project_structure.md.",
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
    files: ["game/features/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/game/infrastructure/*", "@/app/*"],
              message:
                "game/features must reach browser and persistence adapters through game/application, not directly. See dev/standards/project_structure.md.",
            },
          ],
        },
      ],
    },
  },
  prettierConfig,
]);

export default eslintConfig;
