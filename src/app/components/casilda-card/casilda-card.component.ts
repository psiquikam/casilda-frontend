import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-casilda-card',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './casilda-card.component.html',
  styleUrls: ['./casilda-card.component.scss']
})
export class CasildaCardComponent {
  @Input() icon: string = '';
  @Input() title: string = '';
  @Input() value: string | number = '';
  @Input() variant: 'light' | 'dark' = 'light';
  @Input() isLogo: boolean = false;
}