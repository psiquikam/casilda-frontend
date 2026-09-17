import { Component, EventEmitter, Output, inject } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
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
  private readonly router = inject(Router);

  readonly mockUsers: MockUserProfile[] = Object.values(MOCK_USERS);

  get roleBadgeClass(): string {
    const code = this.auth.getRoleCode();
    switch (code) {
      case 'ADMIN':
        return 'role-badge--admin';
      case 'COORDINADOR':
        return 'role-badge--coordinador';
      case 'PROFESIONAL':
        return 'role-badge--profesional';
      case 'REVISOR':
        return 'role-badge--revisor';
      default:
        return 'role-badge--usuario';
    }
  }

  cambiarRolMock(roleCode: string): void {
    this.auth.loginAsMock(roleCode).subscribe(() => {
      void this.router.navigate(['/inicio']);
    });
  }
}
