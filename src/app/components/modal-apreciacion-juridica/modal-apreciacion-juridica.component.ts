import { Component, inject } from '@angular/core';

import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-modal-apreciacion-juridica',
    imports: [
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    FormsModule
],
    templateUrl: './modal-apreciacion-juridica.component.html',
    styleUrls: ['./modal-apreciacion-juridica.component.scss']
})
export class ModalApreciacionJuridicaComponent {
  public readonly dialogRef = inject(MatDialogRef<ModalApreciacionJuridicaComponent>);

  /**
   * VBG-06-02: la matriz exige retirar de la UI la lista desplegable "Tipo de
   * apreciación". El tipo queda fijo (1 = Jurídica), sin selección de la
   * persona usuaria — solo distingue este modal del de apreciación psicológica.
   */
  data = {
    idTipoApreciacion: 1,
    descripcion: ''
  };

  onNoClick(): void {
    this.dialogRef.close();
  }
}
