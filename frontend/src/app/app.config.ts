import { registerLocaleData } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import localePt from '@angular/common/locales/pt';
import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import {
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
  withViewTransitions,
} from '@angular/router';

import { routes } from './app.routes';
import { APP_CONFIG, AppConfig } from './core/config';

registerLocaleData(localePt);

export function criarAppConfig(config: AppConfig): ApplicationConfig {
  return {
    providers: [
      provideBrowserGlobalErrorListeners(),
      // XHR (padrão) em vez de fetch: precisamos do progresso de upload para o S3.
      provideHttpClient(),
      provideRouter(
        routes,
        withComponentInputBinding(),
        withViewTransitions(),
        withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' }),
      ),
      { provide: LOCALE_ID, useValue: 'pt-BR' },
      { provide: APP_CONFIG, useValue: config },
    ],
  };
}
