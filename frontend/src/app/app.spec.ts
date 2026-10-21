import { normalizarConfig } from './core/config';
import { iniciais } from './core/models';

describe('config', () => {
  it('remove barra final e usa a API como base dos relatórios por padrão', () => {
    expect(normalizarConfig({ apiBaseUrl: 'https://abc.execute-api.us-east-1.amazonaws.com/' })).toEqual({
      apiBaseUrl: 'https://abc.execute-api.us-east-1.amazonaws.com',
      relatoriosBaseUrl: 'https://abc.execute-api.us-east-1.amazonaws.com',
    });
  });

  it('cai para localhost quando config.json não existe', () => {
    expect(normalizarConfig(null).apiBaseUrl).toBe('http://localhost:8080');
  });
});

describe('iniciais', () => {
  it('gera as iniciais do nome da ONG', () => {
    expect(iniciais('Casa Abrigo Recomeço')).toBe('CA');
    expect(iniciais('Lar das Crianças')).toBe('LC');
  });
});
