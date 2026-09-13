import { Component, inject, ViewChild } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { HeaderComponent } from './components/layout/header/header.component';
import { SidebarComponent } from './components/layout/sidebar/sidebar.component';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from './services/auth.service';
import { PublicHeaderComponent } from './components/public-header/public-header.component';
import { PublicFooterComponent } from './components/public-footer/public-footer.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LoadingService } from './services/loading.service';
import { CasildaIconRegistryService } from './core/icons/casilda-icon-registry.service';
import { QuickExitComponent } from './components/quick-exit/quick-exit.component';
import { EnfoqueRutaService } from './core/a11y/enfoque-ruta.service';

import { HorizontalNavComponent } from './components/layout/horizontal-nav/horizontal-nav.component';
import { NavigationLayoutService } from './services/navigation-layout.service';
import { filter, map } from 'rxjs';

/**
 * Punto de corte bajo el cual el menú lateral pasa a superponerse (`mode="over"`)
 * en lugar de reservar ancho fijo (WCAG 1.4.10 Reflujo).
 */
export const PUNTO_CORTE_SIDENAV = '(max-width: 900px)';

@Component({
    selector: 'app-root',
    imports: [
        CommonModule,
        RouterOutlet,
        MatSidenavModule,
        MatIconModule,
        HeaderComponent,
        SidebarComponent,
        HorizontalNavComponent,
        PublicHeaderComponent,
        PublicFooterComponent,
        QuickExitComponent,
        MatProgressSpinnerModule
    ],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss'
})
export class AppComponent {
  @ViewChild('sidenav') sidenav?: MatSidenav;

  private readonly router = inject(Router);
  private readonly iconRegistry = inject(CasildaIconRegistryService);
  private readonly enfoqueRuta = inject(EnfoqueRutaService);
  private readonly breakpoints = inject(BreakpointObserver);
  readonly loadingService = inject(LoadingService);
  readonly auth = inject(AuthService);
  readonly navLayout = inject(NavigationLayoutService);

  /** `true` en pantallas estrechas: el sidenav se superpone y arranca cerrado. */
  readonly esPantallaEstrecha = toSignal(
    this.breakpoints.observe(PUNTO_CORTE_SIDENAV).pipe(map((r) => r.matches)),
    { initialValue: this.breakpoints.isMatched(PUNTO_CORTE_SIDENAV) }
  );

  constructor() {
    this.iconRegistry.register();
    // Foco al <main> tras cada navegación (WCAG 2.4.3).
    this.enfoqueRuta.iniciar();
    // En modo superpuesto, el menú se cierra al elegir un destino para no tapar el contenido.
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd), takeUntilDestroyed())
      .subscribe(() => {
        if (this.esPantallaEstrecha() && this.sidenav?.opened) {
          this.sidenav.close();
        }
      });
  }

  isLoginRoute(): boolean {
    return this.router.url === '/login';
  }

  isHomeRoute(): boolean {
    return this.router.url === '/home';
  }

  sidenavMode(): 'side' | 'over' {
    return this.esPantallaEstrecha() ? 'over' : 'side';
  }

  sidenavAbierto(): boolean {
    return !this.isHomeRoute() && !this.esPantallaEstrecha();
  }

  onToggleSidenav(): void {
    if (this.navLayout.isSidebar() && this.sidenav) {
      this.sidenav.toggle();
    }
  }
}
