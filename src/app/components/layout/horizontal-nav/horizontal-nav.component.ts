import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
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
}
