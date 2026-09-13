// @ts-check
/**
 * Regla local de ESLint: todo `<button mat-icon-button>` debe tener nombre accesible.
 *
 * Motivo (plan_accesibilidad.md, H-01): el preset `templateAccessibility` de
 * angular-eslint no detecta el patrón de Material, porque la regla
 * `elements-content` considera que el botón «tiene contenido» —la ligadura del
 * ícono (`<mat-icon>delete</mat-icon>`)— y el lector de pantalla anuncia
 * «botón delete». Esta regla exige `aria-label`, `[attr.aria-label]`,
 * `aria-labelledby` o `[attr.aria-labelledby]` (WCAG 2.2 · 4.1.2).
 *
 * `matTooltip` NO cuenta: Material lo expone como `aria-describedby`.
 */
const { getTemplateParserServices } = require('@angular-eslint/utils');

const NOMBRES_ACCESIBLES = new Set(['aria-label', 'aria-labelledby']);

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Exige nombre accesible (aria-label / aria-labelledby) en <button mat-icon-button>.',
    },
    schema: [],
    messages: {
      sinNombre:
        '<button mat-icon-button> sin nombre accesible: añade aria-label o [attr.aria-label] ' +
        '(matTooltip no cuenta) y marca el <mat-icon> con aria-hidden="true". Ver plan_accesibilidad.md H-01.',
    },
  },
  create(context) {
    const parserServices = getTemplateParserServices(context);
    return {
      'Element[name=/^button$/i]'(element) {
        const esIconButton = element.attributes.some((a) => a.name === 'mat-icon-button');
        if (!esIconButton) return;
        const tieneNombre =
          element.attributes.some((a) => NOMBRES_ACCESIBLES.has(a.name) && a.value.trim() !== '') ||
          element.inputs.some((i) => NOMBRES_ACCESIBLES.has(i.name));
        if (tieneNombre) return;
        context.report({
          loc: parserServices.convertNodeSourceSpanToLoc(element.sourceSpan),
          messageId: 'sinNombre',
        });
      },
    };
  },
};
