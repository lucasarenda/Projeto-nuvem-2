export interface Cidade {
  nome: string;
  uf: string;
  lat: number;
  lng: number;
}

/** Principais cidades para quem prefere não compartilhar a localização exata. */
export const CIDADES: Cidade[] = [
  { nome: 'São Paulo', uf: 'SP', lat: -23.5505, lng: -46.6333 },
  { nome: 'Campinas', uf: 'SP', lat: -22.9056, lng: -47.0608 },
  { nome: 'Santos', uf: 'SP', lat: -23.9608, lng: -46.3336 },
  { nome: 'Ribeirão Preto', uf: 'SP', lat: -21.1775, lng: -47.8103 },
  { nome: 'Rio de Janeiro', uf: 'RJ', lat: -22.9068, lng: -43.1729 },
  { nome: 'Niterói', uf: 'RJ', lat: -22.8832, lng: -43.1034 },
  { nome: 'Belo Horizonte', uf: 'MG', lat: -19.9167, lng: -43.9345 },
  { nome: 'Uberlândia', uf: 'MG', lat: -18.9186, lng: -48.2772 },
  { nome: 'Vitória', uf: 'ES', lat: -20.3155, lng: -40.3128 },
  { nome: 'Curitiba', uf: 'PR', lat: -25.4284, lng: -49.2733 },
  { nome: 'Londrina', uf: 'PR', lat: -23.3045, lng: -51.1696 },
  { nome: 'Florianópolis', uf: 'SC', lat: -27.5954, lng: -48.548 },
  { nome: 'Joinville', uf: 'SC', lat: -26.3045, lng: -48.8487 },
  { nome: 'Porto Alegre', uf: 'RS', lat: -30.0346, lng: -51.2177 },
  { nome: 'Caxias do Sul', uf: 'RS', lat: -29.1678, lng: -51.1794 },
  { nome: 'Brasília', uf: 'DF', lat: -15.7939, lng: -47.8828 },
  { nome: 'Goiânia', uf: 'GO', lat: -16.6869, lng: -49.2648 },
  { nome: 'Campo Grande', uf: 'MS', lat: -20.4697, lng: -54.6201 },
  { nome: 'Cuiabá', uf: 'MT', lat: -15.601, lng: -56.0974 },
  { nome: 'Salvador', uf: 'BA', lat: -12.9777, lng: -38.5016 },
  { nome: 'Recife', uf: 'PE', lat: -8.0476, lng: -34.877 },
  { nome: 'Fortaleza', uf: 'CE', lat: -3.7319, lng: -38.5267 },
  { nome: 'Natal', uf: 'RN', lat: -5.7945, lng: -35.211 },
  { nome: 'João Pessoa', uf: 'PB', lat: -7.1195, lng: -34.845 },
  { nome: 'Maceió', uf: 'AL', lat: -9.6658, lng: -35.735 },
  { nome: 'Aracaju', uf: 'SE', lat: -10.9472, lng: -37.0731 },
  { nome: 'Teresina', uf: 'PI', lat: -5.0892, lng: -42.8019 },
  { nome: 'São Luís', uf: 'MA', lat: -2.5307, lng: -44.3068 },
  { nome: 'Belém', uf: 'PA', lat: -1.4558, lng: -48.4902 },
  { nome: 'Manaus', uf: 'AM', lat: -3.119, lng: -60.0217 },
  { nome: 'Porto Velho', uf: 'RO', lat: -8.7612, lng: -63.9004 },
  { nome: 'Macapá', uf: 'AP', lat: 0.0349, lng: -51.0694 },
  { nome: 'Boa Vista', uf: 'RR', lat: 2.8235, lng: -60.6758 },
  { nome: 'Rio Branco', uf: 'AC', lat: -9.9754, lng: -67.8249 },
  { nome: 'Palmas', uf: 'TO', lat: -10.1689, lng: -48.3317 },
];

export function cidadeMaisProxima(lat: number, lng: number): Cidade {
  return CIDADES.reduce((melhor, c) =>
    Math.hypot(c.lat - lat, c.lng - lng) < Math.hypot(melhor.lat - lat, melhor.lng - lng) ? c : melhor,
  );
}

export function localizacaoAtual(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Seu navegador não oferece geolocalização.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: +p.coords.latitude.toFixed(5), lng: +p.coords.longitude.toFixed(5) }),
      (e) => reject(new Error(e.code === e.PERMISSION_DENIED
        ? 'Permissão de localização negada. Escolha sua cidade na lista.'
        : 'Não foi possível obter sua localização.')),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  });
}
