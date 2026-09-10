import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../services/auth.service';
import { NavigationLayoutService } from '../../services/navigation-layout.service';
import { environment } from '../../../environments/environment';

export interface WorkflowStep {
  stepNumber: number;
  title: string;
  tag: string;
  subtitle: string;
  description: string;
  details: string[];
  route: string;
  actionText: string;
  icon: string;
}

export interface PlatformTool {
  id: string;
  title: string;
  category: string;
  icon: string;
  route: string;
  whatItIs: string;
  whenToUse: string;
  keywords: string[];
  adminOnly?: boolean;
}

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [RouterLink, FormsModule, MatIconModule, MatButtonModule],
  templateUrl: './dashboard-home.component.html',
  styleUrl: './dashboard-home.component.scss'
})
export class DashboardHomeComponent {
  readonly auth = inject(AuthService);
  readonly navLayout = inject(NavigationLayoutService);
  readonly features = environment.features;
  readonly telefonoOrientacion = environment.telefonoOrientacion;
  readonly correoSoporte = 'proyectocasilda@udea.edu.co';

  // Búsqueda interactiva de herramientas y procesos
  searchQuery = '';

  // Pestaña activa: 'guia' (Flujo de vida del caso), 'herramientas' (Catálogo), 'protocolos' (Cosas útiles y reglas)
  activeTab: 'guia' | 'herramientas' | 'protocolos' = 'guia';

  // Paso seleccionado en la guía
  selectedStepIndex = 0;

  // Métricas inclusivas de resumen y barritas operativas
  readonly summaryStats = {
    totalCasos: 156,
    kpis: [
      {
        id: 'total',
        label: 'Casos Activos',
        count: 156,
        subtext: 'En vigilancia institucional',
        icon: 'folder_shared',
        colorClass: 'total',
        badge: 'Activos'
      },
      {
        id: 'recepcion',
        label: 'En Recepción',
        count: 48,
        porcentaje: 30.8,
        subtext: 'Pendientes de valoración',
        icon: 'inbox',
        colorClass: 'recepcion',
        badge: '30.8%'
      },
      {
        id: 'citas',
        label: 'Citas Activas',
        count: 52,
        porcentaje: 33.3,
        subtext: 'Atenciones agendadas',
        icon: 'event_available',
        colorClass: 'citas',
        badge: '33.3%'
      },
      {
        id: 'activo',
        label: 'Acompañamiento',
        count: 41,
        porcentaje: 26.3,
        subtext: 'En seguimiento psicosocial',
        icon: 'support_agent',
        colorClass: 'activo',
        badge: '26.3%'
      }
    ],
    diversidad: [
      { label: 'Mujeres (Cis/Trans)', count: 88, porcentaje: 56.4, colorClass: 'female' },
      { label: 'Hombres (Cis/Trans)', count: 36, porcentaje: 23.1, colorClass: 'male' },
      { label: 'Personas No Binarias', count: 24, porcentaje: 15.4, colorClass: 'nonbinary' },
      { label: 'Disidencias / Otras', count: 8, porcentaje: 5.1, colorClass: 'diverse' }
    ],
    estados: [
      { label: 'Citas Activas', count: 52, porcentaje: 33.3, colorClass: 'bar-citas' },
      { label: 'En Recepción', count: 48, porcentaje: 30.8, colorClass: 'bar-recepcion' },
      { label: 'Acompañamiento Activo', count: 41, porcentaje: 26.3, colorClass: 'bar-activo' },
      { label: 'Cierre con Acuerdo', count: 15, porcentaje: 9.6, colorClass: 'bar-cierre' }
    ]
  };

  get nombreUsuario(): string {
    return this.auth.currentUser?.nombre || 'Personal Institucional';
  }

  get rolUsuario(): string {
    return this.auth.currentUser?.rol || 'Usuario';
  }

  get fechaFormateada(): string {
    const opciones: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return new Date().toLocaleDateString('es-CO', opciones);
  }

  get currentStep(): WorkflowStep {
    return this.workflowSteps[this.selectedStepIndex] || this.workflowSteps[0];
  }

  // Flujo operativo de Casilda (Ruta de Atención paso a paso)
  readonly workflowSteps: WorkflowStep[] = [
    {
      stepNumber: 1,
      title: 'Recepción y Radicación',
      tag: 'Solicitud',
      subtitle: 'Módulo: Solicitud de Acompañamiento',
      description: 'Ingreso inicial del reporte. Se reciben solicitudes de la propia persona afectada (directa) o de terceros que reportan la situación.',
      details: [
        'Registro de datos de contacto (teléfono, correo, confidencialidad).',
        'Identificación del medio de ingreso (presencial o virtual).',
        'Generación del radicado preliminar de seguimiento.'
      ],
      route: '/solicitud-acompanamiento',
      actionText: 'Ir a Nueva Solicitud',
      icon: 'add_circle_outline'
    },
    {
      stepNumber: 2,
      title: 'Bandeja y Contacto Inicial',
      tag: 'Consulta',
      subtitle: 'Módulo: Consulta de Solicitudes',
      description: 'Revisión y triaje de solicitudes pendientes. Se gestiona el contacto telefónico para validar la voluntad de acompañamiento.',
      details: [
        'Filtrado por fecha, estado y código de radicado.',
        'Registro de intentos de contacto telefónico (exitoso, no contesta, mensaje).',
        'Verificación de consentimiento informado de la persona.'
      ],
      route: '/consulta',
      actionText: 'Ir a Bandeja de Consultas',
      icon: 'manage_search'
    },
    {
      stepNumber: 3,
      title: 'Agendamiento de Citas',
      tag: 'Citas',
      subtitle: 'Módulo: Gestión de Citas',
      description: 'Coordinación formal de sesiones de orientación psicosocial o asesoría jurídica con los profesionales del equipo.',
      details: [
        'Asignación de fecha, hora y modalidad (presencial en campus o virtual).',
        'Selección del área de atención (psicológica, jurídica o social).',
        'Control de reprogramaciones y cancelaciones debidamente justificadas.'
      ],
      route: '/cita',
      actionText: 'Ir a Citas y Agendamiento',
      icon: 'calendar_month'
    },
    {
      stepNumber: 4,
      title: 'Apertura de Caso Formal',
      tag: 'Expediente',
      subtitle: 'Módulo: Registro de Caso',
      description: 'Consolidación del expediente formal del caso cuando se requiere intervención técnica continuada.',
      details: [
        'Caracterización de la persona, hechos y presunto agresor.',
        'Tipologías de violencia y modalidades detectadas.',
        'Formulación de apreciación psicológica y jurídica inicial y activación de medidas de protección.'
      ],
      route: '/registro-caso',
      actionText: 'Ir a Registro de Caso',
      icon: 'folder_shared'
    },
    {
      stepNumber: 5,
      title: 'Intervención y Cierre',
      tag: 'Atención',
      subtitle: 'Módulo: Registro de Atención',
      description: 'Documentación de cada una de las sesiones de acompañamiento realizadas, acuerdos y remisiones interinstitucionales.',
      details: [
        'Actas de compromisos mutuos (persona acompañada y profesionales).',
        'Remisiones a instancias externas o internas (salud, fiscalía, bienestar).',
        'Cierre formal del caso y archivo bajo reserva legal.'
      ],
      route: '/registro-atencion',
      actionText: 'Ir a Registro de Atención',
      icon: 'handshake'
    }
  ];

  // Catálogo completo de herramientas internas explicadas
  readonly allTools: PlatformTool[] = [
    {
      id: 'solicitud',
      title: 'Solicitud de Acompañamiento',
      category: 'Equipo de Atención',
      icon: 'add_circle_outline',
      route: '/solicitud-acompanamiento',
      whatItIs: 'Formulario de registro inicial para radicar una solicitud de acompañamiento en VBG.',
      whenToUse: 'Cuando una persona se acerca a la dependencia o escribe solicitando orientación o cuando un tercero reporta un caso.',
      keywords: ['solicitud', 'radicar', 'nueva', 'ingreso', 'acompañamiento', 'crear', 'caso']
    },
    {
      id: 'consulta',
      title: 'Consulta y Bandeja de Solicitudes',
      category: 'Equipo de Atención',
      icon: 'manage_search',
      route: '/consulta',
      whatItIs: 'Bandeja general donde se listan todas las solicitudes radicadas con sus estados y datos de contacto.',
      whenToUse: 'Para revisar solicitudes pendientes, consultar números telefónicos, registrar llamadas o acceder al expediente de alguien.',
      keywords: ['consulta', 'bandeja', 'buscar', 'filtro', 'llamadas', 'telefono', 'contacto', 'solicitudes']
    },
    {
      id: 'cita',
      title: 'Citas y Agendamiento',
      category: 'Equipo de Atención',
      icon: 'calendar_month',
      route: '/cita',
      whatItIs: 'Módulo de programación y calendario de sesiones psicosociales y jurídicas.',
      whenToUse: 'Para fijar una fecha y hora con la persona tras contactarla o para reprogramar citas pactadas.',
      keywords: ['cita', 'agendar', 'horario', 'calendario', 'sesion', 'psicologia', 'juridica', 'fecha']
    },
    {
      id: 'caso',
      title: 'Registro de Caso (Expediente)',
      category: 'Equipo de Atención',
      icon: 'folder_shared',
      route: '/registro-caso',
      whatItIs: 'Instrumento técnico para documentar en detalle la caracterización del caso y las apreciaciones profesionales.',
      whenToUse: 'Cuando la solicitud se convierte en caso formal y se requiere registrar hechos, agresores y medidas.',
      keywords: ['caso', 'expediente', 'hechos', 'agresor', 'medidas', 'proteccion', 'apreciacion']
    },
    {
      id: 'atencion',
      title: 'Registro de Atención',
      category: 'Equipo de Atención',
      icon: 'handshake',
      route: '/registro-atencion',
      whatItIs: 'Espacio para documentar las sesiones de atención brindadas, actas de acuerdos y remisiones.',
      whenToUse: 'Al terminar cada intervención con la persona para dejar constancia de compromisos y avances.',
      keywords: ['atencion', 'acta', 'compromisos', 'remision', 'intervencion', 'sesion']
    },
    {
      id: 'alma',
      title: 'Línea Alma (Primer Respondiente)',
      category: 'Líneas Especiales',
      icon: 'ring_volume',
      route: '/linea-alma/atencion-pr',
      whatItIs: 'Canal de atención telefónica de emergencia y triaje de contención en crisis emocional.',
      whenToUse: 'Cuando entra una llamada urgente a la línea institucional requiriendo apoyo psicológico inmediato.',
      keywords: ['alma', 'emergencia', 'telefono', 'llamada', 'primer respondiente', 'crisis', 'urgente']
    },
    {
      id: 'uad',
      title: 'UAD — Registrar Queja Disciplinaria',
      category: 'Asuntos Disciplinarios',
      icon: 'post_add',
      route: '/nueva-queja',
      whatItIs: 'Módulo de radicación de quejas disciplinarias formales ante la Unidad de Asuntos Disciplinarios.',
      whenToUse: 'Cuando la persona decide iniciar una queja sancionatoria formal contra un miembro de la UdeA.',
      keywords: ['uad', 'queja', 'disciplinario', 'sancion', 'denuncia', 'regimen']
    },
    {
      id: 'seguimiento',
      title: 'Seguimiento de Trámites / Ruta Violeta',
      category: 'Rutas Institucionales',
      icon: 'track_changes',
      route: '/seguimiento',
      whatItIs: 'Monitoreo del estado y avance del trámite con trazabilidad y articulación universitaria.',
      whenToUse: 'Para verificar el estado actual de un radicado y revisar el historial de articulación.',
      keywords: ['seguimiento', 'ruta violeta', 'tramite', 'codigo', 'estado', 'avance']
    },
    {
      id: 'usuarios',
      title: 'Gestión de Usuarios',
      category: 'Administración',
      icon: 'manage_accounts',
      route: '/gestion-usuarios',
      whatItIs: 'Control de cuentas de acceso, roles (Admin, Revisor) y asignación de personal institucional.',
      whenToUse: 'Para registrar nuevo personal profesional, modificar contraseñas o cambiar permisos.',
      keywords: ['usuarios', 'roles', 'permisos', 'personal', 'cuentas', 'admin', 'abogados', 'psicologos'],
      adminOnly: true
    },
    {
      id: 'maestros',
      title: 'Listas Maestras del Sistema',
      category: 'Administración',
      icon: 'tune',
      route: '/gestion-sistema',
      whatItIs: 'Parametrizador central de catálogos: facultades, dependencias, modalidades VBG y tipologías.',
      whenToUse: 'Para agregar o modificar las opciones que aparecen en los desplegables de los formularios sin tocar código.',
      keywords: ['maestros', 'listas', 'parametros', 'catalogos', 'facultades', 'dependencias', 'opciones'],
      adminOnly: true
    },
    {
      id: 'reportes',
      title: 'Panel de Indicadores',
      category: 'Administración',
      icon: 'insights',
      route: '/dashboard-revisor',
      whatItIs: 'Visualización analítica de métricas, estadísticas de solicitudes y datos epidemiológicos.',
      whenToUse: 'Para consultar informes periódicos, evaluar impacto y realizar reportes institucionales.',
      keywords: ['reportes', 'metricas', 'indicadores', 'graficos', 'estadisticas', 'dashboard'],
      adminOnly: true
    }
  ];

  get filteredTools(): PlatformTool[] {
    const query = this.searchQuery.trim().toLowerCase();
    const isAdmin = this.auth.isAdmin();

    return this.allTools.filter(tool => {
      // Filtrar por permisos de rol
      if (tool.adminOnly && !isAdmin) return false;

      // Si no hay búsqueda, devolver todas
      if (!query) return true;

      // Coincidencias en título, descripción, para qué sirve o palabras clave
      return (
        tool.title.toLowerCase().includes(query) ||
        tool.category.toLowerCase().includes(query) ||
        tool.whatItIs.toLowerCase().includes(query) ||
        tool.whenToUse.toLowerCase().includes(query) ||
        tool.keywords.some(k => k.toLowerCase().includes(query))
      );
    });
  }

  selectStep(index: number): void {
    this.selectedStepIndex = index;
  }
}
