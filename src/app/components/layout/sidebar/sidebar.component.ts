import { Component, inject, OnInit } from '@angular/core';
import { Router, NavigationEnd, RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { filter } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { environment } from '../../../../environments/environment';

export type MenuSectionKey = 'admin' | 'atencion' | 'alma' | 'uad' | 'reportes' | 'violeta';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [MatIconModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit {
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);
  readonly features = environment.features;

  expandedSections: Record<MenuSectionKey, boolean> = {
    admin: true,
    atencion: true,
    alma: false,
    uad: false,
    reportes: false,
    violeta: false
  };

  ngOnInit(): void {
    this.autoExpandActiveSection(this.router.url);
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(event => {
        this.autoExpandActiveSection(event.urlAfterRedirects);
      });
  }

  toggleSection(section: MenuSectionKey): void {
    this.expandedSections[section] = !this.expandedSections[section];
  }

  isExpanded(section: MenuSectionKey): boolean {
    return !!this.expandedSections[section];
  }

  private autoExpandActiveSection(url: string): void {
    if (url.includes('/gestion-usuarios') || url.includes('/gestion-sistema')) {
      this.expandedSections.admin = true;
    } else if (
      url.includes('/solicitud-acompanamiento') ||
      url.includes('/consulta') ||
      url.includes('/detalle-acompanamiento') ||
      url.includes('/cita') ||
      url.includes('/registro-caso') ||
      url.includes('/registro-atencion')
    ) {
      this.expandedSections.atencion = true;
    } else if (url.includes('/linea-alma')) {
      this.expandedSections.alma = true;
    } else if (url.includes('/nueva-queja')) {
      this.expandedSections.uad = true;
    } else if (url.includes('/dashboard-revisor')) {
      this.expandedSections.reportes = true;
    } else if (url.includes('/seguimiento')) {
      this.expandedSections.violeta = true;
    }
  }
}
