export type Categoria = 'ALIMENTO' | 'ROUPA' | 'CALCADO' | 'HIGIENE' | 'COBERTOR' | 'BRINQUEDO' | 'OUTRO';
export type Urgencia = 'BAIXA' | 'MEDIA' | 'ALTA';
export type StatusNecessidade = 'ABERTA' | 'ATENDIDA' | 'CANCELADA';
export type StatusDoacao = 'PENDENTE' | 'CONFIRMADA' | 'ENTREGUE' | 'CANCELADA';
export type EntidadeTipo = 'ONG' | 'NECESSIDADE' | 'DOACAO';

export interface Ong {
  id: number;
  nome: string;
  cnpj: string | null;
  email: string;
  telefone: string | null;
  descricao: string | null;
  endereco: string | null;
  cidade: string;
  uf: string;
  latitude: number;
  longitude: number;
  logoUrl: string | null;
  necessidadesAbertas: number;
  criadoEm: string;
  atualizadoEm: string;
}
export type OngForm = Omit<Ong, 'id' | 'logoUrl' | 'necessidadesAbertas' | 'criadoEm' | 'atualizadoEm'>;

export interface Necessidade {
  id: number;
  ongId: number;
  ongNome: string;
  ongCidade: string;
  ongUf: string;
  titulo: string;
  descricao: string | null;
  categoria: Categoria;
  quantidade: number;
  quantidadeRecebida: number;
  faltam: number;
  unidade: string;
  urgencia: Urgencia;
  status: StatusNecessidade;
  origem: 'MANUAL' | 'CSV';
  criadoEm: string;
  atualizadoEm: string;
}
export interface NecessidadeForm {
  ongId: number;
  titulo: string;
  descricao: string | null;
  categoria: Categoria;
  quantidade: number;
  unidade: string;
  urgencia: Urgencia;
  status?: StatusNecessidade;
}

export interface Doador {
  id: number;
  nome: string;
  email: string;
  telefone: string | null;
  cidade: string | null;
  uf: string | null;
  latitude: number | null;
  longitude: number | null;
  criadoEm: string;
}
export type DoadorForm = Omit<Doador, 'id' | 'criadoEm'>;

export interface Doacao {
  id: number;
  doadorId: number;
  doadorNome: string;
  doadorEmail: string;
  necessidadeId: number;
  necessidadeTitulo: string;
  categoria: Categoria;
  unidade: string;
  ongId: number;
  ongNome: string;
  ongCidade: string;
  ongUf: string;
  descricao: string;
  quantidade: number;
  status: StatusDoacao;
  distanciaKm: number | null;
  observacao: string | null;
  criadoEm: string;
  atualizadoEm: string;
}
export interface DoacaoForm {
  doadorId: number;
  necessidadeId: number;
  descricao: string;
  quantidade: number;
  observacao?: string | null;
}

export interface Sugestao {
  necessidadeId: number;
  titulo: string;
  descricao: string | null;
  categoria: Categoria;
  urgencia: Urgencia;
  unidade: string;
  quantidade: number;
  quantidadeRecebida: number;
  faltam: number;
  ongId: number;
  ongNome: string;
  ongCidade: string;
  ongUf: string;
  ongEndereco: string | null;
  ongLogoUrl: string | null;
  ongLatitude: number;
  ongLongitude: number;
  distanciaKm: number;
  pontuacao: number;
  melhorMatch: boolean;
  motivo: string;
}

export interface Anexo {
  id: number;
  entidadeTipo: EntidadeTipo;
  entidadeId: number;
  nomeOriginal: string;
  contentType: string;
  tamanhoBytes: number | null;
  status: 'AGUARDANDO_UPLOAD' | 'PROCESSADO' | 'ERRO';
  largura: number | null;
  altura: number | null;
  paginas: number | null;
  url: string | null;
  thumbnailUrl: string | null;
  erro: string | null;
  processadoEm: string | null;
  criadoEm: string;
}

export interface UploadAutorizado {
  anexoId?: number;
  importacaoId?: number;
  uploadUrl: string;
  metodo: 'PUT';
  contentType: string;
  key: string;
  expiraEm: string;
}

export interface Importacao {
  id: number;
  ongId: number;
  nomeArquivo: string;
  status: 'AGUARDANDO_UPLOAD' | 'CONCLUIDA' | 'ERRO';
  linhasTotal: number | null;
  linhasImportadas: number | null;
  linhasComErro: number | null;
  mensagens: string | null;
  processadoEm: string | null;
  criadoEm: string;
}

/* ---------- relatórios (Lambda) ---------- */
export interface RespostaRelatorio<T> {
  relatorio: string;
  uf: string | null;
  geradoEm: string;
  dados: T;
}
export interface Resumo {
  ongs: number;
  necessidades_abertas: number;
  necessidades_atendidas: number;
  doacoes_entregues: number;
  doacoes_em_andamento: number;
  itens_entregues: number;
  doadores_ativos: number;
  distancia_media_km: number | null;
  cidades_atendidas: number;
}
export interface LinhaCategoria {
  categoria: Categoria;
  abertas: number;
  atendidas: number;
  ongs: number;
  quantidade_solicitada: number;
  quantidade_recebida: number;
  percentual_atendido: number | null;
  urgentes: number;
}
export interface LinhaRankingOng {
  id: number;
  nome: string;
  cidade: string;
  uf: string;
  necessidades_abertas: number;
  doacoes_recebidas: number;
  itens_recebidos: number;
  doadores: number;
  percentual_atendido: number | null;
}
export interface DoacoesPorMes {
  meses: string[];
  series: Partial<Record<Categoria, number[]>>;
  totais: number[];
}
export interface LinhaTopDoador {
  id: number;
  nome: string;
  cidade: string | null;
  uf: string | null;
  doacoes: number;
  itens: number;
  ongs_ajudadas: number;
}

/* ---------- rótulos e aparência ---------- */
export interface InfoCategoria {
  rotulo: string;
  icone: string;
  cor: string;
  exemplos: string;
}

export const CATEGORIAS: Record<Categoria, InfoCategoria> = {
  ALIMENTO: { rotulo: 'Alimentos', icone: 'talheres', cor: 'var(--cat-alimento)', exemplos: 'Arroz, feijão, leite, cestas' },
  ROUPA: { rotulo: 'Roupas', icone: 'camiseta', cor: 'var(--cat-roupa)', exemplos: 'Casacos, camisetas, uniformes' },
  CALCADO: { rotulo: 'Calçados', icone: 'tenis', cor: 'var(--cat-calcado)', exemplos: 'Tênis, botas, chinelos' },
  HIGIENE: { rotulo: 'Higiene', icone: 'gota', cor: 'var(--cat-higiene)', exemplos: 'Sabonete, fraldas, absorventes' },
  COBERTOR: { rotulo: 'Cobertores', icone: 'cama', cor: 'var(--cat-cobertor)', exemplos: 'Cobertores, mantas, lençóis' },
  BRINQUEDO: { rotulo: 'Brinquedos', icone: 'estrela', cor: 'var(--cat-brinquedo)', exemplos: 'Jogos, livros, bonecas' },
  OUTRO: { rotulo: 'Outros', icone: 'pontos', cor: 'var(--cat-outro)', exemplos: 'Descartáveis, utensílios' },
};
export const LISTA_CATEGORIAS = Object.keys(CATEGORIAS) as Categoria[];

export const URGENCIAS: Record<Urgencia, string> = { ALTA: 'Urgente', MEDIA: 'Média', BAIXA: 'Baixa' };
export const LISTA_URGENCIAS: Urgencia[] = ['ALTA', 'MEDIA', 'BAIXA'];

export const STATUS_NECESSIDADE: Record<StatusNecessidade, string> = {
  ABERTA: 'Aberta', ATENDIDA: 'Atendida', CANCELADA: 'Cancelada',
};
export const STATUS_DOACAO: Record<StatusDoacao, { rotulo: string; classe: string; icone: string }> = {
  PENDENTE: { rotulo: 'Pendente', classe: 'badge-sol', icone: 'relogio' },
  CONFIRMADA: { rotulo: 'Confirmada', classe: 'badge-coral', icone: 'check' },
  ENTREGUE: { rotulo: 'Entregue', classe: 'badge-verde', icone: 'caminhao' },
  CANCELADA: { rotulo: 'Cancelada', classe: 'badge-cinza', icone: 'x' },
};

export const UFS = ['AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT', 'PA', 'PB', 'PE',
  'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO'];

export const UNIDADES = ['unidades', 'kg', 'pacotes', 'peças', 'pares', 'kits', 'litros', 'latas', 'cestas', 'caixas'];

const PALETA_AVATAR = ['#0e7c5a', '#f25c3c', '#6250d6', '#2a78d6', '#b86e00', '#d55181', '#1b8a8a'];
export function corDoNome(nome: string): string {
  let h = 0;
  for (const c of nome) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return PALETA_AVATAR[h % PALETA_AVATAR.length];
}
export function iniciais(nome: string): string {
  const ligacoes = new Set(['de', 'da', 'do', 'das', 'dos', 'e']);
  const partes = nome.replace(/[^\p{L}\s]/gu, '').split(/\s+/).filter((p) => p && !ligacoes.has(p.toLowerCase()));
  return ((partes[0]?.[0] ?? '') + (partes[1]?.[0] ?? '')).toUpperCase() || '?';
}
