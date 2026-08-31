import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-casilda-card',
    imports: [CommonModule, MatIconModule],
    templateUrl: './casilda-card.component.html',
    styleUrls: ['./casilda-card.component.scss']
})
export class CasildaCardComponent {
  @Input() icon = '';
  @Input() title = '';
  @Input() value: string | number = '';
  @Input() variant: 'light' | 'dark' = 'light';
  @Input() isLogo = false;
}