import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { AuthService } from '../../../services/auth.service';
import { ModalDireccionComponent } from '../../modal-direccion/modal-direccion.component';
import { ModalDiscapacidadComponent } from '../../modal-discapacidad/modal-discapacidad.component';
import { ModalCorreoComponent } from '../../modal-correo/modal-correo.component';
import { ModalTelefonoComponent } from '../../modal-telefono/modal-telefono.component';
import { ModalRemisionComponent } from '../../modal-remision/modal-remision.component';

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
    MatDialogModule
  ],
  templateUrl: './atencion-pr.component.html',
  styleUrl: './atencion-pr.component.scss'
})
export class AtencionPrComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);

  registroCasoForm!: FormGroup;
  readonly canales = ['Whatsapp', 'Llamada'];
  readonly tiposDocumentoMock = ['CC', 'TI', 'CE', 'PA'];
  readonly regimenSaludMock = ['Contributivo', 'Subsidiado', 'Especial'];
  readonly epsMock = ['SURA', 'Nueva EPS', 'Sanitas'];
  readonly departamentosMock = [
    { id: 1, nombre: 'Antioquia' },
    { id: 2, nombre: 'Cundinamarca' },
    { id: 3, nombre: 'Valle del Cauca' }
  ];
  readonly municipiosNacimientoMock = [
    { id: 101, nombre: 'Medellín' },
    { id: 102, nombre: 'Envigado' },
    { id: 103, nombre: 'Itagüí' }
  ];
  readonly municipiosResidenciaMock = [
    { id: 201, nombre: 'Medellín' },
    { id: 202, nombre: 'Bello' },
    { id: 203, nombre: 'Sabaneta' }
  ];
  readonly sexosMock = ['Femenino', 'Masculino', 'Intersexual'];
  readonly identidadesSexualesMock = ['Cisgénero', 'Transgénero', 'No binaria'];
  readonly orientacionesSexualesMock = ['Heterosexual', 'Homosexual', 'Bisexual'];
  readonly etniasMock = ['Ninguna', 'Afrocolombiana', 'Indígena'];
  readonly listaVinculos = ['Estudiante', 'Funcionario', 'Contratista'];
  readonly listaSubVinculos = ['Pregrado', 'Posgrado', 'Administrativo'];
  readonly facultadesM = ['Facultad 1', 'Facultad 2', 'Facultad 3'];
  readonly listaProgramas = ['Programa 1', 'Programa 2', 'Programa 3'];
  readonly listaDependencia = ['Dependencia 1', 'Dependencia 2', 'Dependencia 3'];
  readonly campusM = ['Campus 1', 'Campus 2', 'Campus 3'];
  readonly aphCanales = ['Canal 1', 'Canal 2', 'Canal 3'];
  readonly aphConvenios = ['Convenio 1', 'Convenio 2', 'Convenio 3'];
  readonly aphAmbitos = ['Ambito 1', 'Ambito 2', 'Ambito 3'];
  readonly aphProtocolos = ['Protocolo 1', 'Protocolo 2', 'Protocolo 3'];
  readonly aphResultadosTriage = ['Alta', 'Media', 'Baja'];
  discapacidadesRegistradas: any[] = [];
  correoRegistrados: any[] = [];
  telefonosRegistrados: any[] = [];
  remisionesRegistrados: any[] = [];
  readonly remisionDefaults = {
    canal: 'Remisión',
    tipoAtencion: 'Remisión',
    tipoServicio: 'Atención APH'
  };
  readonly remisionMockCatalogs = {
    personasRegistra: ['Profesional 1', 'Profesional 2', 'Profesional 3'],
    formasEntrevista: ['Presencial', 'Virtual', 'Telefónica']
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
      personaRegistra: [{ value: this.authService.currentUser?.nombre || '', disabled: true }, Validators.required],
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
      aphResultadoTriage: ['Alta', Validators.required],
      aphMotivoNoRealizacionTriage: ['', Validators.required],
      aphAceptaPsicologia: ['si', Validators.required],
      aphRequiereRemision: ['si', Validators.required]
    });

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
            personaRegistra: this.authService.currentUser?.nombre || '',
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
            tipoServicio: this.remisionDefaults.tipoServicio
          },
          { emitEvent: false }
        );

        ['canal', 'fechaHora', 'personaAtiende', 'personaRegistra', 'formaLugarEntrevista'].forEach((campo) => {
          this.registroCasoForm.get(campo)?.enable({ emitEvent: false });
        });

        return;
      }

      this.registroCasoForm.patchValue(
        {
          canal: this.remisionDefaults.canal,
          tipoAtencion: this.remisionDefaults.tipoAtencion,
          fechaHora: this.formatearFechaParaDatetimeLocal(new Date()),
          tipoServicio: this.remisionDefaults.tipoServicio,
          personaRegistra: this.authService.currentUser?.nombre || ''
        },
        { emitEvent: false }
      );

      ['quienRemite', 'personaAtiende', 'personaRegistra', 'formaLugarEntrevista'].forEach((campo) => {
        this.registroCasoForm.get(campo)?.enable({ emitEvent: false });
      });

      ['canal', 'tipoAtencion', 'fechaHora', 'tipoServicio'].forEach((campo) => {
        this.registroCasoForm.get(campo)?.disable({ emitEvent: false });
      });

      if (!this.registroCasoForm.get('personaRegistra')?.value) {
        this.registroCasoForm.get('personaRegistra')?.setValue(this.remisionMockCatalogs.personasRegistra[0], { emitEvent: false });
      }
    });
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
