import { ApplicationConfig, LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEsCo from '@angular/common/locales/es-CO';
import { provideRouter, TitleStrategy } from '@angular/router';
import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './services/auth.interceptor';
import { loadingInterceptor } from './services/loading.interceptor';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { CustomDateAdapter, CUSTOM_DATE_FORMATS } from './custom-date-adapter';
import { CasildaTitleStrategy } from './core/a11y/casilda-title.strategy';
import { getPaginadorIntlEs } from './core/i18n/paginador-es';

// Locale colombiano para los pipes `date`, `number` y `currency` y para el
// calendario de Material (nombres de meses y días en español).
registerLocaleData(localeEsCo);

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(withInterceptors([loadingInterceptor, authInterceptor])),
    { provide: LOCALE_ID, useValue: 'es-CO' },
    { provide: MAT_DATE_LOCALE, useValue: 'es-CO' },
    { provide: DateAdapter, useClass: CustomDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: CUSTOM_DATE_FORMATS },
    { provide: MatPaginatorIntl, useValue: getPaginadorIntlEs() },
    // Título de documento por ruta (WCAG 2.4.2): `title` en app.routes.ts + sufijo institucional.
    { provide: TitleStrategy, useClass: CasildaTitleStrategy }
  ]
};
