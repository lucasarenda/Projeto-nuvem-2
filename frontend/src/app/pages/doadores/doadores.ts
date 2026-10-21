import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime, Subject, switchMap } from 'rxjs';

import { ApiService, errosDeCampo, mensagemErro } from '../../core/api.service';
import { FeedbackService } from '../../core/feedback.service';
import { CIDADES } from '../../core/geo';
import { Doador, DoadorForm, UFS } from '../../core/models';
import { Icon } from '../../shared/icon';
import { Avatar, Vazio } from '../../shared/pequenos';

@Component({
  selector: 'app-doadores',
  imports: [ReactiveFormsModule, RouterLink, DatePipe, Icon, Avatar, Vazio],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container page">
      <header class="page-header">
        <div>
          <span class="eyebrow"><app-icon nome="pessoas" [tamanho]="14" /> Comunidade</span>
          <h1>Doadores</h1>
          <p>Pessoas que já usaram o DoaPerto. O cadastro também acontece automaticamente no fluxo "Quero doar".</p>
        </div>
        <button class="btn btn-primary" (click)="abrir()"><app-icon nome="mais" [tamanho]="18" /> Novo doador</button>
      </header>

      <div class="input-icon mb-3" style="max-width: 420px">
        <app-icon nome="busca" [tamanho]="18" />
        <input class="input" placeholder="Buscar por nome ou e-mail" (input)="buscar($any($event.target).value)" />
      </div>

      @if (erro()) {
        <div class="alert alert-erro"><app-icon nome="alerta" /> {{ erro() }}</div>
      } @else if (doadores(); as lista) {
        @if (lista.length) {
          <div class="table-wrap">
            <table class="table">
              <thead><tr><th>Doador</th><th>Contato</th><th>Cidade</th><th>Desde</th><th></th></tr></thead>
              <tbody>
                @for (d of lista; track d.id) {
                  <tr>
                    <td><div class="row" style="gap:12px; flex-wrap:nowrap"><app-avatar [nome]="d.nome" tamanho="sm" /><strong>{{ d.nome }}</strong></div></td>
                    <td><span class="small">{{ d.email }}</span>@if (d.telefone) { <br><span class="tiny muted">{{ d.telefone }}</span> }</td>
                    <td class="small">{{ d.cidade ? d.cidade + '/' + d.uf : '—' }}
                      @if (d.latitude != null) { <app-icon nome="pin" [tamanho]="12" style="color: var(--primary)" title="Com localização" /> }</td>
                    <td class="small muted nowrap">{{ d.criadoEm | date: 'MMM yyyy' }}</td>
                    <td class="nowrap" style="text-align:right">
                      <a class="btn btn-ghost btn-sm" [routerLink]="['/doacoes']" [queryParams]="{ doadorId: d.id }"><app-icon nome="coracao" [tamanho]="14" /> Doações</a>
                      <button class="btn btn-ghost btn-icon btn-sm" (click)="abrir(d)" aria-label="Editar"><app-icon nome="lapis" [tamanho]="15" /></button>
                      <button class="btn btn-ghost btn-icon btn-sm" (click)="excluir(d)" aria-label="Excluir"><app-icon nome="lixeira" [tamanho]="15" /></button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        } @else {
          <app-vazio icone="pessoas" titulo="Nenhum doador encontrado" texto="Os doadores aparecem aqui após a primeira doação." />
        }
      } @else {
        <div class="skeleton" style="height: 320px"></div>
      }
    </div>

    @if (editando() !== undefined) {
      <div class="overlay" (click)="fechar()">
        <form class="modal" [formGroup]="form" (ngSubmit)="salvar()" (click)="$event.stopPropagation()" role="dialog" aria-modal="true" novalidate>
          <div class="row-between mb-2">
            <h3 class="mb-0">{{ editando() ? 'Editar doador' : 'Novo doador' }}</h3>
            <button type="button" class="btn btn-ghost btn-icon" (click)="fechar()" aria-label="Fechar"><app-icon nome="x" /></button>
          </div>
          <div class="form-grid">
            <div class="field col-6"><label for="dn">Nome *</label><input id="dn" class="input" formControlName="nome" />
              @if (campo('nome'); as e) { <span class="erro">{{ e }}</span> }</div>
            <div class="field col-6"><label for="de">E-mail *</label><input id="de" class="input" type="email" formControlName="email" />
              @if (campo('email'); as e) { <span class="erro">{{ e }}</span> }</div>
            <div class="field col-6"><label for="dt">Telefone</label><input id="dt" class="input" formControlName="telefone" /></div>
            <div class="field col-4"><label for="dc">Cidade</label><input id="dc" class="input" formControlName="cidade" list="cid-doador" (change)="cidade()" />
              <datalist id="cid-doador">@for (c of cidades; track c.nome) { <option [value]="c.nome">{{ c.uf }}</option> }</datalist></div>
            <div class="field col-2"><label for="du">UF</label>
              <select id="du" class="select" formControlName="uf"><option value="">—</option>@for (u of ufs; track u) { <option [value]="u">{{ u }}</option> }</select></div>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-ghost" (click)="fechar()">Cancelar</button>
            <button class="btn btn-primary" type="submit" [disabled]="salvando()">
              @if (salvando()) { <span class="spinner"></span> } Salvar
            </button>
          </div>
        </form>
      </div>
    }
  `,
})
export class Doadores {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FeedbackService);

  protected readonly ufs = UFS;
  protected readonly cidades = CIDADES;
  protected readonly doadores = signal<Doador[] | null>(null);
  protected readonly erro = signal('');
  /** undefined = modal fechado; null = novo; Doador = edição. */
  protected readonly editando = signal<Doador | null | undefined>(undefined);
  protected readonly salvando = signal(false);
  private readonly errosServidor = signal<Record<string, string>>({});
  private readonly busca$ = new Subject<string>();

  protected readonly form = inject(NonNullableFormBuilder).group({
    nome: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    telefone: [''],
    cidade: [''],
    uf: [''],
    latitude: [null as number | null],
    longitude: [null as number | null],
  });

  constructor() {
    this.busca$.pipe(debounceTime(250), switchMap((termo) => this.api.listarDoadores({ termo })))
      .subscribe({ next: (l) => this.doadores.set(l), error: (e) => this.erro.set(mensagemErro(e)) });
    this.busca$.next('');
  }

  protected buscar(termo: string): void {
    this.busca$.next(termo);
  }

  protected abrir(d: Doador | null = null): void {
    this.errosServidor.set({});
    this.form.reset();
    if (d) this.form.patchValue({ ...d, telefone: d.telefone ?? '', cidade: d.cidade ?? '', uf: d.uf ?? '' });
    this.editando.set(d);
  }

  protected fechar(): void {
    this.editando.set(undefined);
  }

  protected cidade(): void {
    const c = CIDADES.find((x) => x.nome.toLowerCase() === this.form.controls.cidade.value.trim().toLowerCase());
    if (c) this.form.patchValue({ cidade: c.nome, uf: c.uf, latitude: c.lat, longitude: c.lng });
  }

  protected campo(nome: 'nome' | 'email'): string | null {
    const s = this.errosServidor()[nome];
    if (s) return s;
    const c = this.form.controls[nome];
    return c.touched && c.invalid ? (c.hasError('email') ? 'E-mail inválido' : 'Campo obrigatório') : null;
  }

  protected salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.salvando.set(true);
    const atual = this.editando();
    this.api.salvarDoador(this.form.getRawValue() as DoadorForm, atual?.id).subscribe({
      next: (d) => {
        this.salvando.set(false);
        this.doadores.update((l) => (atual ? l?.map((x) => (x.id === d.id ? d : x)) : [d, ...(l ?? [])]) ?? null);
        this.fb.sucesso(atual ? 'Doador atualizado.' : 'Doador cadastrado.');
        this.fechar();
      },
      error: (e) => {
        this.salvando.set(false);
        this.errosServidor.set(errosDeCampo(e));
        this.fb.erro(mensagemErro(e));
      },
    });
  }

  protected async excluir(d: Doador): Promise<void> {
    if (!(await this.fb.confirmar('Excluir doador?', `${d.nome} e todas as suas doações serão removidos.`, { confirmar: 'Excluir', perigo: true }))) return;
    this.api.excluirDoador(d.id).subscribe({
      next: () => {
        this.doadores.update((l) => l?.filter((x) => x.id !== d.id) ?? null);
        this.fb.sucesso('Doador excluído.');
      },
      error: (e) => this.fb.erro(mensagemErro(e)),
    });
  }
}
