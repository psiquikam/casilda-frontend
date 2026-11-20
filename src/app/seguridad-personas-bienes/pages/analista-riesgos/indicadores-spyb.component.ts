import { Component, OnInit, inject } from '@angular/core';

import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { SpybAnalistaService } from '../../services/spyb-analista.service';
import { IndicadoresSpyb } from '../../models/spyb.models';

@Component({
  selector: 'app-indicadores-spyb',
  standalone: true,
  imports: [
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule
],
  templateUrl: './indicadores-spyb.component.html',
  styleUrls: ['./indicadores-spyb.component.scss']
})
export class IndicadoresSpybComponent implements OnInit {
  private readonly analistaService = inject(SpybAnalistaService);

  cargando = true;
  indicadores: IndicadoresSpyb | null = null;

  ngOnInit(): void {
    this.analistaService.obtenerIndicadores().subscribe({
      next: (data) => {
        this.indicadores = data;
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
      }
    });
  }

  objectEntries(obj: Record<string, number> | undefined): [string, number][] {
    return obj ? Object.entries(obj) : [];
  }

  calcularPorcentaje(val: number, total: number): number {
    if (!total || total === 0) return 0;
    return Math.round((val / total) * 100);
  }
}

