import { defineConfig } from "eslint/config";
import globals from "globals";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
});

export default defineConfig([{
  files: ["**/*.ts"],
  ignores: ["dist/**", "node_modules/**", "eslint.config.mjs"],
  extends: compat.extends("eslint:recommended", "plugin:@typescript-eslint/recommended"),

  languageOptions: {
    globals: {
      ...globals.node,
      ...globals.commonjs,
    },

    ecmaVersion: 2022,
    sourceType: "script",

    parserOptions: {
      parser: "@typescript-eslint/parser",
      project: [path.resolve(__dirname, "./tsconfig.json")],
    },
  },

  rules: {
    indent: ["warn", 2, {
      SwitchCase: 1,
    }],

    "linebreak-style": ["error", "unix"],
    quotes: ["warn", "single"],
    semi: ["warn", "always"],
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-floating-promises": "error",
    "@typescript-eslint/no-non-null-assertion": "off",
    "no-unused-vars": "off",

    "@typescript-eslint/no-unused-vars": [1, {
      args: "after-used",
      argsIgnorePattern: "^_",
      caughtErrorsIgnorePattern: "^_",
    }],

    "no-debugger": "warn",
    "no-unused-expressions": "warn",
    "no-undef": "off",
    "@typescript-eslint/ban-ts-comment": "off",
    "@typescript-eslint/no-namespace": "off",
  },
}]);