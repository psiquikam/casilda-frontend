import { Component } from '@angular/core';

import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-public-header',
    imports: [MatIconModule, RouterLink],
    templateUrl: './public-header.component.html',
    styleUrls: ['./public-header.component.scss']
})
export class PublicHeaderComponent {
  readonly features = environment.features;
}
