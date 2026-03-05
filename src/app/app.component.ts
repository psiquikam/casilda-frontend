import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { HeaderComponent } from './components/layout/header/header.component';
import { SidebarComponent } from './components/layout/sidebar/sidebar.component';
import { MatIconRegistry, MatIconModule } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, 
    RouterOutlet, 
    MatSidenavModule, 
    MatIconModule,
    HeaderComponent, 
    SidebarComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  constructor(
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer,
    public auth: AuthService
  ) {
    this.matIconRegistry.addSvgIcon(
      'logo-custom',
      this.domSanitizer.bypassSecurityTrustResourceUrl('assets/distintivo_casilda.svg')
    );

    this.matIconRegistry.addSvgIcon(
      'logo-AdminPara',
      this.domSanitizer.bypassSecurityTrustResourceUrl('assets/AdminPara.svg')
    );

    this.matIconRegistry.addSvgIcon(
      'logo-Reportes',
      this.domSanitizer.bypassSecurityTrustResourceUrl('assets/Reportes.svg')
    );

    this.matIconRegistry.addSvgIcon(
      'logo-alma',
      this.domSanitizer.bypassSecurityTrustResourceUrl('assets/linea_alma.svg')
    );
  }
}