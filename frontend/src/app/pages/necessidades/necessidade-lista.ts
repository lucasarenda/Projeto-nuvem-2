import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime, Subject, switchMap } from 'rxjs';

import { ApiService, mensagemErro } from '../../core/api.service';
import { FeedbackService } from '../../core/feedback.service';
import {
  CATEGORIAS, Categoria, LISTA_CATEGORIAS, LISTA_URGENCIAS, Necessidade, STATUS_NECESSIDADE, StatusNecessidade, UFS, Urgencia, URGENCIAS,
} from '../../core/models';
import { Icon } from '../../shared/icon';
import { CatIcon, Progresso, UrgenciaBadge, Vazio } from '../../shared/pequenos';

@Component({
  selector: 'app-necessidade-lista',
  imports: [RouterLink, FormsModule, DatePipe, Icon, CatIcon, Progresso, UrgenciaBadge, Vazio],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container page">
      <header class="page-header">
        <div>
          <span class="eyebrow"><app-icon nome="caixa" [tamanho]="14" /> Mural de necessidades</span>
          <h1>O que as ONGs precisam</h1>
          <p>Publicadas pelas instituições — manualmente ou por importação de planilha.</p>
        </div>
        <a routerLink="/necessidades/nova" class="btn btn-primary"><app-icon nome="mais" [tamanho]="18" /> Nova necessidade</a>
      </header>

      <div class="filtros card">
        <div class="row">
          <div class="input-icon grow" style="min-width: 220px">
            <app-icon nome="busca" [tamanho]="18" />
            <input class="input" placeholder="Buscar item ou ONG" [ngModel]="termo()" (ngModelChange)="termo.set($event); buscar()" />
          </div>
          <select class="select" style="width: 150px" [ngModel]="urgencia()" (ngModelChange)="urgencia.set($event); buscar()" aria-label="Urgência">
            <option value="">Toda urgência</option>
            @for (u of urgencias; track u) { <option [value]="u">{{ rotUrg[u] }}</option> }
          </select>
          <select class="select" style="width: 150px" [ngModel]="status()" (ngModelChange)="status.set($event); buscar()" aria-label="Status">
            <option value="">Todos status</option>
            @for (s of statusLista; track s) { <option [value]="s">{{ rotStatus[s] }}</option> }
          </select>
          <select class="select" style="width: 120px" [ngModel]="uf()" (ngModelChange)="uf.set($event); buscar()" aria-label="UF">
            <option value="">UF</option>
            @for (u of ufs; track u) { <option [value]="u">{{ u }}</option> }
          </select>
        </div>
        <div class="chips mt-2">
          <button class="chip" [class.ativo]="!categoria()" (click)="categoria.set(''); buscar()">Todas</button>
          @for (c of categorias; track c) {
            <button class="chip" [class.ativo]="categoria() === c" (click)="categoria.set(c); buscar()">
              <span class="ponto" [style.background]="cats[c].cor"></span> {{ cats[c].rotulo }}
            </button>
          }
        </div>
      </div>

      @if (erro()) {
        <div class="alert alert-erro mt-3"><app-icon nome="alerta" /> {{ erro() }}</div>
      } @else if (lista(); as l) {
        <p class="muted small mt-3">{{ l.length }} {{ l.length === 1 ? 'necessidade' : 'necessidades' }}</p>
        @if (l.length) {
          <div class="table-wrap">
            <table class="table">
              <thead>
                <tr><th>Item</th><th>ONG</th><th>Urgência</th><th style="min-width: 200px">Progresso</th><th>Publicada</th><th></th></tr>
              </thead>
              <tbody>
                @for (n of l; track n.id) {
                  <tr [class.fechada]="n.status !== 'ABERTA'">
                    <td>
                      <div class="row" style="gap: 12px; flex-wrap: nowrap">
                        <app-cat-icon [categoria]="n.categoria" [tamanho]="38" />
                        <div>
                          <strong>{{ n.titulo }}</strong>
                          <div class="tiny muted">{{ cats[n.categoria].rotulo }}@if (n.origem === 'CSV') { · via CSV }</div>
                        </div>
                      </div>
                    </td>
                    <td><a [routerLink]="['/ongs', n.ongId]" class="strong">{{ n.ongNome }}</a><div class="tiny muted">{{ n.ongCidade }}/{{ n.ongUf }}</div></td>
                    <td>
                      @if (n.status === 'ABERTA') { <app-urgencia [urgencia]="n.urgencia" /> }
                      @else { <span class="badge" [class.badge-verde]="n.status === 'ATENDIDA'">{{ rotStatus[n.status] }}</span> }
                    </td>
                    <td><app-progresso [recebido]="n.quantidadeRecebida" [total]="n.quantidade" [unidade]="n.unidade" /></td>
                    <td class="nowrap muted small">{{ n.criadoEm | date: 'dd/MM/yy' }}</td>
                    <td class="nowrap" style="text-align:right">
                      <a class="btn btn-ghost btn-icon btn-sm" [routerLink]="['/necessidades', n.id, 'editar']" aria-label="Editar"><app-icon nome="lapis" [tamanho]="15" /></a>
                      <button class="btn btn-ghost btn-icon btn-sm" (click)="excluir(n)" aria-label="Excluir"><app-icon nome="lixeira" [tamanho]="15" /></button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        } @else {
          <app-vazio icone="busca" titulo="Nenhuma necessidade encontrada" texto="Ajuste os filtros ou publique uma nova necessidade." />
        }
      } @else {
        <div class="skeleton mt-3" style="height: 360px"></div>
      }
    </div>
  `,
  styles: `
    .filtros { padding: 16px; }
    .ponto { width: 9px; height: 9px; border-radius: 50%; }
    .chip.ativo .ponto { box-shadow: 0 0 0 2px #fff; }
    tr.fechada td { opacity: .65; }
  `,
})
export class NecessidadeLista {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FeedbackService);

  protected readonly cats = CATEGORIAS;
  protected readonly categorias = LISTA_CATEGORIAS;
  protected readonly urgencias = LISTA_URGENCIAS;
  protected readonly rotUrg = URGENCIAS;
  protected readonly rotStatus = STATUS_NECESSIDADE;
  protected readonly statusLista = Object.keys(STATUS_NECESSIDADE) as StatusNecessidade[];
  protected readonly ufs = UFS;

  protected readonly termo = signal('');
  protected readonly categoria = signal<Categoria | ''>('');
  protected readonly urgencia = signal<Urgencia | ''>('');
  protected readonly status = signal<StatusNecessidade | ''>('ABERTA');
  protected readonly uf = signal('');
  protected readonly lista = signal<Necessidade[] | null>(null);
  protected readonly erro = signal('');
  private readonly busca$ = new Subject<void>();

  constructor() {
    this.busca$
      .pipe(
        debounceTime(200),
        switchMap(() =>
          this.api.listarNecessidades({
            termo: this.termo(), categoria: this.categoria(), urgencia: this.urgencia(), status: this.status(), uf: this.uf(),
          }),
        ),
      )
      .subscribe({ next: (l) => this.lista.set(l), error: (e) => this.erro.set(mensagemErro(e)) });
    this.buscar();
  }

  protected buscar(): void {
    this.busca$.next();
  }

  protected async excluir(n: Necessidade): Promise<void> {
    if (!(await this.fb.confirmar('Excluir necessidade?', `"${n.titulo}" e as doações ligadas a ela serão removidas.`, { confirmar: 'Excluir', perigo: true }))) return;
    this.api.excluirNecessidade(n.id).subscribe({
      next: () => {
        this.lista.update((l) => l?.filter((x) => x.id !== n.id) ?? null);
        this.fb.sucesso('Necessidade excluída.');
      },
      error: (e) => this.fb.erro(mensagemErro(e)),
    });
  }
}
