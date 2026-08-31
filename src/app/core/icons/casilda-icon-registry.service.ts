import { Injectable, inject } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';

const CASILDA_ICONS = {
  'logo-custom': 'assets/distintivo_casilda.svg',
  'logo-alma': 'assets/linea_alma.svg',
  'equipo-atencion': 'assets/equipo_atencion.svg',
  'uad-equipo': 'assets/uad_equipo_3_y_4.svg',
  'reportes-indicadores': 'assets/reportes_informes_indicadores.svg',
  administracion: 'assets/administracion.svg',
  'seguridad-bienes': 'assets/seguridad_bienes_y_servicios.svg',
  'logo-login': 'assets/login.svg',
  'icono-eliminar': 'assets/eliminar.svg',
  'icono-editar': 'assets/editar.svg',
  'icono-ver': 'assets/ver.svg',
  'estadisticas-vbg': 'assets/estadisticas-vbg.svg'
} as const;

@Injectable({ providedIn: 'root' })
export class CasildaIconRegistryService {
  private readonly iconRegistry = inject(MatIconRegistry);
  private readonly sanitizer = inject(DomSanitizer);
  private registered = false;

  register(): void {
    if (this.registered) return;

    Object.entries(CASILDA_ICONS).forEach(([name, url]) => {
      this.iconRegistry.addSvgIcon(
        name,
        this.sanitizer.bypassSecurityTrustResourceUrl(url)
      );
    });
    this.registered = true;
  }
}
