// @ts-check
const eslint = require("@eslint/js");
const { defineConfig } = require("eslint/config");
const tseslint = require("typescript-eslint");
const angular = require("angular-eslint");

// Reglas propias de accesibilidad (ver plan_accesibilidad.md, Fase 5).
const casildaA11y = {
  rules: {
    "mat-icon-button-accessible-name": require("./tools/eslint-rules/mat-icon-button-accessible-name"),
  },
};

module.exports = defineConfig([
  {
    ignores: ["coverage/**", "dist/**", ".angular/**", "node_modules/**"],
  },
  {
    files: ["**/*.ts"],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      "no-case-declarations": "warn",
      "no-empty": "warn",
      "@typescript-eslint/no-empty-function": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "@angular-eslint/no-empty-lifecycle-method": "warn",
      "@angular-eslint/prefer-inject": "warn",
      "@angular-eslint/directive-selector": [
        "error",
        {
          type: "attribute",
          prefix: "app",
          style: "camelCase",
        },
      ],
      "@angular-eslint/component-selector": [
        "error",
        {
          type: "element",
          prefix: "app",
          style: "kebab-case",
        },
      ],
    },
  },
  {
    files: ["**/*.html"],
    extends: [
      angular.configs.templateRecommended,
      angular.configs.templateAccessibility,
    ],
    plugins: { casilda: casildaA11y },
    rules: {
      // Accesibilidad (WCAG 2.2 AA): errores, no advertencias. La deuda quedó en cero
      // en la Fase 1 del plan de accesibilidad; una regresión debe romper el lint.
      "@angular-eslint/template/click-events-have-key-events": "error",
      "@angular-eslint/template/eqeqeq": "error",
      "@angular-eslint/template/interactive-supports-focus": "error",
      "@angular-eslint/template/label-has-associated-control": "error",
      // El preset estándar no detecta <button mat-icon-button> sin nombre (H-01).
      "casilda/mat-icon-button-accessible-name": "error",
    },
  }
]);
