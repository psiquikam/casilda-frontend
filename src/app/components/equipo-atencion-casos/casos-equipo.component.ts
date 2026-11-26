import { Component } from '@angular/core';
import { RegistroAtencionComponent } from '../registro-atencion/registro-atencion.component';

@Component({
  selector: 'app-casos-equipo',
  standalone: true,
  imports: [RegistroAtencionComponent],
  templateUrl: './casos-equipo.component.html',
  styleUrl: './casos-equipo.component.scss'
})
export class CasosEquipoComponent {}
