import { InjectionToken } from '@angular/core';

/**
 * Endereços carregados em tempo de execução de /config.json (ver main.ts).
 * Assim o mesmo build serve em qualquer sessão do Learner Lab: basta editar
 * o config.json no bucket do site, sem recompilar (RNF-03).
 */
export interface AppConfig {
  /** Base da API CRUD (ex.: URL do API Gateway ou http://localhost:8080). */
  apiBaseUrl: string;
  /** Base dos relatórios Lambda (normalmente a mesma URL do API Gateway). */
  relatoriosBaseUrl: string;
}

export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG');

export function normalizarConfig(bruto: Partial<AppConfig> | null | undefined): AppConfig {
  const semBarra = (u: string | undefined, padrao: string) => (u?.trim() || padrao).replace(/\/+$/, '');
  const api = semBarra(bruto?.apiBaseUrl, 'http://localhost:8080');
  return { apiBaseUrl: api, relatoriosBaseUrl: semBarra(bruto?.relatoriosBaseUrl, api) };
}
