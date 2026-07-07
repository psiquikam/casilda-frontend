---
name: angular_frontend_guidelines
description: Guidelines and conventions for CASILDA Angular frontend development (standalone components, Material 17, Reactive Forms, lists)
---

# Copilot Instructions — sistema-casilda-fnsp (Frontend Angular)

## Proyecto
Sistema CASILDA — frontend Angular para gestión de solicitudes de acompañamiento psicosocial y jurídico de la Universidad de Antioquia.

## Stack tecnológico
- **Angular 17** con **componentes standalone**
- **Angular Material 17** para todos los componentes UI
- **Reactive Forms** (`FormBuilder`, `FormGroup`, `Validators`)
- **RxJS 7.8** — `Observable`, `forkJoin`, `BehaviorSubject`, `catchError`
- **SweetAlert2** para confirmaciones/alertas
- **HttpClient** con interceptor JWT automático (`authInterceptor`)
- **Node 20.x** — build: `npm run build`

## Configuración de entorno
```typescript
// src/environments/environment.ts (dev) y environment.prod.ts (prod)
export const environment = {
  production: false,
  apiBaseUrl: 'http://35.208.251.66:8080/api-casilda'
};
```
- **NUNCA** escribir URLs hardcodeadas — siempre usar `environment.apiBaseUrl`
- El interceptor `authInterceptor` agrega automáticamente el header `Authorization: Bearer <token>` en todos los requests

## Estructura de carpetas
```
src/app/
├── components/          # Componentes standalone (uno por carpeta)
│   ├── nombre-componente/
│   │   ├── nombre-componente.component.ts
│   │   ├── nombre-componente.component.html
│   │   └── nombre-componente.component.scss
├── services/            # Servicios + interfaces/DTOs
│   ├── solicitud.service.ts
│   ├── listas.service.ts
│   ├── auth.service.ts
│   ├── auth.interceptor.ts
│   ├── auth.guard.ts
│   └── role.guard.ts
└── environments/
    ├── environment.ts
    └── environment.prod.ts
```

## Convenciones de servicios
```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// Interfaces/DTOs siempre exportadas desde el mismo archivo del servicio
export interface NombreEntidadDto {
  id: number;
  campo: string;
}

export interface NombreEntidadRequestDto {
  campo: string;
}

@Injectable({ providedIn: 'root' })
export class NombreService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/recurso`;

  listar(): Observable<NombreEntidadDto[]> {
    return this.http.get<NombreEntidadDto[]>(this.apiUrl);
  }

  crear(datos: NombreEntidadRequestDto): Observable<NombreEntidadDto> {
    return this.http.post<NombreEntidadDto>(this.apiUrl, datos);
  }

  obtenerPorId(id: number): Observable<NombreEntidadDto> {
    return this.http.get<NombreEntidadDto>(`${this.apiUrl}/${id}`);
  }

  actualizar(id: number, datos: NombreEntidadRequestDto): Observable<NombreEntidadDto> {
    return this.http.put<NombreEntidadDto>(`${this.apiUrl}/${id}`, datos);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
```

## Obtención de listas maestras (enumeraciones del backend)
**SIEMPRE** obtener listas (tipos, estados, categorías) del backend. **NUNCA** hardcodear arrays de opciones.

Las listas maestras se encuentran en `GET /maestros/<endpoint>` y retornan `MaestroDto[]`:
```typescript
export interface MaestroDto {
  id: number;
  codigo?: string | null;
  nombre: string;
}
```

Endpoints maestros disponibles:
- `/maestros/tipos-solicitud`
- `/maestros/campus`
- `/maestros/dependencias`
- `/maestros/facultades`
- `/maestros/tipos-identificacion`
- `/maestros/identidades-genero`
- `/maestros/cargos`
- `/maestros/resultados-contacto-telefonico`
- `/maestros/paises`, `/maestros/departamentos`, `/maestros/municipios`
- `/maestros/sexos`, `/maestros/etnias`, `/maestros/orientaciones-sexuales`
- `/maestros/discapacidades`, `/maestros/vinculos-agresor-victima`, `/maestros/vinculos-udea`
- `/maestros/modalidades-violencia`, `/maestros/modalidades-violencia-sexual`
- `/maestros/programas`, `/maestros/roles`, `/maestros/regimenes`

Para cargar una lista en un componente:
```typescript
// Inyectar HttpClient directamente o usar ListasService
private readonly http = inject(HttpClient);
private readonly maestrosUrl = `${environment.apiBaseUrl}/maestros`;

tiposSolicitud: MaestroDto[] = [];

ngOnInit(): void {
  this.http.get<MaestroDto[]>(`${this.maestrosUrl}/tipos-solicitud`).subscribe({
    next: (lista) => { this.tiposSolicitud = lista; },
    error: () => { this.tiposSolicitud = []; }  // fallback vacío, nunca hardcodear
  });
}
```

Para múltiples listas en paralelo usar `forkJoin`:
```typescript
forkJoin({
  tiposSolicitud: this.http.get<MaestroDto[]>(`${this.maestrosUrl}/tipos-solicitud`),
  campus: this.http.get<MaestroDto[]>(`${this.maestrosUrl}/campus`)
}).subscribe({
  next: ({ tiposSolicitud, campus }) => {
    this.tiposSolicitud = tiposSolicitud;
    this.campus = campus;
  }
});
```

En el HTML, siempre iterar sobre el array cargado del backend:
```html
<!-- ✅ Correcto -->
<mat-option *ngFor="let t of tiposSolicitud" [value]="t.id">{{ t.nombre }}</mat-option>

<!-- ❌ Incorrecto — nunca hardcodear valores -->
<mat-option value="1">Psicosocial</mat-option>
```

## Convenciones de componentes
```typescript
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { environment } from '../../../environments/environment';
import { MaestroDto } from '../../services/listas.service';
import { NombreService, NombreEntidadDto } from '../../services/nombre.service';

@Component({
  selector: 'app-nombre-componente',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatDialogModule,
    MatIconModule,
    MatProgressSpinnerModule
    // Solo importar los módulos que se usen realmente
  ],
  templateUrl: './nombre-componente.component.html',
  styleUrls: ['./nombre-componente.component.scss']
})
export class NombreComponnenteComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly dialog = inject(MatDialog);
  private readonly nombreService = inject(NombreService);

  private readonly maestrosUrl = `${environment.apiBaseUrl}/maestros`;

  // Estado de carga
  cargando = false;
  guardando = false;

  // Listas del backend (nunca hardcodeadas)
  opciones: MaestroDto[] = [];

  // Datos
  dataSource = new MatTableDataSource<NombreEntidadDto>([]);
  displayedColumns: string[] = ['id', 'campo', 'acciones'];

  formulario!: FormGroup;

  ngOnInit(): void {
    this.formulario = this.fb.group({
      campo: ['', Validators.required]
    });
    this.cargarOpciones();
    this.cargarDatos();
  }

  private cargarOpciones(): void {
    this.http.get<MaestroDto[]>(`${this.maestrosUrl}/alguna-lista`).subscribe({
      next: (lista) => { this.opciones = lista; },
      error: () => { this.opciones = []; }
    });
  }

  private cargarDatos(): void {
    this.cargando = true;
    this.nombreService.listar().subscribe({
      next: (datos) => { this.dataSource.data = datos; this.cargando = false; },
      error: () => { this.cargando = false; }
    });
  }

  guardar(): void {
    if (this.formulario.invalid) return;
    this.guardando = true;
    this.nombreService.crear(this.formulario.value).subscribe({
      next: () => { this.guardando = false; this.cargarDatos(); this.formulario.reset(); },
      error: () => { this.guardando = false; }
    });
  }
}
```

## Componentes modales (MatDialog)
```typescript
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-modal-nombre',
  standalone: true,
  imports: [ CommonModule, ReactiveFormsModule, MatDialogModule, /* otros */ ]
  templateUrl: './modal-nombre.component.html',
})
export class ModalNombreComponent implements OnInit {
  constructor(
    private readonly fb: FormBuilder,
    private readonly dialogRef: MatDialogRef<ModalNombreComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any  // tipado con la entidad que corresponda
  ) {}

  cerrar(): void {
    this.dialogRef.close();            // sin resultado
  }

  confirmar(): void {
    this.dialogRef.close(resultado);   // devuelve dato al componente padre
  }
}
```

Apertura desde el componente padre:
```typescript
const dialogRef = this.dialog.open(ModalNombreComponent, {
  width: '600px',
  data: { id: elemento.id, nombre: elemento.nombre }
});
dialogRef.afterClosed().subscribe(resultado => {
  if (resultado) this.cargarDatos();  // refrescar si hubo cambios
});
```

## Rutas y guards
- **`authGuard`** — requiere sesión activa (cualquier rol)
- **`roleGuard`** — requiere rol específico con `data: { roles: ['Admin', 'Revisor'] }`
- Roles disponibles: `'Admin'`, `'Revisor'`, `'Usuario'`

```typescript
// app.routes.ts
{
  path: 'nueva-ruta',
  component: NuevoComponenteComponent,
  canActivate: [roleGuard],
  data: { roles: ['Admin'] }
}
```

## Roles y sesión de usuario
```typescript
private readonly authService = inject(AuthService);

get esAdmin(): boolean  { return this.authService.isAdmin(); }   // Solo Admin
get esRevisor(): boolean { return this.authService.isRevisor(); } // Admin + Revisor

## Reglas generales
1. **Nunca hardcodear** arrays de opciones, estados, tipos — siempre cargar del backend
2. **Nunca hardcodear** URLs — usar `environment.apiBaseUrl`
3. Todos los componentes son **standalone** — declarar siempre en `imports: [...]`
4. Importar **solo los módulos Angular Material necesarios** en cada componente
5. Mostrar **indicadores de carga** (`cargando`, `guardando`) con `<mat-spinner>` en operaciones async
6. Usar `inject()` para inyección de dependencias en componentes; en servicios también es válido `inject()` o constructor
7. Las **interfaces/DTOs** se definen y exportan desde el archivo de servicio que las usa
8. Los `subscribe()` deben manejar siempre **`next`** y **`error`**; nunca dejar el error sin manejar
9. Los formularios reactivos usan `FormBuilder` + `Validators`; los campos con `{ disabled: true }` se leen con `.getRawValue()`
10. Para tablas usar `MatTableDataSource` — permite filtrado y paginación
11. Las listas de tipo enum que vienen del backend (ej: resultados de contacto) se mapean a `string[]` con `.map(r => r.nombre)` cuando se usan como valores de select sin necesitar el id

## Comando de compilación
```powershell
cd "d:\Proyectos\Java\casilda\sistema-casilda-fnsp"
npm run build
```
El output se genera en `dist/casilda-fnsp/`.
