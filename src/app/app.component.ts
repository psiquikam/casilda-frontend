import { Component, inject } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { HeaderComponent } from './components/layout/header/header.component';
import { SidebarComponent } from './components/layout/sidebar/sidebar.component';
import { MatIconRegistry, MatIconModule } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { AuthService } from './services/auth.service';
import { PublicHeaderComponent } from './components/public-header/public-header.component';
import { PublicFooterComponent } from './components/public-footer/public-footer.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LoadingService } from './services/loading.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MatSidenavModule,
    MatIconModule,
    HeaderComponent,
    SidebarComponent,
    PublicHeaderComponent,
    PublicFooterComponent,
    MatProgressSpinnerModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  private router = inject(Router);
  readonly loadingService = inject(LoadingService);

  constructor(
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer,
    public auth: AuthService
  ) {
    this.registerIcons();
  }

  isLoginRoute(): boolean {
    return this.router.url === '/login';
  }

  private registerIcons(): void {
    const icons = [
      { name: 'logo-custom', url: 'assets/distintivo_casilda.svg' },
      { name: 'logo-AdminPara', url: 'assets/AdminPara.svg' },
      { name: 'logo-Reportes', url: 'assets/Reportes.svg' },
      { name: 'logo-alma', url: 'assets/linea_alma.svg' },
      { name: 'equipo-atencion', url: 'assets/equipo_atencion.svg' },
      { name: 'uad-equipo', url: 'assets/uad_equipo_3_y_4.svg' },
      { name: 'reportes-indicadores', url: 'assets/reportes_informes_indicadores.svg' },
      { name: 'administracion', url: 'assets/administracion.svg' },
      { name: 'seguridad-bienes', url: 'assets/seguridad_bienes_y_servicios.svg' },
      { name: 'logo-login', url: 'assets/login.svg' },
      { name: 'icono-eliminar', url: 'assets/eliminar.svg' },
      { name: 'icono-editar', url: 'assets/editar.svg' },
      { name: 'icono-ver', url: 'assets/ver.svg' },
      { name: 'estadisticas-vbg', url: 'assets/estadisticas-vbg.svg' }
    ];

    icons.forEach(icon => {
      this.matIconRegistry.addSvgIcon(
        icon.name,
        this.domSanitizer.bypassSecurityTrustResourceUrl(icon.url)
      );
    });
  }
}