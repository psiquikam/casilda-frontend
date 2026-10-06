import { Component, inject } from '@angular/core';

import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-modal-apreciacion-psicologica',
    imports: [
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    FormsModule
],
    templateUrl: './modal-apreciacion-psicologica.component.html',
    styleUrls: ['./modal-apreciacion-psicologica.component.scss']
})
export class ModalApreciacionPsicologicaComponent {
  public readonly dialogRef = inject(MatDialogRef<ModalApreciacionPsicologicaComponent>);

  /** VBG-06-02: sin lista desplegable de tipo. 2 = Psicológica, fijo por este modal. */
  data = {
    idTipoApreciacion: 2,
    descripcion: ''
  };

  onNoClick(): void {
    this.dialogRef.close();
  }
}
