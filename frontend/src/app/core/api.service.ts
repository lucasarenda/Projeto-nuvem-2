import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { APP_CONFIG } from './config';
import {
  Anexo,
  Categoria,
  Doacao,
  DoacaoForm,
  Doador,
  DoadorForm,
  EntidadeTipo,
  Importacao,
  Necessidade,
  NecessidadeForm,
  Ong,
  OngForm,
  RespostaRelatorio,
  StatusDoacao,
  Sugestao,
  UploadAutorizado,
} from './models';

type Filtros = Record<string, string | number | boolean | null | undefined>;

function params(filtros: Filtros = {}): HttpParams {
  let p = new HttpParams();
  for (const [k, v] of Object.entries(filtros)) {
    if (v !== null && v !== undefined && v !== '') p = p.set(k, String(v));
  }
  return p;
}

/** Extrai a mensagem de um ProblemDetail (RFC 9457) devolvido pela API. */
export function mensagemErro(err: unknown, padrao = 'Algo deu errado. Tente novamente.'): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) return 'Não foi possível falar com o servidor. Verifique a URL em config.json e o CORS.';
    const corpo = err.error as { detail?: string; title?: string } | null;
    return corpo?.detail || corpo?.title || padrao;
  }
  return padrao;
}

export function errosDeCampo(err: unknown): Record<string, string> {
  if (err instanceof HttpErrorResponse) {
    return (err.error as { campos?: Record<string, string> } | null)?.campos ?? {};
  }
  return {};
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly cfg = inject(APP_CONFIG);
  private readonly api = `${this.cfg.apiBaseUrl}/api`;

  // ONGs
  listarOngs(f: { termo?: string; uf?: string } = {}): Observable<Ong[]> {
    return this.http.get<Ong[]>(`${this.api}/ongs`, { params: params(f) });
  }
  ong(id: number): Observable<Ong> {
    return this.http.get<Ong>(`${this.api}/ongs/${id}`);
  }
  salvarOng(dados: OngForm, id?: number): Observable<Ong> {
    return id ? this.http.put<Ong>(`${this.api}/ongs/${id}`, dados) : this.http.post<Ong>(`${this.api}/ongs`, dados);
  }
  excluirOng(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/ongs/${id}`);
  }

  // Necessidades
  listarNecessidades(f: Filtros = {}): Observable<Necessidade[]> {
    return this.http.get<Necessidade[]>(`${this.api}/necessidades`, { params: params(f) });
  }
  necessidade(id: number): Observable<Necessidade> {
    return this.http.get<Necessidade>(`${this.api}/necessidades/${id}`);
  }
  salvarNecessidade(dados: NecessidadeForm, id?: number): Observable<Necessidade> {
    return id
      ? this.http.put<Necessidade>(`${this.api}/necessidades/${id}`, dados)
      : this.http.post<Necessidade>(`${this.api}/necessidades`, dados);
  }
  excluirNecessidade(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/necessidades/${id}`);
  }

  // Doadores
  listarDoadores(f: { termo?: string; email?: string } = {}): Observable<Doador[]> {
    return this.http.get<Doador[]>(`${this.api}/doadores`, { params: params(f) });
  }
  salvarDoador(dados: DoadorForm, id?: number): Observable<Doador> {
    return id
      ? this.http.put<Doador>(`${this.api}/doadores/${id}`, dados)
      : this.http.post<Doador>(`${this.api}/doadores`, dados);
  }
  excluirDoador(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/doadores/${id}`);
  }

  // Doações
  listarDoacoes(f: { doadorId?: number; ongId?: number; necessidadeId?: number; status?: StatusDoacao } = {}): Observable<Doacao[]> {
    return this.http.get<Doacao[]>(`${this.api}/doacoes`, { params: params(f) });
  }
  criarDoacao(dados: DoacaoForm): Observable<Doacao> {
    return this.http.post<Doacao>(`${this.api}/doacoes`, dados);
  }
  alterarStatusDoacao(id: number, status: StatusDoacao, observacao?: string): Observable<Doacao> {
    return this.http.patch<Doacao>(`${this.api}/doacoes/${id}/status`, { status, observacao });
  }
  excluirDoacao(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/doacoes/${id}`);
  }

  // Match
  sugestoes(f: { categoria?: Categoria; lat: number; lng: number; termo?: string; limite?: number }): Observable<Sugestao[]> {
    return this.http.get<Sugestao[]>(`${this.api}/sugestoes`, { params: params(f) });
  }

  // Arquivos (S3)
  listarAnexos(entidadeTipo: EntidadeTipo, entidadeId: number): Observable<Anexo[]> {
    return this.http.get<Anexo[]>(`${this.api}/anexos`, { params: params({ entidadeTipo, entidadeId }) });
  }
  autorizarUpload(entidadeTipo: EntidadeTipo, entidadeId: number, arquivo: File): Observable<UploadAutorizado> {
    return this.http.post<UploadAutorizado>(`${this.api}/anexos/upload-url`, {
      entidadeTipo, entidadeId, nomeArquivo: arquivo.name, contentType: arquivo.type, tamanhoBytes: arquivo.size,
    });
  }
  autorizarLogo(ongId: number, arquivo: File): Observable<UploadAutorizado> {
    return this.http.post<UploadAutorizado>(`${this.api}/ongs/${ongId}/logo/upload-url`, {
      nomeArquivo: arquivo.name, contentType: arquivo.type, tamanhoBytes: arquivo.size,
    });
  }
  excluirAnexo(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/anexos/${id}`);
  }

  // Importação CSV
  autorizarImportacao(ongId: number, arquivo: File): Observable<UploadAutorizado> {
    return this.http.post<UploadAutorizado>(`${this.api}/ongs/${ongId}/importacoes`, {
      nomeArquivo: arquivo.name, tamanhoBytes: arquivo.size,
    });
  }
  listarImportacoes(ongId: number): Observable<Importacao[]> {
    return this.http.get<Importacao[]>(`${this.api}/ongs/${ongId}/importacoes`);
  }

  // Relatórios (Lambda via API Gateway)
  relatorio<T>(tipo: string, f: Filtros = {}): Observable<RespostaRelatorio<T>> {
    return this.http.get<RespostaRelatorio<T>>(`${this.cfg.relatoriosBaseUrl}/relatorios/${tipo}`, { params: params(f) });
  }
}
