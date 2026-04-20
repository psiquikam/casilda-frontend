import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';
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
import {
  AtencionAphRequestDto,
  LineaAlmaService,
  RegistroLineaAlmaRequestDto,
  RemisionRegistroAlmaRequestDto
} from '../../../services/linea-alma.service';
import { SolicitudService } from '../../../services/solicitud.service';
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
  idRegistroCreado: number | null = null;
  idPersonaEncontrada: number | null = null;
  tiposReporteAlma: MaestroDto[] = [];
  canalesContacto: MaestroDto[] = [];
  formasEntrevista: MaestroDto[] = [];
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
  subVinculos: MaestroDto[] = [];
  facultades: MaestroDto[] = [];
  programas: MaestroDto[] = [];
  dependencias: MaestroDto[] = [];
  campus: MaestroDto[] = [];
  aphCanales: MaestroDto[] = [];
  aphConvenios: MaestroDto[] = [];
  aphAmbitos: MaestroDto[] = [];
  aphProtocolos: MaestroDto[] = [];
  aphResultadosTriage: MaestroDto[] = [];
  usuarios: UsuarioDto[] = [];
  readonly tipoServicioAphId = 5;
  discapacidadesRegistradas: any[] = [];
  correoRegistrados: any[] = [];
  telefonosRegistrados: any[] = [];
  remisionesRegistrados: any[] = [];
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
      fechaHora: [{ value: '', disabled: true }, Validators.required],
      personaAtiende: [{ value: '', disabled: true }, Validators.required],
      tipoServicio: [{ value: 'Atención APH', disabled: true }],
      personaRegistra: [{ value: this.obtenerIdUsuarioActual(), disabled: true }, Validators.required],
      formaLugarEntrevista: [{ value: '', disabled: true }, Validators.required],
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
      identidadSexual: [''],
      orientacionSexual: [''],
      etnia: [''],
      direccionResidencia: [''],
      vinculo: ['', Validators.required],
      subVinculo: ['', Validators.required],
      facultad: ['', Validators.required],
      programa: ['', Validators.required],
      dependencia: ['', Validators.required],
      campus: ['', Validators.required],
      aphCanal: ['', Validators.required],
      aphFecha: ['', Validators.required],
      aphHora: ['', Validators.required],
      aphConvenio: ['', Validators.required],
      aphAmbito: ['', Validators.required],
      aphProtocolo: ['', Validators.required],
      aphPracticoTriage: ['si', Validators.required],
      aphResultadoTriage: ['', Validators.required],
      aphMotivoNoRealizacionTriage: ['', Validators.required],
      aphAceptaPsicologia: ['si', Validators.required],
      aphRequiereRemision: ['si', Validators.required]
    });

    this.cargarCatalogos();

    this.registroCasoForm.get('tipoReporte')?.valueChanges.subscribe((valor) => {
      const esDirecta = valor === 'directa';
      const esRemision = valor === 'indirecta';

      const controls = [
        'canal',
        'tipoAtencion',
        'quienRemite',
        'fechaHora',
        'personaAtiende',
        'tipoServicio',
        'personaRegistra',
        'formaLugarEntrevista'
      ];
      controls.forEach((campo) => this.registroCasoForm.get(campo)?.disable({ emitEvent: false }));

      if (!esDirecta && !esRemision) {
        this.registroCasoForm.patchValue(
          {
            canal: '',
            tipoAtencion: '',
            quienRemite: '',
            fechaHora: '',
            personaAtiende: '',
            tipoServicio: this.remisionDefaults.tipoServicio,
            personaRegistra: this.obtenerIdUsuarioActual(),
            formaLugarEntrevista: ''
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
            tipoServicio: this.remisionDefaults.tipoServicio
          },
          { emitEvent: false }
        );

        ['canal', 'personaAtiende', 'formaLugarEntrevista'].forEach((campo) => {
          this.registroCasoForm.get(campo)?.enable({ emitEvent: false });
        });

        this.registroCasoForm.get('personaRegistra')?.setValue(this.obtenerIdUsuarioActual(), { emitEvent: false });
        this.registroCasoForm.get('fechaHora')?.disable({ emitEvent: false });
        this.registroCasoForm.get('personaRegistra')?.disable({ emitEvent: false });

        return;
      }

      this.registroCasoForm.patchValue(
        {
          canal: this.obtenerIdCanalRemision(),
          tipoAtencion: this.remisionDefaults.tipoAtencion,
          fechaHora: this.formatearFechaParaDatetimeLocal(new Date()),
          tipoServicio: this.remisionDefaults.tipoServicio,
          personaRegistra: this.obtenerIdUsuarioActual()
        },
        { emitEvent: false }
      );

      ['quienRemite', 'personaAtiende', 'formaLugarEntrevista'].forEach((campo) => {
        this.registroCasoForm.get(campo)?.enable({ emitEvent: false });
      });

      this.registroCasoForm.get('personaRegistra')?.setValue(this.obtenerIdUsuarioActual(), { emitEvent: false });

      ['canal', 'tipoAtencion', 'fechaHora', 'tipoServicio', 'personaRegistra'].forEach((campo) => {
        this.registroCasoForm.get(campo)?.disable({ emitEvent: false });
      });
    });
  }

  private cargarCatalogos(): void {
    this.cargandoCatalogos = true;

    forkJoin({
      tiposReporteAlma: this.listasService.obtenerMaestro('tipos-reporte-alma'),
      canalesContacto: this.listasService.obtenerMaestro('canales-contacto'),
      formasEntrevista: this.listasService.obtenerMaestro('formas-entrevista'),
      tiposDocumento: this.listasService.obtenerMaestro('tipos-identificacion'),
      regimenes: this.listasService.obtenerMaestro('regimenes'),
      eps: this.listasService.obtenerMaestro('eps'),
      departamentos: this.listasService.obtenerMaestro('departamentos'),
      sexos: this.listasService.obtenerMaestro('sexos'),
      identidadesGenero: this.listasService.obtenerMaestro('identidades-genero'),
      orientacionesSexuales: this.listasService.obtenerMaestro('orientaciones-sexuales'),
      etnias: this.listasService.obtenerMaestro('etnias'),
      vinculos: this.listasService.obtenerMaestro('vinculos-udea'),
      subVinculos: this.listasService.obtenerMaestro('subvinculos-udea'),
      facultades: this.listasService.obtenerMaestro('facultades'),
      programas: this.listasService.obtenerMaestro('programas'),
      dependencias: this.listasService.obtenerMaestro('dependencias'),
      campus: this.listasService.obtenerMaestro('campus'),
      aphCanales: this.listasService.obtenerMaestro('canales-aph'),
      aphConvenios: this.listasService.obtenerMaestro('convenios-aph'),
      aphAmbitos: this.listasService.obtenerMaestro('ambitos-aph'),
      aphProtocolos: this.listasService.obtenerMaestro('protocolos-aph'),
      aphResultadosTriage: this.listasService.obtenerMaestro('resultados-triage'),
      usuarios: this.usuarioService.obtenerTodos()
    }).subscribe({
      next: (catalogos) => {
        this.tiposReporteAlma = catalogos.tiposReporteAlma;
        this.canalesContacto = catalogos.canalesContacto;
        this.formasEntrevista = catalogos.formasEntrevista;
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
        this.subVinculos = catalogos.subVinculos;
        this.facultades = catalogos.facultades;
        this.programas = catalogos.programas;
        this.dependencias = catalogos.dependencias;
        this.campus = catalogos.campus;
        this.aphCanales = catalogos.aphCanales;
        this.aphConvenios = catalogos.aphConvenios;
        this.aphAmbitos = catalogos.aphAmbitos;
        this.aphProtocolos = catalogos.aphProtocolos;
        this.aphResultadosTriage = catalogos.aphResultadosTriage;
        this.usuarios = catalogos.usuarios;

        this.configurarValoresPorDefecto();
        this.cargandoCatalogos = false;
      },
      error: () => {
        this.cargandoCatalogos = false;
      }
    });
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

    if (!this.registroCasoForm.get('personaRegistra')?.value) {
      this.registroCasoForm.get('personaRegistra')?.setValue(this.obtenerIdUsuarioActual(), { emitEvent: false });
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

  private formatearFechaParaDatetimeLocal(fecha: Date): string {
    const yyyy = fecha.getFullYear();
    const mm = String(fecha.getMonth() + 1).padStart(2, '0');
    const dd = String(fecha.getDate()).padStart(2, '0');
    const hh = String(fecha.getHours()).padStart(2, '0');
    const min = String(fecha.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  }

  get etiquetaTriageNota(): string {
    return this.registroCasoForm.get('aphPracticoTriage')?.value === 'no'
      ? 'Motivo no realización del triage'
      : 'Nota del APH';
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
      this.snackBar.open('Completa los campos obligatorios para guardar el registro.', 'Cerrar', { duration: 4000 });
      return;
    }

    const tipoDocumentoId = Number(this.registroCasoForm.get('tipoDocumento')?.value);
    const documento = String(this.registroCasoForm.get('documento')?.value ?? '').trim();

    if (!tipoDocumentoId || !documento) {
      this.snackBar.open('Debe ingresar tipo y numero de documento para identificar la persona.', 'Cerrar', { duration: 4000 });
      return;
    }

    this.guardandoRegistro = true;

    if (this.idPersonaEncontrada) {
      const payload = this.construirPayloadRegistro(this.idPersonaEncontrada);
      this.enviarRegistro(payload);
      return;
    }

    this.solicitudService.buscarPersonaPorDocumento(tipoDocumentoId, documento)
      .pipe(finalize(() => { this.guardandoRegistro = false; }))
      .subscribe({
        next: (persona) => {
          const idPersona = Number(persona.id);
          if (!idPersona) {
            this.snackBar.open(
              'No se pudo obtener el ID de la persona desde la busqueda por documento. Contacta al administrador para habilitar ese campo en el endpoint.',
              'Cerrar',
              { duration: 7000 }
            );
            return;
          }

          const payload = this.construirPayloadRegistro(idPersona);
          this.enviarRegistro(payload);
        },
        error: (error) => {
          const mensaje = error?.error?.message || 'No se encontro la persona por documento.';
          this.snackBar.open(mensaje, 'Cerrar', { duration: 5000 });
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
          this.snackBar.open(`Registro Linea ALMA creado con ID ${response.id}.`, 'Cerrar', { duration: 4500 });
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
      idCanalAph: Number(raw.aphCanal),
      fechaHora: this.combinarFechaHora(raw.aphFecha, raw.aphHora),
      idConvenioAph: Number(raw.aphConvenio),
      idAmbitoAph: Number(raw.aphAmbito),
      idProtocoloAph: Number(raw.aphProtocolo),
      practicoTriage: raw.aphPracticoTriage === 'si',
      idResultadoTriage: raw.aphPracticoTriage === 'si' ? Number(raw.aphResultadoTriage) : null,
      notaOMotivoTriage: raw.aphMotivoNoRealizacionTriage || null,
      aceptaPsicologia: raw.aphAceptaPsicologia === 'si',
      requiereRemision: raw.aphRequiereRemision === 'si'
    };

    const remisiones: RemisionRegistroAlmaRequestDto[] = (this.remisionesRegistrados ?? []).map((r) => ({
      idTipoRemision: Number(r.idTipoRemision),
      cual: r.cual || null,
      fecha: this.toIsoDateTime(r.fecha)
    }));

    return {
      idPersona,
      idTipoReporte,
      idCanalContacto: Number(raw.canal),
      quienRemite: raw.tipoReporte === 'indirecta' ? (raw.quienRemite || null) : null,
      fechaHoraAtencion: this.toIsoDateTime(raw.fechaHora),
      idPersonaAtiende: Number(raw.personaAtiende),
      idTipoServicio: this.tipoServicioAphId,
      idPersonaRegistra: Number(raw.personaRegistra),
      idFormaEntrevista: raw.formaLugarEntrevista ? Number(raw.formaLugarEntrevista) : null,
      idIdentidadGenero: Number(raw.identidadSexual),
      idOrientacionSexual: raw.orientacionSexual ? Number(raw.orientacionSexual) : null,
      idEtnia: raw.etnia ? Number(raw.etnia) : null,
      idCiudadResidencia: raw.ciudadResidencia ? Number(raw.ciudadResidencia) : null,
      direccionResidencia: raw.direccionResidencia || null,
      idVinculoUdeA: raw.vinculo ? Number(raw.vinculo) : null,
      idSubVinculoUdeA: raw.subVinculo ? Number(raw.subVinculo) : null,
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

}
