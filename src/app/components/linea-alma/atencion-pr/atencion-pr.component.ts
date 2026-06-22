import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, finalize, forkJoin, Observable, of } from 'rxjs';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTableModule } from '@angular/material/table';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../../services/auth.service';
import { ModalDireccionComponent } from '../../modal-direccion/modal-direccion.component';
import { ModalDiscapacidadComponent } from '../../modal-discapacidad/modal-discapacidad.component';
import { ModalCorreoComponent } from '../../modal-correo/modal-correo.component';
import { ModalTelefonoComponent } from '../../modal-telefono/modal-telefono.component';
import { ModalRemisionComponent } from '../../modal-remision/modal-remision.component';
import { ListasService, MaestroDto } from '../../../services/listas.service';
import { UsuarioDto, UsuarioService } from '../../../services/usuario.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DialogoExitoComponent } from '../../dialog-exito/dialog-exito.component';
import {
  AtencionAphRequestDto,
  ContactoLineaAlmaResponseDto,
  LineaAlmaService,
  RegistroLineaAlmaRequestDto,
  RemisionRegistroAlmaRequestDto
} from '../../../services/linea-alma.service';
import { GrupoProfesionalDto, SolicitudService } from '../../../services/solicitud.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-atencion-pr',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTableModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './atencion-pr.component.html',
  styleUrl: './atencion-pr.component.scss'
})
export class AtencionPrComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly listasService = inject(ListasService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly lineaAlmaService = inject(LineaAlmaService);
  private readonly solicitudService = inject(SolicitudService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly http = inject(HttpClient);
  private readonly maestrosUrl = `${environment.apiBaseUrl}/maestros`;

  registroCasoForm!: FormGroup;
  cargandoCatalogos = false;
  guardandoRegistro = false;
  buscandoPersona = false;
  tabSeleccionada = 0;
  idRegistroCreado: number | null = null;
  idPersonaEncontrada: number | null = null;
  tiposReporteAlma: MaestroDto[] = [];
  canalesContacto: MaestroDto[] = [];
  tiposDocumento: MaestroDto[] = [];
  regimenes: MaestroDto[] = [];
  eps: MaestroDto[] = [];
  departamentos: MaestroDto[] = [];
  municipiosNacimiento: MaestroDto[] = [];
  municipiosResidencia: MaestroDto[] = [];
  sexos: MaestroDto[] = [];
  identidadesGenero: MaestroDto[] = [];
  orientacionesSexuales: MaestroDto[] = [];
  etnias: MaestroDto[] = [];
  vinculos: MaestroDto[] = [];
  facultades: MaestroDto[] = [];
  programas: MaestroDto[] = [];
  programasFiltrados: MaestroDto[] = [];
  dependencias: MaestroDto[] = [];
  campus: MaestroDto[] = [];
  aphProtocolos: MaestroDto[] = [];
  aphResultadosTriage: MaestroDto[] = [];
  usuarios: UsuarioDto[] = [];
  gruposProfesionales: GrupoProfesionalDto[] = [];
  readonly tipoServicioAphId = 5;
  // TODO: reemplazar por maestro del backend cuando exista (`obtenerMaestro('actores-remitentes')`).
  readonly actoresRemitentes: string[] = [
    'Bienestar Universitario',
    'Masculinidades',
    'Otros'
  ];
  discapacidadesRegistradas: any[] = [];
  correoRegistrados: any[] = [];
  telefonosRegistrados: any[] = [];
  remisionesRegistrados: any[] = [];
  resultadosContacto: MaestroDto[] = [];
  contactosRegistrados: ContactoLineaAlmaResponseDto[] = [];
  cargandoContactos = false;
  guardandoContacto = false;
  contactoFechaCtrl = new FormControl<string>(this.formatearFechaParaDatetimeLocal(new Date()), { nonNullable: true, validators: [Validators.required] });
  contactoResultadoCtrl = new FormControl<number | null>(null, { validators: [Validators.required] });
  readonly remisionDefaults = {
    canal: 'Remisión',
    tipoAtencion: 'Remisión',
    tipoServicio: 'Atención APH'
  };
  ngOnInit(): void {
    this.registroCasoForm = this.fb.group({
      tipoReporte: ['', Validators.required],
      canal: [{ value: '', disabled: true }, Validators.required],
      tipoAtencion: [{ value: '', disabled: true }],
      quienRemite: [{ value: '', disabled: true }, Validators.required],
      fechaHora: [{ value: this.formatearFechaParaDatetimeLocal(new Date()), disabled: true }, Validators.required],
      personaAtiende: [{ value: '', disabled: true }, Validators.required],
      tipoServicio: [{ value: 'Atención APH', disabled: true }],
      documento: [''],
      tipoDocumento: [''],
      fechaNacimiento: [''],
      primerNombre: [''],
      segundoNombre: [''],
      primerApellido: [''],
      segundoApellido: [''],
      eps: [''],
      regimenSalud: [''],
      departamentoNacimiento: [''],
      ciudadNacimiento: [''],
      departamentoResidencia: [''],
      ciudadResidencia: [''],
      sexo: [''],
      identidadSexual: ['', Validators.required],
      orientacionSexual: [''],
      etnia: [''],
      direccionResidencia: [''],
      vinculo: [''],
      facultad: [{ value: '', disabled: true }],
      programa: [{ value: '', disabled: true }],
      dependencia: [{ value: '', disabled: true }],
      campus: [{ value: '', disabled: true }],
      aphFecha: ['', Validators.required],
      aphHora: ['', Validators.required],
      aphProtocolo: ['', Validators.required],
      aphPracticoTriage: ['si', Validators.required],
      aphResultadoTriage: ['', Validators.required],
      aphMotivoNoRealizacionTriage: [''],
      aphNotaAph: [''],
      aphAceptaPsicologia: ['si', Validators.required],
      aphRequiereRemision: ['si', Validators.required]
    });

    this.cargarCatalogos();
    this.configurarValidadoresTriage();
    this.configurarDependenciaCamposPorVinculo();
    this.configurarDependenciaProgramasPorFacultad();

    this.registroCasoForm.get('tipoReporte')?.valueChanges.subscribe((valor) => {
      const esDirecta = valor === 'directa';
      const esRemision = valor === 'indirecta';

      const controls = [
        'canal',
        'tipoAtencion',
        'quienRemite',
        'fechaHora',
        'personaAtiende',
        'tipoServicio'
      ];
      controls.forEach((campo) => this.registroCasoForm.get(campo)?.disable({ emitEvent: false }));

      if (!esDirecta && !esRemision) {
        this.registroCasoForm.patchValue(
          {
            canal: '',
            tipoAtencion: '',
            quienRemite: '',
            fechaHora: '',
            personaAtiende: this.obtenerIdUsuarioActual(),
            tipoServicio: this.remisionDefaults.tipoServicio
          },
          { emitEvent: false }
        );
        return;
      }

      if (esDirecta) {
        this.registroCasoForm.patchValue(
          {
            tipoAtencion: 'Directa',
            quienRemite: '',
            canal: '',
            fechaHora: this.formatearFechaParaDatetimeLocal(new Date()),
            personaAtiende: this.obtenerIdUsuarioActual(),
            tipoServicio: this.remisionDefaults.tipoServicio
          },
          { emitEvent: false }
        );

        ['canal'].forEach((campo) => {
          this.registroCasoForm.get(campo)?.enable({ emitEvent: false });
        });

        this.registroCasoForm.get('fechaHora')?.disable({ emitEvent: false });
        this.registroCasoForm.get('personaAtiende')?.disable({ emitEvent: false });

        return;
      }

      this.registroCasoForm.patchValue(
        {
          canal: '',
          tipoAtencion: this.remisionDefaults.tipoAtencion,
          fechaHora: this.formatearFechaParaDatetimeLocal(new Date()),
          personaAtiende: this.obtenerIdUsuarioActual(),
          tipoServicio: this.remisionDefaults.tipoServicio
        },
        { emitEvent: false }
      );

      ['canal', 'quienRemite'].forEach((campo) => {
        this.registroCasoForm.get(campo)?.enable({ emitEvent: false });
      });

      ['tipoAtencion', 'fechaHora', 'tipoServicio', 'personaAtiende'].forEach((campo) => {
        this.registroCasoForm.get(campo)?.disable({ emitEvent: false });
      });
    });
  }

  private cargarCatalogos(): void {
    this.cargandoCatalogos = true;

    forkJoin({
      tiposReporteAlma: this.listasService.obtenerMaestro('tipos-reporte-alma'),
      canalesContacto: this.listasService.obtenerMaestro('canales-contacto'),
      tiposDocumento: this.listasService.obtenerMaestro('tipos-identificacion'),
      regimenes: this.listasService.obtenerMaestro('regimenes'),
      eps: this.listasService.obtenerMaestro('eps'),
      departamentos: this.listasService.obtenerMaestro('departamentos'),
      sexos: this.listasService.obtenerMaestro('sexos'),
      identidadesGenero: this.listasService.obtenerMaestro('identidades-genero'),
      orientacionesSexuales: this.listasService.obtenerMaestro('orientaciones-sexuales'),
      etnias: this.listasService.obtenerMaestro('etnias'),
      vinculos: this.listasService.obtenerMaestro('vinculos-udea'),
      facultades: this.listasService.obtenerMaestro('facultades'),
      programas: this.listasService.obtenerMaestro('programas'),
      dependencias: this.listasService.obtenerMaestro('dependencias'),
      campus: this.listasService.obtenerMaestro('campus'),
      aphProtocolos: this.listasService.obtenerMaestro('protocolos-aph'),
      aphResultadosTriage: this.listasService.obtenerMaestro('resultados-triage'),
      resultadosContacto: this.listasService.obtenerMaestro('resultados-contacto-telefonico'),
      usuarios: this.usuarioService.obtenerTodos(),
      gruposProfesionales: this.solicitudService.listarGruposProfesionales()
    }).subscribe({
      next: (catalogos) => {
        this.tiposReporteAlma = catalogos.tiposReporteAlma;
        this.canalesContacto = catalogos.canalesContacto;
        this.tiposDocumento = catalogos.tiposDocumento;
        this.regimenes = catalogos.regimenes;
        this.eps = catalogos.eps;
        this.departamentos = catalogos.departamentos;
        this.configurarDependenciaMunicipios();
        this.sexos = catalogos.sexos;
        this.identidadesGenero = catalogos.identidadesGenero;
        this.orientacionesSexuales = catalogos.orientacionesSexuales;
        this.etnias = catalogos.etnias;
        this.vinculos = catalogos.vinculos;
        this.facultades = catalogos.facultades;
        this.programas = catalogos.programas;
        this.dependencias = catalogos.dependencias;
        this.campus = catalogos.campus;
        this.aphProtocolos = catalogos.aphProtocolos;
        this.aphResultadosTriage = catalogos.aphResultadosTriage;
        this.resultadosContacto = catalogos.resultadosContacto;
        this.usuarios = catalogos.usuarios;
        this.gruposProfesionales = catalogos.gruposProfesionales;

        this.configurarValoresPorDefecto();
        this.cargandoCatalogos = false;
      },
      error: () => {
        this.cargandoCatalogos = false;
      }
    });
  }

  private readonly camposMeta: Record<string, { etiqueta: string; tab: number }> = {
    tipoReporte: { etiqueta: 'Tipo de solicitud', tab: 0 },
    canal: { etiqueta: 'Canal de comunicación', tab: 0 },
    quienRemite: { etiqueta: 'Quién remite', tab: 0 },
    fechaHora: { etiqueta: 'Fecha y hora', tab: 0 },
    personaAtiende: { etiqueta: 'APH que atiende', tab: 0 },
    identidadSexual: { etiqueta: 'Identidad de género', tab: 1 },
    aphFecha: { etiqueta: 'APH: Fecha', tab: 3 },
    aphHora: { etiqueta: 'APH: Hora', tab: 3 },
    aphProtocolo: { etiqueta: 'APH: Protocolo', tab: 3 },
    aphPracticoTriage: { etiqueta: 'APH: ¿Practicó triage?', tab: 3 },
    aphResultadoTriage: { etiqueta: 'APH: Resultado del triage', tab: 3 },
    aphMotivoNoRealizacionTriage: { etiqueta: 'APH: Motivo de no realización del triage', tab: 3 },
    aphAceptaPsicologia: { etiqueta: 'APH: ¿Acepta atención por psicología?', tab: 3 },
    aphRequiereRemision: { etiqueta: 'APH: ¿Requiere remisión?', tab: 3 }
  };

  private obtenerNombresInvalidos(): string[] {
    return Object.keys(this.registroCasoForm.controls).filter((nombre) => {
      const control = this.registroCasoForm.get(nombre);
      return !!control && control.enabled && control.invalid;
    });
  }

  private describirCamposInvalidos(): string {
    return this.obtenerNombresInvalidos()
      .map((nombre) => this.camposMeta[nombre]?.etiqueta ?? nombre)
      .join(', ');
  }

  private tabDelPrimerCampoInvalido(): number | null {
    for (const nombre of this.obtenerNombresInvalidos()) {
      const meta = this.camposMeta[nombre];
      if (meta) {
        return meta.tab;
      }
    }
    return null;
  }

  private configurarValidadoresTriage(): void {
    const resultado = this.registroCasoForm.get('aphResultadoTriage');
    const motivo = this.registroCasoForm.get('aphMotivoNoRealizacionTriage');

    this.registroCasoForm.get('aphPracticoTriage')?.valueChanges.subscribe((valor) => {
      if (valor === 'si') {
        resultado?.setValidators([Validators.required]);
        motivo?.clearValidators();
      } else {
        motivo?.setValidators([Validators.required]);
        resultado?.clearValidators();
      }
      resultado?.updateValueAndValidity({ emitEvent: false });
      motivo?.updateValueAndValidity({ emitEvent: false });
    });
  }

  private configurarDependenciaCamposPorVinculo(): void {
    this.registroCasoForm.get('vinculo')?.valueChanges.subscribe((vinculoId) => {
      const vinculo = this.vinculos.find((v) => v.id === Number(vinculoId));
      this.categoriaVinculo = vinculo ? this.clasificarVinculo(vinculo.nombre) : 'ninguno';

      ['facultad', 'programa', 'dependencia', 'campus'].forEach((nombre) => {
        const ctrl = this.registroCasoForm.get(nombre);
        ctrl?.setValue('', { emitEvent: false });
        ctrl?.disable({ emitEvent: false });
      });
      this.programasFiltrados = [];

      if (this.categoriaVinculo !== 'ninguno') {
        this.registroCasoForm.get('facultad')?.enable({ emitEvent: false });
        this.registroCasoForm.get('dependencia')?.enable({ emitEvent: false });
        this.registroCasoForm.get('campus')?.enable({ emitEvent: false });
        // Programa permanece deshabilitado hasta elegir facultad,
        // y solo si la categoría es estudiante/otro vínculo.
      }
    });
  }

  private configurarDependenciaProgramasPorFacultad(): void {
    const programaCtrl = this.registroCasoForm.get('programa');
    this.registroCasoForm.get('facultad')?.valueChanges.subscribe((facultadId) => {
      programaCtrl?.setValue('', { emitEvent: false });
      this.programasFiltrados = [];

      if (!facultadId || this.categoriaVinculo !== 'con-programa') {
        programaCtrl?.disable({ emitEvent: false });
        return;
      }
      this.cargarProgramasPorFacultad(Number(facultadId)).subscribe((lista) => {
        this.programasFiltrados = lista;
        if (lista.length > 0) {
          programaCtrl?.enable({ emitEvent: false });
        } else {
          programaCtrl?.disable({ emitEvent: false });
        }
      });
    });
  }

  // TODO: reemplazar por el endpoint real cuando el backend exponga
  // /maestros/facultades/{id}/programas. Mientras tanto, filtramos en cliente
  // si los programas trajeran metadata; en su defecto devolvemos vacío para
  // forzar que el usuario consulte al área correspondiente.
  private cargarProgramasPorFacultad(facultadId: number): Observable<MaestroDto[]> {
    return this.http
      .get<MaestroDto[]>(`${this.maestrosUrl}/facultades/${facultadId}/programas`)
      .pipe(catchError(() => of(this.programas)));
  }

  private configurarDependenciaMunicipios(): void {
    this.registroCasoForm.get('departamentoNacimiento')?.valueChanges.subscribe((departamentoId) => {
      this.registroCasoForm.patchValue({ ciudadNacimiento: '' }, { emitEvent: false });
      this.municipiosNacimiento = [];
      if (departamentoId) {
        this.cargarMunicipiosPorDepartamento(Number(departamentoId), 'nacimiento');
      }
    });

    this.registroCasoForm.get('departamentoResidencia')?.valueChanges.subscribe((departamentoId) => {
      this.registroCasoForm.patchValue({ ciudadResidencia: '' }, { emitEvent: false });
      this.municipiosResidencia = [];
      if (departamentoId) {
        this.cargarMunicipiosPorDepartamento(Number(departamentoId), 'residencia');
      }
    });
  }

  private cargarMunicipiosPorDepartamento(departamentoId: number, destino: 'nacimiento' | 'residencia'): void {
    this.http.get<MaestroDto[]>(`${this.maestrosUrl}/departamentos/${departamentoId}/ciudades`).subscribe({
      next: (lista) => {
        if (destino === 'nacimiento') {
          this.municipiosNacimiento = lista;
        } else {
          this.municipiosResidencia = lista;
        }
      },
      error: () => {
        if (destino === 'nacimiento') {
          this.municipiosNacimiento = [];
        } else {
          this.municipiosResidencia = [];
        }
      }
    });
  }

  private configurarValoresPorDefecto(): void {
    if (!this.registroCasoForm.get('aphResultadoTriage')?.value && this.aphResultadosTriage.length > 0) {
      this.registroCasoForm.get('aphResultadoTriage')?.setValue(this.aphResultadosTriage[0].id, { emitEvent: false });
    }

    if (!this.registroCasoForm.get('personaAtiende')?.value) {
      this.registroCasoForm.get('personaAtiende')?.setValue(this.obtenerIdUsuarioActual(), { emitEvent: false });
    }
  }

  private obtenerIdCanalRemision(): number | null {
    const canalRemision = this.canalesContacto.find((canal) => canal.nombre.toLowerCase().includes('remisi'));
    return canalRemision?.id ?? null;
  }

  private obtenerIdUsuarioActual(): number | null {
    const usuario = this.usuarios.find((u) => u.email === this.authService.currentUser?.email);
    return usuario?.id ?? null;
  }

  get nombreUsuarioActual(): string {
    return this.authService.currentUser?.nombre ?? '';
  }

  get canalesContactoSinRemision(): MaestroDto[] {
    return this.canalesContacto.filter((canal) => !canal.nombre.toLowerCase().includes('remisi'));
  }

  get vinculosFiltrados(): MaestroDto[] {
    return this.vinculos.filter((v) => {
      const n = v.nombre.trim().toLowerCase();
      if (/t[eé]cnic/.test(n)) return false;
      if (n === 'n/a' || n === 'na' || n === 'n.a.' || n === 'no aplica') return false;
      return true;
    });
  }

  private categoriaVinculo: 'con-programa' | 'sin-programa' | 'ninguno' = 'ninguno';

  // con-programa  → habilita Facultad, Programa, Dependencia, Campus
  // sin-programa  → habilita Facultad, Dependencia, Campus (sin Programa)
  // ninguno       → todos deshabilitados
  private clasificarVinculo(nombre: string): 'con-programa' | 'sin-programa' | 'ninguno' {
    const n = nombre.toLowerCase();

    // Docentes y Jubilado: sin Programa.
    if (n.includes('docente') || n.includes('jubilad')) {
      return 'sin-programa';
    }

    // Estudiantes (pregrado/tecnología/posgrado), Otro tipo de vínculo,
    // Prestador de Servicios, Pensionado, Contratista, Externo, Otro: con Programa.
    if (/estudiante.*(pregrado|tecnolog|posgrado)/.test(n)) return 'con-programa';
    if (n.includes('otro')) return 'con-programa';
    if (n.includes('prestador')) return 'con-programa';
    if (n.includes('pensionad')) return 'con-programa';
    if (n.includes('contratista')) return 'con-programa';
    if (n.includes('externo')) return 'con-programa';

    return 'ninguno';
  }

  private formatearFechaParaDatetimeLocal(fecha: Date): string {
    const yyyy = fecha.getFullYear();
    const mm = String(fecha.getMonth() + 1).padStart(2, '0');
    const dd = String(fecha.getDate()).padStart(2, '0');
    const hh = String(fecha.getHours()).padStart(2, '0');
    const min = String(fecha.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  }

  private readonly longitudesPorTipoDocumento: Record<string, number> = {
    CC: 10, TI: 11, CE: 7, RC: 11, NUIP: 11, NIP: 11, PA: 12
  };

  get maxLongitudDocumento(): number {
    const tipoId = this.registroCasoForm?.get('tipoDocumento')?.value;
    if (!tipoId) {
      return 12;
    }
    const tipo = this.tiposDocumento.find((t) => t.id === Number(tipoId));
    const clave = (tipo?.codigo || tipo?.nombre || '').toUpperCase().trim();
    for (const key of Object.keys(this.longitudesPorTipoDocumento)) {
      if (clave.includes(key)) {
        return this.longitudesPorTipoDocumento[key];
      }
    }
    return 12;
  }

  soloDigitos(event: Event): void {
    const input = event.target as HTMLInputElement;
    const limpio = input.value.replace(/\D/g, '').slice(0, this.maxLongitudDocumento);
    if (input.value !== limpio) {
      input.value = limpio;
      this.registroCasoForm.get('documento')?.setValue(limpio, { emitEvent: false });
    }
  }

  abrirModalDireccion(): void {
    const dialogRef = this.dialog.open(ModalDireccionComponent, { width: '600px' });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }

      const { viaPrincipal, numeroVia, letraVia, numeroCruce, placa, barrio, municipio, departamento, complemento } = result;
      const letra = letraVia ? ` ${letraVia}` : '';
      const comp = complemento ? `, ${complemento}` : '';
      const direccionFinal = `${viaPrincipal} ${numeroVia}${letra} #${numeroCruce}-${placa}, Barrio ${barrio}${comp}, ${municipio}, ${departamento}`;

      this.registroCasoForm.patchValue(
        { direccionResidencia: direccionFinal.replace(/\s+/g, ' ').trim() },
        { emitEvent: false }
      );
    });
  }

  abrirModalDiscapacidad(): void {
    const dialogRef = this.dialog.open(ModalDiscapacidadComponent, {
      width: '800px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.discapacidadesRegistradas = [...this.discapacidadesRegistradas, result];
      }
    });
  }

  abrirModalCorreo(): void {
    const dialogRef = this.dialog.open(ModalCorreoComponent, {
      width: '800px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.correoRegistrados = [...this.correoRegistrados, result];
      }
    });
  }

  abrirModalTelefono(): void {
    const dialogRef = this.dialog.open(ModalTelefonoComponent, {
      width: '800px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.telefonosRegistrados = [...this.telefonosRegistrados, result];
      }
    });
  }

  abrirModalRemision(): void {
    const dialogRef = this.dialog.open(ModalRemisionComponent, {
      width: '800px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.remisionesRegistrados = [...this.remisionesRegistrados, result];
      }
    });
  }

  buscarPersona(event?: Event): void {
    event?.preventDefault();

    const tipoDocumentoId = Number(this.registroCasoForm.get('tipoDocumento')?.value);
    const documento = String(this.registroCasoForm.get('documento')?.value ?? '').trim();

    if (!tipoDocumentoId) {
      this.snackBar.open('Selecciona el tipo de documento.', 'Cerrar', { duration: 3000 });
      return;
    }
    if (!documento) {
      this.snackBar.open('Ingresa el número de documento.', 'Cerrar', { duration: 3000 });
      return;
    }

    this.buscandoPersona = true;
    this.idPersonaEncontrada = null;

    this.solicitudService.buscarPersonaPorDocumento(tipoDocumentoId, documento)
      .pipe(finalize(() => { this.buscandoPersona = false; }))
      .subscribe({
        next: (res) => {
          const idPersona = Number(res.id);
          if (idPersona) {
            this.idPersonaEncontrada = idPersona;
          }

          this.registroCasoForm.patchValue({
            tipoDocumento: res.tipoDocumentoId ?? tipoDocumentoId,
            documento: res.numeroDocumento ?? documento,
            fechaNacimiento: res.fechaNacimiento ? new Date(res.fechaNacimiento + 'T00:00:00') : null,
            primerNombre: res.primerNombre ?? '',
            segundoNombre: res.segundoNombre ?? '',
            primerApellido: res.primerApellido ?? '',
            segundoApellido: res.segundoApellido ?? ''
          }, { emitEvent: false });

          if (res.correos?.length) {
            this.correoRegistrados = res.correos.map(c => ({
              tipoId: c.tipoId,
              tipo: c.tipo ?? '',
              correo: c.correo,
              descripcion: c.descripcion ?? ''
            }));
          }
          if (res.telefonos?.length) {
            this.telefonosRegistrados = res.telefonos.map(t => ({
              tipoId: t.tipoId,
              tipo: t.tipo ?? '',
              telefono: t.telefono,
              descripcion: t.descripcion ?? ''
            }));
          }

          this.snackBar.open('Persona encontrada.', 'Cerrar', { duration: 2500 });
        },
        error: (err) => {
          const mensaje = err?.error?.message || 'No se encontró ninguna persona con ese documento.';
          this.snackBar.open(mensaje, 'Cerrar', { duration: 5000 });
        }
      });
  }

  guardarRegistro(): void {
    if (this.registroCasoForm.invalid) {
      this.registroCasoForm.markAllAsTouched();
      const tab = this.tabDelPrimerCampoInvalido();
      if (tab !== null) {
        this.tabSeleccionada = tab;
      }
      const detalle = this.describirCamposInvalidos();
      const mensaje = detalle
        ? `Faltan campos obligatorios: ${detalle}`
        : 'Completa los campos obligatorios para guardar el registro.';
      this.snackBar.open(mensaje, 'Cerrar', { duration: 7000 });
      return;
    }

    const tipoDocumentoId = Number(this.registroCasoForm.get('tipoDocumento')?.value);
    const documento = String(this.registroCasoForm.get('documento')?.value ?? '').trim();

    if (!tipoDocumentoId || !documento) {
      this.snackBar.open('Debes ingresar tipo y número de documento para identificar la persona.', 'Cerrar', { duration: 4000 });
      return;
    }

    const idUsuario = this.obtenerIdUsuarioActual();
    if (!idUsuario) {
      this.snackBar.open('No se pudo identificar al usuario actual. Vuelve a iniciar sesión o espera a que carguen los catálogos.', 'Cerrar', { duration: 6000 });
      return;
    }

    this.guardandoRegistro = true;

    if (this.idPersonaEncontrada) {
      this.enviarRegistro(this.construirPayloadRegistro(this.idPersonaEncontrada));
      return;
    }

    this.solicitudService.buscarPersonaPorDocumento(tipoDocumentoId, documento)
      .subscribe({
        next: (persona) => {
          const idPersona = Number(persona.id);
          if (!idPersona) {
            this.guardandoRegistro = false;
            this.snackBar.open(
              'No se pudo obtener el ID de la persona desde la búsqueda por documento.',
              'Cerrar',
              { duration: 6000 }
            );
            return;
          }

          this.idPersonaEncontrada = idPersona;
          this.enviarRegistro(this.construirPayloadRegistro(idPersona));
        },
        error: (error) => {
          this.guardandoRegistro = false;
          const mensaje = error?.error?.message
            ?? 'No se encontró la persona por documento. Búscala primero desde "Datos de la persona".';
          this.snackBar.open(mensaje, 'Cerrar', { duration: 5500 });
        }
      });
  }

  private enviarRegistro(payload: RegistroLineaAlmaRequestDto): void {
    this.guardandoRegistro = true;
    this.lineaAlmaService.crearRegistro(payload)
      .pipe(finalize(() => { this.guardandoRegistro = false; }))
      .subscribe({
        next: (response) => {
          this.idRegistroCreado = response.id;
          this.cargarContactos(response.id);
          this.dialog.open(DialogoExitoComponent, {
            width: '400px',
            data: {
              titulo: '¡Registro Creado!',
              mensaje: `Registro Línea ALMA creado con ID ${response.id}.`
            }
          });
        },
        error: (error) => {
          const mensaje = error?.error?.message || 'No fue posible guardar el registro de Linea ALMA.';
          this.snackBar.open(mensaje, 'Cerrar', { duration: 5500 });
        }
      });
  }

  private construirPayloadRegistro(idPersona: number): RegistroLineaAlmaRequestDto {
    const raw = this.registroCasoForm.getRawValue();
    const idTipoReporte = this.obtenerIdTipoReporte(raw.tipoReporte);

    if (!idTipoReporte) {
      throw new Error('No fue posible resolver el tipo de reporte.');
    }

    const atencionAph: AtencionAphRequestDto = {
      idCanalAph: null,
      fechaHora: this.combinarFechaHora(raw.aphFecha, raw.aphHora),
      idConvenioAph: null,
      idAmbitoAph: null,
      idProtocoloAph: Number(raw.aphProtocolo),
      practicoTriage: raw.aphPracticoTriage === 'si',
      idResultadoTriage: raw.aphPracticoTriage === 'si' ? Number(raw.aphResultadoTriage) : null,
      notaOMotivoTriage: raw.aphPracticoTriage === 'no' ? (raw.aphMotivoNoRealizacionTriage || null) : null,
      notaAph: raw.aphNotaAph || null,
      aceptaPsicologia: raw.aphAceptaPsicologia === 'si',
      requiereRemision: raw.aphRequiereRemision === 'si'
    };

    const remisiones: RemisionRegistroAlmaRequestDto[] = (this.remisionesRegistrados ?? []).map((r) => ({
      idTipoRemision: Number(r.idTipoRemision),
      cual: r.cual || null,
      fecha: this.toIsoDateTime(r.fecha)
    }));

    const idUsuario = this.obtenerIdUsuarioActual() ?? 0;

    return {
      idPersona,
      idTipoReporte,
      idCanalContacto: Number(raw.canal),
      quienRemite: raw.tipoReporte === 'indirecta' ? (raw.quienRemite || null) : null,
      fechaHoraAtencion: this.toIsoDateTime(raw.fechaHora || new Date()),
      idPersonaAtiende: Number(raw.personaAtiende) || idUsuario,
      idTipoServicio: this.tipoServicioAphId,
      idPersonaRegistra: idUsuario,
      idLugarEntrevista: null,
      idIdentidadGenero: Number(raw.identidadSexual),
      idOrientacionSexual: raw.orientacionSexual ? Number(raw.orientacionSexual) : null,
      idEtnia: raw.etnia ? Number(raw.etnia) : null,
      idCiudadResidencia: raw.ciudadResidencia ? Number(raw.ciudadResidencia) : null,
      direccionResidencia: raw.direccionResidencia || null,
      idVinculoUdeA: raw.vinculo ? Number(raw.vinculo) : null,
      idSubVinculoUdeA: null,
      idFacultad: raw.facultad ? Number(raw.facultad) : null,
      idPrograma: raw.programa ? Number(raw.programa) : null,
      idDependencia: raw.dependencia ? Number(raw.dependencia) : null,
      idCampus: raw.campus ? Number(raw.campus) : null,
      atencionAph,
      remisiones
    };
  }

  private obtenerIdTipoReporte(valor: string): number | null {
    if (valor === 'directa') {
      return this.tiposReporteAlma.find((t) => t.nombre.toLowerCase().includes('direct'))?.id ?? null;
    }
    if (valor === 'indirecta') {
      return this.tiposReporteAlma.find((t) => t.nombre.toLowerCase().includes('remisi'))?.id ?? null;
    }
    return null;
  }

  private combinarFechaHora(fecha: Date | string, hora: string): string {
    const fechaBase = this.formatearSoloFecha(fecha);
    const horaBase = hora && hora.length >= 5 ? `${hora}:00` : '00:00:00';
    return `${fechaBase}T${horaBase}`;
  }

  private formatearSoloFecha(value: Date | string): string {
    const fecha = value instanceof Date ? value : new Date(value);
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private toIsoDateTime(value: Date | string): string {
    if (value instanceof Date) {
      const year = value.getFullYear();
      const month = String(value.getMonth() + 1).padStart(2, '0');
      const day = String(value.getDate()).padStart(2, '0');
      const hours = String(value.getHours()).padStart(2, '0');
      const minutes = String(value.getMinutes()).padStart(2, '0');
      const seconds = String(value.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    }
    return value.length === 16 ? `${value}:00` : value;
  }

  eliminarDiscapacidad(i: number): void {
    this.discapacidadesRegistradas.splice(i, 1);
    this.discapacidadesRegistradas = [...this.discapacidadesRegistradas];
  }

  eliminarCorreo(i: number): void {
    this.correoRegistrados.splice(i, 1);
    this.correoRegistrados = [...this.correoRegistrados];
  }

  eliminarTelefono(i: number): void {
    this.telefonosRegistrados.splice(i, 1);
    this.telefonosRegistrados = [...this.telefonosRegistrados];
  }

  eliminarRemision(i: number): void {
    this.remisionesRegistrados.splice(i, 1);
    this.remisionesRegistrados = [...this.remisionesRegistrados];
  }

  cargarContactos(idRegistro: number): void {
    this.cargandoContactos = true;
    this.lineaAlmaService.listarContactos(idRegistro)
      .pipe(finalize(() => { this.cargandoContactos = false; }))
      .subscribe({
        next: (lista) => { this.contactosRegistrados = lista; },
        error: () => { this.contactosRegistrados = []; }
      });
  }

  registrarIntentoContacto(): void {
    if (!this.idRegistroCreado) {
      this.snackBar.open('Primero guarda el registro Línea ALMA.', 'Cerrar', { duration: 4000 });
      return;
    }
    if (this.contactoFechaCtrl.invalid || this.contactoResultadoCtrl.invalid) {
      this.contactoFechaCtrl.markAsTouched();
      this.contactoResultadoCtrl.markAsTouched();
      return;
    }

    const idResultado = Number(this.contactoResultadoCtrl.value);
    const fecha = this.toIsoDateTime(this.contactoFechaCtrl.value);

    this.guardandoContacto = true;
    this.lineaAlmaService.registrarContacto(this.idRegistroCreado, { fecha, idResultado })
      .pipe(finalize(() => { this.guardandoContacto = false; }))
      .subscribe({
        next: (contacto) => {
          this.contactosRegistrados = [...this.contactosRegistrados, contacto];
          this.contactoFechaCtrl.setValue(this.formatearFechaParaDatetimeLocal(new Date()));
          this.contactoResultadoCtrl.setValue(null);
          this.contactoResultadoCtrl.markAsUntouched();
          this.snackBar.open('Intento de contacto registrado.', 'Cerrar', { duration: 3000 });
        },
        error: (error) => {
          const mensaje = error?.error?.message ?? 'No fue posible registrar el intento de contacto.';
          this.snackBar.open(mensaje, 'Cerrar', { duration: 5000 });
        }
      });
  }

}
