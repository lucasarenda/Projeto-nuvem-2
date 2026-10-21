import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ApiService } from '../../core/api.service';
import { CATEGORIAS, LISTA_CATEGORIAS, Necessidade, Resumo } from '../../core/models';
import { Icon } from '../../shared/icon';
import { CatIcon, Progresso, UrgenciaBadge } from '../../shared/pequenos';

@Component({
  selector: 'app-home',
  imports: [RouterLink, Icon, CatIcon, Progresso, UrgenciaBadge, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private readonly api = inject(ApiService);

  protected readonly categorias = LISTA_CATEGORIAS.map((c) => ({ chave: c, ...CATEGORIAS[c] }));
  protected readonly resumo = signal<Resumo | null>(null);
  protected readonly urgentes = signal<Necessidade[] | null>(null);

  protected readonly passos = [
    { icone: 'caixa', titulo: 'Conte o que vai doar', texto: 'Alimentos, roupas, cobertores… escolha a categoria e a quantidade.' },
    { icone: 'pin', titulo: 'Diga onde você está', texto: 'Use sua localização ou escolha a cidade. Nada de cadastro complicado.' },
    { icone: 'alvo', titulo: 'Receba o melhor match', texto: 'Sugerimos a ONG mais próxima que precisa exatamente daquilo — e com urgência.' },
  ];

  constructor() {
    this.api.relatorio<Resumo>('resumo').subscribe({ next: (r) => this.resumo.set(r.dados), error: () => {} });
    this.api.listarNecessidades({ urgencia: 'ALTA', status: 'ABERTA' }).subscribe({
      next: (l) => this.urgentes.set(l.slice(0, 6)),
      error: () => this.urgentes.set([]),
    });
  }
}
