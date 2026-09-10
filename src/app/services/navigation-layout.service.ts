import { Injectable, signal } from '@angular/core';

export type MenuLayoutMode = 'sidebar' | 'horizontal';

/**
 * Servicio reactivo para gestionar la preferencia de disposición del menú:
 * - 'sidebar': Barra lateral vertical (por defecto).
 * - 'horizontal': Barra de navegación horizontal superior debajo del encabezado.
 * Persiste la configuración del usuario en localStorage.
 */
@Injectable({ providedIn: 'root' })
export class NavigationLayoutService {
  private readonly STORAGE_KEY = 'casilda_menu_layout';

  readonly layoutMode = signal<MenuLayoutMode>(this.getInitialLayout());

  private getInitialLayout(): MenuLayoutMode {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    return saved === 'horizontal' ? 'horizontal' : 'sidebar';
  }

  setLayout(mode: MenuLayoutMode): void {
    this.layoutMode.set(mode);
    localStorage.setItem(this.STORAGE_KEY, mode);
  }

  toggleLayout(): void {
    const next = this.layoutMode() === 'sidebar' ? 'horizontal' : 'sidebar';
    this.setLayout(next);
  }

  isSidebar(): boolean {
    return this.layoutMode() === 'sidebar';
  }

  isHorizontal(): boolean {
    return this.layoutMode() === 'horizontal';
  }
}
