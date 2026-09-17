import { Component, inject, signal, DestroyRef } from '@angular/core';
import { Router, NavigationEnd, RouterLink, RouterLinkActive } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../../services/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-horizontal-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatIconModule, MatMenuModule, MatButtonModule],
  templateUrl: './horizontal-nav.component.html',
  styleUrl: './horizontal-nav.component.scss'
})
export class HorizontalNavComponent {
  readonly auth = inject(AuthService);
  readonly features = environment.features;
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  /** Controla la apertura del menú desplegable colapsable en pantallas móviles/tablets */
  readonly mobileMenuOpen = signal<boolean>(false);

  /** Secciones expandidas por defecto dentro del menú móvil para acceso rápido */
  readonly expandedSections = signal<Record<string, boolean>>({
    usuario: true,
    admin: true,
    atencion: true,
    uad: true
  });

  constructor() {
    // Al navegar a cualquier ruta, cerrar automáticamente el menú móvil
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.mobileMenuOpen.set(false);
      });
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update(open => !open);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  toggleSection(sectionKey: string): void {
    this.expandedSections.update(sections => ({
      ...sections,
      [sectionKey]: !sections[sectionKey]
    }));
  }

  isSectionExpanded(sectionKey: string): boolean {
    return !!this.expandedSections()[sectionKey];
  }
}
