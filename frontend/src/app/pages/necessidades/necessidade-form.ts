import { ChangeDetectionStrategy, Component, inject, input, OnInit, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ApiService, errosDeCampo, mensagemErro } from '../../core/api.service';
import { FeedbackService } from '../../core/feedback.service';
import {
  CATEGORIAS, Categoria, LISTA_CATEGORIAS, LISTA_URGENCIAS, NecessidadeForm, Ong, STATUS_NECESSIDADE, StatusNecessidade, UNIDADES, Urgencia, URGENCIAS,
} from '../../core/models';
import { Anexos } from '../../shared/anexos';
import { Icon } from '../../shared/icon';
import { CatIcon } from '../../shared/pequenos';

@Component({
  selector: 'app-necessidade-form',
  imports: [ReactiveFormsModule, RouterLink, Icon, CatIcon, Anexos],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container page" style="max-width: 880px">
      <a [routerLink]="voltar()" class="link-seta small mb-2" style="display:inline-flex"><app-icon nome="seta-esq" [tamanho]="15" /> Voltar</a>
      <header class="page-header">
        <div>
          <span class="eyebrow"><app-icon nome="caixa" [tamanho]="14" /> {{ id() ? 'Editar' : 'Nova' }} necessidade</span>
          <h1>{{ id() ? 'Editar necessidade' : 'Do que a ONG precisa?' }}</h1>
          <p>Seja específico: doadores encontram a sua ONG pela categoria e a urgência ajuda no ranking.</p>
        </div>
      </header>

      <form class="card card-lg" [formGroup]="form" (ngSubmit)="salvar()" novalidate>
        <div class="form-grid">
          <div class="field col-6">
            <label for="ong">ONG *</label>
            <select id="ong" class="select" formControlName="ongId">
              <option [ngValue]="null" disabled>Selecione a instituição…</option>
              @for (o of ongs(); track o.id) { <option [ngValue]="o.id">{{ o.nome }} — {{ o.cidade }}/{{ o.uf }}</option> }
            </select>
            @if (erro('ongId'); as e) { <span class="erro">{{ e }}</span> }
          </div>

          <div class="field col-6">
            <span class="label">Categoria *</span>
            <div class="cats">
              @for (c of categorias; track c) {
                <button type="button" class="cat" [class.ativo]="form.controls.categoria.value === c" (click)="form.controls.categoria.setValue(c)">
                  <app-cat-icon [categoria]="c" [tamanho]="34" />
                  <span>{{ cats[c].rotulo }}</span>
                </button>
              }
            </div>
            @if (erro('categoria'); as e) { <span class="erro">{{ e }}</span> }
          </div>

          <div class="field col-6">
            <label for="titulo">Item *</label>
            <input id="titulo" class="input" formControlName="titulo" placeholder="Ex.: Cobertores de casal" maxlength="150" />
            @if (erro('titulo'); as e) { <span class="erro">{{ e }}</span> }
          </div>
          <div class="field col-2">
            <label for="qtd">Quantidade *</label>
            <input id="qtd" class="input" type="number" min="1" formControlName="quantidade" />
            @if (erro('quantidade'); as e) { <span class="erro">{{ e }}</span> }
          </div>
          <div class="field col-2">
            <label for="un">Unidade *</label>
            <input id="un" class="input" formControlName="unidade" list="unidades" maxlength="20" />
            <datalist id="unidades">@for (u of unidades; track u) { <option [value]="u"></option> }</datalist>
            @if (erro('unidade'); as e) { <span class="erro">{{ e }}</span> }
          </div>
          <div class="field col-2">
            <label for="st">Status</label>
            <select id="st" class="select" formControlName="status">
              @for (s of statusLista; track s) { <option [value]="s">{{ rotStatus[s] }}</option> }
            </select>
          </div>

          <div class="field col-6">
            <span class="label">Urgência *</span>
            <div class="segmented">
              @for (u of urgencias; track u) {
                <button type="button" [class.ativo]="form.controls.urgencia.value === u" (click)="form.controls.urgencia.setValue(u)">
                  <span class="ponto" [style.background]="corUrg[u]"></span>{{ rotUrg[u] }}
                </button>
              }
            </div>
          </div>

          <div class="field col-6">
            <label for="desc">Detalhes</label>
            <textarea id="desc" class="textarea" formControlName="descricao" maxlength="2000" placeholder="Tamanhos, marcas, validade mínima…"></textarea>
          </div>
        </div>

        <div class="form-actions">
          <a class="btn btn-ghost" [routerLink]="voltar()">Cancelar</a>
          <button class="btn btn-primary" type="submit" [disabled]="salvando()">
            @if (salvando()) { <span class="spinner"></span> } @else { <app-icon nome="check" [tamanho]="18" /> }
            {{ id() ? 'Salvar' : 'Publicar necessidade' }}
          </button>
        </div>
      </form>

      @if (id()) {
        <section class="card card-lg mt-3">
          <h3>Fotos de referência</h3>
          <p class="muted small">Mostre o tipo de item esperado. A Lambda gera a miniatura automaticamente.</p>
          <app-anexos entidadeTipo="NECESSIDADE" [entidadeId]="+id()!" />
        </section>
      }
    </div>
  `,
  styles: `
    .cats { display: grid; grid-template-columns: repeat(auto-fill, minmax(104px, 1fr)); gap: 10px; }
    .cat { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 14px 8px; border-radius: 14px; cursor: pointer;
      border: 1.5px solid var(--line); background: var(--surface); font: 600 .82rem var(--font); color: var(--ink-2); transition: all .15s; }
    .cat:hover { border-color: var(--line-2); }
    .cat.ativo { border-color: var(--ink); color: var(--ink); box-shadow: 0 0 0 3px rgba(23,34,28,.08); }
    .ponto { width: 8px; height: 8px; border-radius: 50%; }
  `,
})
export class NecessidadeFormPage implements OnInit {
  readonly id = input<string | undefined>();
  readonly ongIdParam = input<string | undefined>(undefined, { alias: 'ongId' });

  private readonly api = inject(ApiService);
  private readonly fb = inject(FeedbackService);
  private readonly router = inject(Router);

  protected readonly cats = CATEGORIAS;
  protected readonly categorias = LISTA_CATEGORIAS;
  protected readonly urgencias = LISTA_URGENCIAS;
  protected readonly rotUrg = URGENCIAS;
  protected readonly corUrg: Record<Urgencia, string> = { ALTA: 'var(--accent)', MEDIA: 'var(--sun)', BAIXA: 'var(--primary)' };
  protected readonly rotStatus = STATUS_NECESSIDADE;
  protected readonly statusLista = Object.keys(STATUS_NECESSIDADE) as StatusNecessidade[];
  protected readonly unidades = UNIDADES;
  protected readonly ongs = signal<Ong[]>([]);
  protected readonly salvando = signal(false);
  protected readonly voltar = signal<unknown[]>(['/necessidades']);
  private readonly errosServidor = signal<Record<string, string>>({});

  protected readonly form = inject(NonNullableFormBuilder).group({
    ongId: [null as number | null, Validators.required],
    titulo: ['', [Validators.required, Validators.maxLength(150)]],
    descricao: [''],
    categoria: [null as Categoria | null, Validators.required],
    quantidade: [10, [Validators.required, Validators.min(1)]],
    unidade: ['unidades', Validators.required],
    urgencia: ['MEDIA' as Urgencia, Validators.required],
    status: ['ABERTA' as StatusNecessidade],
  });

  ngOnInit(): void {
    this.api.listarOngs().subscribe((l) => this.ongs.set(l));
    const ongId = Number(this.ongIdParam());
    if (ongId) {
      this.form.patchValue({ ongId });
      this.voltar.set(['/ongs', ongId]);
    }
    const id = Number(this.id());
    if (id) {
      this.api.necessidade(id).subscribe({
        next: (n) => {
          this.form.patchValue({ ...n, descricao: n.descricao ?? '' });
          this.voltar.set(['/ongs', n.ongId]);
        },
        error: (e) => this.fb.erro(mensagemErro(e)),
      });
    }
  }

  protected erro(campo: keyof typeof this.form.controls): string | null {
    const servidor = this.errosServidor()[campo];
    if (servidor) return servidor;
    const c = this.form.controls[campo];
    if (!c.touched || c.valid) return null;
    if (c.hasError('required')) return 'Campo obrigatório';
    if (c.hasError('min')) return 'Mínimo 1';
    return 'Valor inválido';
  }

  protected salvar(): void {
    this.errosServidor.set({});
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.fb.erro('Revise os campos destacados.');
      return;
    }
    this.salvando.set(true);
    const id = Number(this.id()) || undefined;
    this.api.salvarNecessidade(this.form.getRawValue() as NecessidadeForm, id).subscribe({
      next: (n) => {
        this.fb.sucesso(id ? 'Necessidade atualizada.' : 'Necessidade publicada! Doadores já podem encontrá-la.');
        this.router.navigate(['/ongs', n.ongId]);
      },
      error: (e) => {
        this.salvando.set(false);
        this.errosServidor.set(errosDeCampo(e));
        this.fb.erro(mensagemErro(e));
      },
    });
  }
}
