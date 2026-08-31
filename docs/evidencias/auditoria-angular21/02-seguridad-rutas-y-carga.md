# Evidencia 02 — Sesión, capacidades y carga diferida

## Seguridad de sesión

- La sesión persistida se valida antes de utilizarla.
- JSON corrupto, roles desconocidos, tokens inválidos y JWT vencidos se eliminan sin romper el arranque.
- `isUsuario()` solo retorna verdadero para una sesión autenticada con rol `Usuario`.
- HTTP 401 cierra la sesión; HTTP 403 conserva la sesión y redirige a acceso denegado.
- Se agregaron cuatro pruebas unitarias de sesión.

## Prototipos sin respaldo backend

Las capacidades `nueva-queja`, `seguimiento`, `dashboard-revisor` y `mis-asignaciones` continúan disponibles para desarrollo, pero quedan deshabilitadas en la configuración de producción. Sus enlaces se ocultan y un acceso directo se redirige a una pantalla informativa, sin simular que existe funcionalidad productiva.

## Rutas y rendimiento

Todas las pantallas se cargan mediante `loadComponent`. El build de producción pasó de un bundle inicial de 1,97 MB (328,95 kB estimados de transferencia) a 877,25 kB (198,93 kB estimados), una reducción aproximada del 55,5 % en tamaño bruto inicial y del 39,5 % en transferencia estimada.

Verificación de esta etapa:

- build de producción exitoso;
- 56/56 pruebas exitosas;
- 0 errores de lint y 303 advertencias controladas.
