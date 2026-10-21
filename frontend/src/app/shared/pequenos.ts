import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { CATEGORIAS, Categoria, corDoNome, iniciais, Urgencia, URGENCIAS } from '../core/models';
import { Icon } from './icon';

@Component({
  selector: 'app-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display:contents' },
  template: `
    <span class="avatar" [class.avatar-lg]="tamanho() === 'lg'" [class.avatar-sm]="tamanho() === 'sm'" [style.--av]="cor()">
      @if (url()) {
        <img [src]="url()" [alt]="'Logo de ' + nome()" loading="lazy" />
      } @else {
        {{ letras() }}
      }
    </span>
  `,
})
export class Avatar {
  readonly nome = input.required<string>();
  readonly url = input<string | null>(null);
  readonly tamanho = input<'sm' | 'md' | 'lg'>('md');
  protected readonly cor = computed(() => corDoNome(this.nome()));
  protected readonly letras = computed(() => iniciais(this.nome()));
}

@Component({
  selector: 'app-cat-icon',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display:contents' },
  template: `
    <span class="cat-icon" [style.--c]="info().cor" [style.width.px]="tamanho()" [style.height.px]="tamanho()"
          [attr.title]="info().rotulo">
      <app-icon [nome]="info().icone" [tamanho]="tamanho() * 0.48" />
    </span>
  `,
})
export class CatIcon {
  readonly categoria = input.required<Categoria>();
  readonly tamanho = input(44);
  protected readonly info = computed(() => CATEGORIAS[this.categoria()]);
}

@Component({
  selector: 'app-urgencia',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display:contents' },
  template: `<span class="badge badge-dot" [class]="'badge badge-dot urg-' + urgencia()">{{ rotulo() }}</span>`,
})
export class UrgenciaBadge {
  readonly urgencia = input.required<Urgencia>();
  protected readonly rotulo = computed(() => URGENCIAS[this.urgencia()]);
}

@Component({
  selector: 'app-progresso',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="row-between small mb-0" style="margin-bottom:6px">
      <span><strong>{{ recebido() }}</strong><span class="muted">&nbsp;de {{ total() }} {{ unidade() }}</span></span>
      <span class="strong" [style.color]="percentual() >= 100 ? 'var(--primary)' : 'var(--ink-2)'">{{ percentual() }}%</span>
    </div>
    <div class="progress" [class.coral]="coral()" role="progressbar" [attr.aria-valuenow]="percentual()" aria-valuemin="0" aria-valuemax="100">
      <span [style.width.%]="percentual()"></span>
    </div>
  `,
})
export class Progresso {
  readonly recebido = input.required<number>();
  readonly total = input.required<number>();
  readonly unidade = input('');
  readonly coral = input(false);
  protected readonly percentual = computed(() =>
    this.total() ? Math.min(100, Math.round((100 * this.recebido()) / this.total())) : 0,
  );
}

@Component({
  selector: 'app-vazio',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="empty">
      <div class="empty-icon"><app-icon [nome]="icone()" [tamanho]="28" /></div>
      <h3>{{ titulo() }}</h3>
      <p>{{ texto() }}</p>
      <ng-content />
    </div>
  `,
})
export class Vazio {
  readonly icone = input('caixa');
  readonly titulo = input.required<string>();
  readonly texto = input('');
}
