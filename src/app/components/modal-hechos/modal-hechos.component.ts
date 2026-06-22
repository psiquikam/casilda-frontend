import { Component, Injectable } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { NativeDateAdapter, MAT_DATE_FORMATS, DateAdapter, MatNativeDateModule } from '@angular/material/core';

@Injectable()
export class HechoDateAdapter extends NativeDateAdapter {
  override format(date: Date, displayFormat: Object): string {
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const to2digit = (n: number) => ('00' + n).slice(-2);
    return `${to2digit(month)}/${year}`;
  }

  override parse(value: any): Date | null {
    if (typeof value === 'string') {
      const parts = value.split('/');
      if (parts.length === 2) {
        const month = Number(parts[0]) - 1;
        const year = Number(parts[1]);
        if (!isNaN(month) && !isNaN(year)) {
          return new Date(year, month, 1);
        }
      }
    }
    const timestamp = typeof value === 'number' ? value : Date.parse(value);
    return isNaN(timestamp) ? null : new Date(timestamp);
  }
}

export const HECHO_DATE_FORMATS = {
  parse: {
    dateInput: 'input',
  },
  display: {
    dateInput: 'input',
    monthYearLabel: { year: 'numeric', month: 'short' },
    dateA11yLabel: { year: 'numeric', month: 'long', day: 'numeric' },
    monthYearA11yLabel: { year: 'numeric', month: 'long' },
  },
};

@Component({
  selector: 'app-modal-hechos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  providers: [
    { provide: DateAdapter, useClass: HechoDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: HECHO_DATE_FORMATS }
  ],
  templateUrl: './modal-hechos.component.html',
  styleUrls: ['./modal-hechos.component.scss']
})
export class ModalHechosComponent {

  data: {
    fecha: Date | string;
    lugar: string;
    descripcion: string;
  } = {
    fecha: '',
    lugar: '',
    descripcion: ''
  };

  constructor(public dialogRef: MatDialogRef<ModalHechosComponent>) {}

  onNoClick(): void {
    this.dialogRef.close();
  }

  setMonthAndYear(normalizedMonthAndYear: Date, datepicker: any) {
    this.data.fecha = normalizedMonthAndYear;
    datepicker.close();
  }
}