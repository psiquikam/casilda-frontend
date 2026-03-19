import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CasildaCardComponent } from '../casilda-card/casilda-card.component';

interface CasildaItem {
  icon: string;
  title: string;
  variant: 'light' | 'dark';
  tooltip: string;
  value?: string | number;
  isLogo?: boolean;
}

@Component({
  selector: 'app-casilda-home',
  standalone: true,
  imports: [CommonModule, CasildaCardComponent, MatTooltipModule],
  templateUrl: './casilda-home.component.html',
  styleUrls: ['./casilda-home.component.scss']
})
export class CasildaHomeComponent {
  acciones: CasildaItem[] = [
    { 
      icon: 'uad-equipo', 
      title: 'Registrar Queja Disciplinaria (UAD 3 y 4)', 
      variant: 'light',
      tooltip: 'Portal para el registro formal de quejas ante la Unidad de Asuntos Disciplinarios.'
    },
    { 
      icon: 'equipo-atencion', 
      title: 'Solicitud Equipo de Atención VBG', 
      variant: 'light',
      tooltip: 'Contacta al equipo especializado para recibir orientación y acompañamiento.'
    },
    { 
      icon: 'logo-alma', 
      title: 'Atención por Línea Alma', 
      variant: 'light',
      tooltip: 'Línea de atención psicológica y apoyo inmediato de la Universidad.'
    },
    { 
      icon: 'security', 
      title: 'Atención por Seguridad a Personas y Bienes', 
      variant: 'light',
      tooltip: 'Reporte de incidentes de seguridad inmediata dentro del campus.'
    }
  ];

  estadisticas: CasildaItem[] = [
    { 
      icon: 'reportes-indicadores', 
      value: '3000', 
      title: 'Indicadores Internos', 
      variant: 'light',
      tooltip: 'Visualización de datos y métricas del sistema Casilda.'
    },
    { 
      icon: 'logo-Reportes', 
      title: 'Estadísticas en VBG', 
      variant: 'light',
      tooltip: 'Informes detallados sobre la situación de VBG en la institución.'
    },
    { 
      icon: 'logo-custom', 
      title: '¿Quién es CASILDA?', 
      isLogo: true, 
      variant: 'light',
      tooltip: 'CASILDA es el Sistema de Vigilancia en Salud Pública de la UdeA para el abordaje de las violencias y las discriminaciones basadas en género. Su propósito es centralizar la información para generar acciones de prevención, atención y protección efectiva.'
    }
  ];
}