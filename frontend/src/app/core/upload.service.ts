import { HttpClient, HttpEventType } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { filter, map, Observable, switchMap } from 'rxjs';

import { UploadAutorizado } from './models';

export type EventoUpload = { tipo: 'progresso'; percentual: number } | { tipo: 'concluido'; autorizacao: UploadAutorizado };

/**
 * Upload direto para o S3 (RF-02):
 *   1. a API devolve uma URL pré-assinada (PUT) e registra o arquivo no RDS;
 *   2. o navegador faz PUT do arquivo nessa URL — o backend nunca recebe os bytes;
 *   3. o S3 dispara a Lambda que processa o arquivo.
 */
@Injectable({ providedIn: 'root' })
export class UploadService {
  private readonly http = inject(HttpClient);

  enviar(arquivo: File, autorizar: Observable<UploadAutorizado>): Observable<EventoUpload> {
    return autorizar.pipe(
      switchMap((aut) =>
        this.http
          .put(aut.uploadUrl, arquivo, {
            headers: { 'Content-Type': aut.contentType },
            reportProgress: true,
            observe: 'events',
          })
          .pipe(
            filter((e) => e.type === HttpEventType.UploadProgress || e.type === HttpEventType.Response),
            map((e): EventoUpload =>
              e.type === HttpEventType.UploadProgress
                ? { tipo: 'progresso', percentual: e.total ? Math.round((100 * e.loaded) / e.total) : 50 }
                : { tipo: 'concluido', autorizacao: aut },
            ),
          ),
      ),
    );
  }
}
