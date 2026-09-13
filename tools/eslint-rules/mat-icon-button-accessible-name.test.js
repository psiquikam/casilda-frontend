// @ts-check
/**
 * Prueba de la regla local `mat-icon-button-accessible-name`.
 * Ejecutar: node tools/eslint-rules/mat-icon-button-accessible-name.test.js
 */
const { RuleTester } = require('eslint');
const templateParser = require('@angular-eslint/template-parser');
const rule = require('./mat-icon-button-accessible-name');

const tester = new RuleTester({
  languageOptions: { parser: templateParser },
});

tester.run('mat-icon-button-accessible-name', rule, {
  valid: [
    { code: `<button mat-icon-button aria-label="Cerrar"><mat-icon aria-hidden="true">close</mat-icon></button>` },
    { code: `<button mat-icon-button [attr.aria-label]="'Editar el caso ' + element.id"><mat-icon>edit</mat-icon></button>` },
    { code: `<button mat-icon-button aria-labelledby="titulo"><mat-icon>edit</mat-icon></button>` },
    { code: `<button mat-icon-button [attr.aria-labelledby]="idTitulo"><mat-icon>edit</mat-icon></button>` },
    // Botones normales con texto no aplican.
    { code: `<button mat-button><mat-icon>save</mat-icon> Guardar</button>` },
  ],
  invalid: [
    {
      code: `<button mat-icon-button (click)="borrar()"><mat-icon>delete</mat-icon></button>`,
      errors: [{ messageId: 'sinNombre' }],
    },
    {
      // matTooltip no es nombre accesible.
      code: `<button mat-icon-button matTooltip="Eliminar"><mat-icon>delete</mat-icon></button>`,
      errors: [{ messageId: 'sinNombre' }],
    },
    {
      // aria-label vacío tampoco.
      code: `<button mat-icon-button aria-label=""><mat-icon>delete</mat-icon></button>`,
      errors: [{ messageId: 'sinNombre' }],
    },
  ],
});

console.log('mat-icon-button-accessible-name: pruebas superadas');
