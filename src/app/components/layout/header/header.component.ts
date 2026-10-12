import { Component, EventEmitter, Output, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService, MOCK_USERS, MockUserProfile } from '../../../services/auth.service';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { NavigationLayoutService } from '../../../services/navigation-layout.service';

@Component({
  selector: 'app-header',
  imports: [
    RouterLink,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  @Output() toggleSidenav = new EventEmitter<void>();

  readonly auth = inject(AuthService);
  readonly navLayout = inject(NavigationLayoutService);

  readonly mockUsers: MockUserProfile[] = Object.values(MOCK_USERS);

  /**
   * Selector de rol de «Modo Prueba»: recarga la página completa en vez de
   * navegar por el router. Si ya se está en `/inicio`, `router.navigate`
   * es un no-op (Angular ignora navegaciones a la misma URL por defecto) y
   * el panel se queda con los datos del rol anterior hasta un F5 manual.
   */
  cambiarRolMock(mock: MockUserProfile): void {
    this.auth.loginAsMock(mock.email).subscribe(() => {
      window.location.href = '/inicio';
    });
  }

  esCuentaMockActiva(mock: MockUserProfile): boolean {
    return (this.auth.currentUser?.email || '').toLowerCase() === mock.email.toLowerCase();
  }
}
