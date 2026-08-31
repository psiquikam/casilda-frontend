# Evidencia 01 — Reproducibilidad y calidad estática

- Node fijado: 24.18.0.
- npm fijado: 11.16.0.
- Angular ESLint: 21.4.0.
- Instalación limpia: `npm ci`, exit code 0, 952 paquetes en 25 segundos.
- Auditoría completa tras instalación: 7 vulnerabilidades —4 moderadas y 3 altas—.
- Lockfile: generado desde un árbol limpio y versionado.
- Vercel: instalación mediante `npm ci`.
- CI: lint, pruebas con cobertura, build y auditoría productiva.

## Línea base de lint

El primer análisis encontró 369 errores; la corrección mecánica segura de ESLint y la eliminación de importaciones inválidas resolvieron 27. Los 342 hallazgos restantes se mantienen como advertencias y el script usa `--max-warnings 342`, de modo que el pipeline falla si la deuda aumenta.

| Regla | Cantidad inicial |
|---|---:|
| `@typescript-eslint/no-explicit-any` | 169 |
| `@angular-eslint/prefer-inject` | 79 |
| `@typescript-eslint/no-unused-vars` | 48 |
| `@angular-eslint/template/eqeqeq` | 15 |
| `@angular-eslint/template/label-has-associated-control` | 13 |
| `no-case-declarations` | 12 |
| reglas restantes | 9 |
| **Total actual** | **342** |

Las reglas no se desactivaron ni se excluyó código fuente. Solo se ignoran artefactos generados (`coverage`, `dist`, `.angular`) y dependencias. Las tareas posteriores deben reducir el techo cuando eliminen advertencias.

## Verificación automatizada

- Lint: 0 errores, 342 advertencias controladas.
- Pruebas: 47/47 exitosas, sin errores de iconos en consola.
- Cobertura: 29,22 % sentencias; 7,08 % ramas; 19,04 % funciones; 29,89 % líneas.
- Build de producción: exitoso; se conservan cuatro advertencias de presupuesto SCSS ya inventariadas.
- Auditoría productiva: 0 vulnerabilidades.
