import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
    selector: 'app-acceso-denegado',
    imports: [
        CommonModule,
        RouterLink,
        MatIconModule,
        MatButtonModule
    ],
    templateUrl: './acceso-denegado.component.html',
    styleUrls: ['./acceso-denegado.component.scss']
})
export class AccesoDenegadoComponent {}
