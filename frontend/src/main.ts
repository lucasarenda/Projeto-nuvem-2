import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { criarAppConfig } from './app/app.config';
import { normalizarConfig } from './app/core/config';

fetch('config.json', { cache: 'no-store' })
  .then((r) => (r.ok ? r.json() : null))
  .catch(() => null)
  .then((cfg) => bootstrapApplication(App, criarAppConfig(normalizarConfig(cfg))))
  .catch((err) => console.error(err));
