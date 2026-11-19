import { Component, Input } from '@angular/core';

import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-spyb-consecutivo-badge',
  standalone: true,
  imports: [MatChipsModule, MatIconModule],
  template: `
    <span class="spyb-badge" [title]="'Consecutivo de seguridad: ' + consecutivo">
      <mat-icon class="badge-icon">verified_user</mat-icon>
      <span class="badge-text">{{ consecutivo }}</span>
    </span>
  `,
  styles: [`
    .spyb-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      border-radius: var(--radius-full, 9999px);
      background-color: var(--color-primary-tint, rgba(2, 105, 55, 0.08));
      color: var(--color-primary, #026937);
      border: 1px solid var(--color-primary-border, rgba(2, 105, 55, 0.25));
      font-weight: 700;
      font-size: var(--font-size-xs, 0.75rem);
      font-family: var(--font-mono, monospace);
      white-space: nowrap;
    }
    .badge-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }
  `]
})
export class SpybConsecutivoBadgeComponent {
  @Input({ required: true }) consecutivo!: string;
}

