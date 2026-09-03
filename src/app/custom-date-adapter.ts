import { Injectable } from '@angular/core';
import { NativeDateAdapter } from '@angular/material/core';

@Injectable()
export class CustomDateAdapter extends NativeDateAdapter {
  override parse(value: any): Date | null {
    if (typeof value === 'string' && value.indexOf('/') > -1) {
      const str = value.split('/');
      if (str.length === 3) {
        const year = Number(str[2]);
        const month = Number(str[1]) - 1;
        const date = Number(str[0]);
        if (!isNaN(year) && !isNaN(month) && !isNaN(date)) {
          return new Date(year, month, date);
        }
      }
    }
    const timestamp = typeof value === 'number' ? value : Date.parse(value);
    return isNaN(timestamp) ? null : new Date(timestamp);
  }

  override format(date: Date, displayFormat: unknown): string {
    if (displayFormat === 'input') {
      const day = date.getDate();
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      return `${this._to2digit(day)}/${this._to2digit(month)}/${year}`;
    }
    return date.toLocaleDateString(this.locale, { day: '2-digit', month: 'long', year: 'numeric' });
  }

  private _to2digit(n: number): string {
    return ('00' + n).slice(-2);
  }
}

export const CUSTOM_DATE_FORMATS = {
  parse: {
    dateInput: { month: 'short', year: 'numeric', day: 'numeric' },
  },
  display: {
    dateInput: 'input',
    monthYearLabel: { year: 'numeric', month: 'numeric' },
    dateA11yLabel: { year: 'numeric', month: 'long', day: 'numeric' },
    monthYearA11yLabel: { year: 'numeric', month: 'long' },
  },
};

export function formatFechaCreacion(fechaStr: string | null | undefined): string {
  if (!fechaStr) return '';
  const match = fechaStr.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
  if (match) {
    return `${match[3]}/${match[2]}/${match[1]} ${match[4]}:${match[5]}:${match[6]}`;
  }
  try {
    const date = new Date(fechaStr);
    if (!isNaN(date.getTime())) {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    }
  } catch (e) {}
  return fechaStr;
}

export function formatOnlyDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const cleanStr = dateStr.trim();
  const matchDash = cleanStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (matchDash) {
    return `${matchDash[3]}/${matchDash[2]}/${matchDash[1]}`;
  }
  const matchSlash = cleanStr.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (matchSlash) {
    return `${matchSlash[1]}/${matchSlash[2]}/${matchSlash[3]}`;
  }
  return dateStr;
}
