import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime, Subject, switchMap } from 'rxjs';

import { ApiService, mensagemErro } from '../../core/api.service';
import { Ong, UFS } from '../../core/models';
import { Icon } from '../../shared/icon';
import { Avatar, Vazio } from '../../shared/pequenos';

@Component({
  selector: 'app-ong-lista',
  imports: [RouterLink, FormsModule, Icon, Avatar, Vazio],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container page">
      <header class="page-header">
        <div>
          <span class="eyebrow"><app-icon nome="predio" [tamanho]="14" /> Rede de instituições</span>
          <h1>ONGs parceiras</h1>
          <p>Instituições que recebem alimentos, roupas e itens essenciais pelo DoaPerto.</p>
        </div>
        <a routerLink="/ongs/nova" class="btn btn-primary"><app-icon nome="mais" [tamanho]="18" /> Cadastrar ONG</a>
      </header>

      <div class="row mb-3">
        <div class="input-icon grow" style="max-width: 420px">
          <app-icon nome="busca" [tamanho]="18" />
          <input class="input" placeholder="Buscar por nome ou cidade" [ngModel]="termo()" (ngModelChange)="termo.set($event); buscar()" />
        </div>
        <select class="select" style="width: 140px" [ngModel]="uf()" (ngModelChange)="uf.set($event); buscar()" aria-label="UF">
          <option value="">Todas UFs</option>
          @for (u of ufs; track u) { <option [value]="u">{{ u }}</option> }
        </select>
        @if (ongs(); as l) { <span class="muted small">{{ l.length }} {{ l.length === 1 ? 'instituição' : 'instituições' }}</span> }
      </div>

      @if (erro()) {
        <div class="alert alert-erro"><app-icon nome="alerta" /> {{ erro() }}</div>
      } @else if (ongs(); as lista) {
        @if (lista.length) {
          <div class="grid grid-auto">
            @for (o of lista; track o.id) {
              <a class="card card-hover ong-card" [routerLink]="['/ongs', o.id]">
                <div class="row row-nowrap">
                  <app-avatar [nome]="o.nome" [url]="o.logoUrl" />
                  <div class="grow">
                    <h3 class="mb-0 truncate" style="font-size:1.05rem">{{ o.nome }}</h3>
                    <span class="small muted"><app-icon nome="pin" [tamanho]="13" /> {{ o.cidade }}/{{ o.uf }}</span>
                  </div>
                </div>
                <p class="small muted clamp-2 mt-2 mb-0" style="min-height: 2.9em">{{ o.descricao || 'Sem descrição.' }}</p>
                <div class="row-between mt-2">
                  @if (o.necessidadesAbertas) {
                    <span class="badge badge-coral badge-dot">{{ o.necessidadesAbertas }} {{ o.necessidadesAbertas === 1 ? 'necessidade aberta' : 'necessidades abertas' }}</span>
                  } @else {
                    <span class="badge badge-verde">Tudo atendido 🎉</span>
                  }
                  <app-icon nome="seta-dir" [tamanho]="18" class="seta" />
                </div>
              </a>
            }
          </div>
        } @else if (filtrando()) {
          <app-vazio icone="busca" titulo="Nada encontrado" texto="Nenhuma ONG corresponde aos filtros." />
        } @else {
          <app-vazio icone="predio" titulo="Nenhuma ONG ainda" texto="Cadastre a primeira instituição para começar a receber doações.">
            <a routerLink="/ongs/nova" class="btn btn-primary"><app-icon nome="mais" [tamanho]="18" /> Cadastrar ONG</a>
          </app-vazio>
        }
      } @else {
        <div class="grid grid-auto">
          @for (i of [1, 2, 3, 4, 5, 6]; track i) { <div class="skeleton" style="height: 178px"></div> }
        </div>
      }
    </div>
  `,
  styles: `
    .ong-card { display: flex; flex-direction: column; }
    .ong-card .seta { color: var(--muted); transition: transform .15s, color .15s; }
    .ong-card:hover .seta { transform: translateX(3px); color: var(--primary); }
  `,
})
export class OngLista {
  private readonly api = inject(ApiService);
  protected readonly ufs = UFS;
  protected readonly termo = signal('');
  protected readonly uf = signal('');
  protected readonly ongs = signal<Ong[] | null>(null);
  protected readonly erro = signal('');
  protected readonly filtrando = computed(() => !!this.termo() || !!this.uf());
  private readonly busca$ = new Subject<void>();

  constructor() {
    this.busca$
      .pipe(debounceTime(250), switchMap(() => this.api.listarOngs({ termo: this.termo(), uf: this.uf() })))
      .subscribe({ next: (l) => this.ongs.set(l), error: (e) => this.erro.set(mensagemErro(e)) });
    this.api.listarOngs().subscribe({ next: (l) => this.ongs.set(l), error: (e) => this.erro.set(mensagemErro(e)) });
  }

  protected buscar(): void {
    this.busca$.next();
  }
}
