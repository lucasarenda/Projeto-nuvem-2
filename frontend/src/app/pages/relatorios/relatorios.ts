import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { ApiService, mensagemErro } from '../../core/api.service';
import {
  CATEGORIAS, DoacoesPorMes, LinhaCategoria, LinhaRankingOng, LinhaTopDoador, LISTA_CATEGORIAS, Resumo, UFS,
} from '../../core/models';
import { ColunasEmpilhadas, SerieColuna } from '../../shared/colunas-empilhadas';
import { Icon } from '../../shared/icon';
import { CatIcon } from '../../shared/pequenos';

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

@Component({
  selector: 'app-relatorios',
  imports: [FormsModule, RouterLink, DatePipe, DecimalPipe, Icon, CatIcon, ColunasEmpilhadas],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './relatorios.html',
  styleUrl: './relatorios.scss',
})
export class Relatorios {
  private readonly api = inject(ApiService);

  protected readonly ufs = UFS;
  protected readonly cats = CATEGORIAS;
  protected readonly uf = signal('');
  protected readonly carregando = signal(true);
  protected readonly erro = signal('');
  protected readonly geradoEm = signal<string | null>(null);
  protected readonly verTabela = signal(false);

  protected readonly resumo = signal<Resumo | null>(null);
  protected readonly categorias = signal<LinhaCategoria[]>([]);
  protected readonly ranking = signal<LinhaRankingOng[]>([]);
  protected readonly mensal = signal<DoacoesPorMes | null>(null);
  protected readonly doadores = signal<LinhaTopDoador[]>([]);

  protected readonly rotulosMeses = computed(() =>
    (this.mensal()?.meses ?? []).map((m) => MESES[Number(m.slice(5, 7)) - 1] + (m.endsWith('-01') ? ` ${m.slice(2, 4)}` : '')),
  );
  protected readonly seriesMensais = computed<SerieColuna[]>(() => {
    const s = this.mensal()?.series ?? {};
    // ordem fixa das categorias: a cor acompanha a categoria, nunca a posição
    return LISTA_CATEGORIAS.filter((c) => s[c]).map((c) => ({ nome: CATEGORIAS[c].rotulo, cor: CATEGORIAS[c].cor, valores: s[c]! }));
  });
  protected readonly maxItensOng = computed(() => Math.max(1, ...this.ranking().map((r) => r.itens_recebidos)));
  protected readonly totalMensal = computed(() => (this.mensal()?.totais ?? []).reduce((a, b) => a + b, 0));

  constructor() {
    this.carregar();
  }

  protected carregar(): void {
    const f = { uf: this.uf() };
    this.carregando.set(true);
    this.erro.set('');
    forkJoin({
      resumo: this.api.relatorio<Resumo>('resumo', f),
      categorias: this.api.relatorio<LinhaCategoria[]>('necessidades-por-categoria', f),
      ranking: this.api.relatorio<LinhaRankingOng[]>('ranking-ongs', { ...f, limite: 8 }),
      mensal: this.api.relatorio<DoacoesPorMes>('doacoes-por-mes', f),
      doadores: this.api.relatorio<LinhaTopDoador[]>('top-doadores', { ...f, limite: 5 }),
    }).subscribe({
      next: (r) => {
        this.resumo.set(r.resumo.dados);
        this.categorias.set(r.categorias.dados);
        this.ranking.set(r.ranking.dados);
        this.mensal.set(r.mensal.dados);
        this.doadores.set(r.doadores.dados);
        this.geradoEm.set(r.resumo.geradoEm);
        this.carregando.set(false);
      },
      error: (e) => {
        this.erro.set(mensagemErro(e, 'Não foi possível gerar os relatórios.'));
        this.carregando.set(false);
      },
    });
  }

  protected percentual(l: LinhaCategoria): number {
    return l.percentual_atendido ?? 0;
  }
}
