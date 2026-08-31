import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-funcionalidad-no-disponible',
  imports: [MatButtonModule, MatIconModule, RouterLink],
  templateUrl: './funcionalidad-no-disponible.component.html',
  styleUrl: './funcionalidad-no-disponible.component.scss'
})
export class FuncionalidadNoDisponibleComponent {}
