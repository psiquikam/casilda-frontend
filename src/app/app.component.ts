import { Component, inject } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
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

@Component({
    selector: 'app-root',
    imports: [
        CommonModule,
        RouterOutlet,
        MatSidenavModule,
        MatIconModule,
        HeaderComponent,
        SidebarComponent,
        PublicHeaderComponent,
        PublicFooterComponent,
        QuickExitComponent,
        MatProgressSpinnerModule
    ],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss'
})
export class AppComponent {
  private readonly router = inject(Router);
  private readonly iconRegistry = inject(CasildaIconRegistryService);
  readonly loadingService = inject(LoadingService);
  readonly auth = inject(AuthService);

  constructor() {
    this.iconRegistry.register();
  }

  isLoginRoute(): boolean {
    return this.router.url === '/login';
  }

  isHomeRoute(): boolean {
    return this.router.url === '/home';
  }
}
