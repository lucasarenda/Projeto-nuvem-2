import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ApiService, mensagemErro } from '../../core/api.service';
import { FeedbackService } from '../../core/feedback.service';
import { Doacao, STATUS_DOACAO, StatusDoacao } from '../../core/models';
import { Anexos } from '../../shared/anexos';
import { Icon } from '../../shared/icon';
import { CatIcon, Vazio } from '../../shared/pequenos';

interface Coluna {
  status: StatusDoacao;
  titulo: string;
  dica: string;
}

@Component({
  selector: 'app-doacoes',
  imports: [RouterLink, DatePipe, DecimalPipe, Icon, CatIcon, Vazio, Anexos],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './doacoes.html',
  styleUrl: './doacoes.scss',
})
export class Doacoes implements OnInit {
  /** ?doadorId=... vindo do fluxo "Quero doar". */
  readonly doadorId = input<string | undefined>();

  private readonly api = inject(ApiService);
  private readonly fb = inject(FeedbackService);

  protected readonly info = STATUS_DOACAO;
  protected readonly colunas: Coluna[] = [
    { status: 'PENDENTE', titulo: 'Pendentes', dica: 'Aguardando a ONG confirmar' },
    { status: 'CONFIRMADA', titulo: 'Confirmadas', dica: 'Combinadas, a caminho' },
    { status: 'ENTREGUE', titulo: 'Entregues', dica: 'Itens recebidos pela ONG' },
  ];

  protected readonly doacoes = signal<Doacao[] | null>(null);
  protected readonly erro = signal('');
  protected readonly selecionada = signal<Doacao | null>(null);
  protected readonly ocupado = signal<number | null>(null);

  protected readonly porStatus = computed(() => {
    const mapa: Record<StatusDoacao, Doacao[]> = { PENDENTE: [], CONFIRMADA: [], ENTREGUE: [], CANCELADA: [] };
    for (const d of this.doacoes() ?? []) mapa[d.status].push(d);
    return mapa;
  });
  protected readonly nomeDoador = computed(() => (this.doadorId() ? this.doacoes()?.[0]?.doadorNome ?? null : null));

  ngOnInit(): void {
    this.api.listarDoacoes({ doadorId: Number(this.doadorId()) || undefined }).subscribe({
      next: (l) => this.doacoes.set(l),
      error: (e) => this.erro.set(mensagemErro(e)),
    });
  }

  protected proximo(s: StatusDoacao): StatusDoacao | null {
    return s === 'PENDENTE' ? 'CONFIRMADA' : s === 'CONFIRMADA' ? 'ENTREGUE' : null;
  }

  protected mover(d: Doacao, status: StatusDoacao): void {
    this.ocupado.set(d.id);
    this.api.alterarStatusDoacao(d.id, status).subscribe({
      next: (nova) => {
        this.ocupado.set(null);
        this.doacoes.update((l) => l?.map((x) => (x.id === nova.id ? nova : x)) ?? null);
        if (this.selecionada()?.id === nova.id) this.selecionada.set(nova);
        this.fb.sucesso(status === 'ENTREGUE' ? `Entrega registrada! +${nova.quantidade} ${nova.unidade} para ${nova.ongNome}.` : `Doação ${this.info[status].rotulo.toLowerCase()}.`);
      },
      error: (e) => {
        this.ocupado.set(null);
        this.fb.erro(mensagemErro(e));
      },
    });
  }

  protected async cancelar(d: Doacao): Promise<void> {
    if (await this.fb.confirmar('Cancelar doação?', 'A doação ficará registrada como cancelada.', { confirmar: 'Cancelar doação', perigo: true })) {
      this.mover(d, 'CANCELADA');
    }
  }

  protected async excluir(d: Doacao): Promise<void> {
    const msg = d.status === 'ENTREGUE'
      ? 'Ela já foi entregue: a quantidade recebida pela necessidade será estornada.'
      : 'O registro será apagado definitivamente.';
    if (!(await this.fb.confirmar('Excluir doação?', msg, { confirmar: 'Excluir', perigo: true }))) return;
    this.api.excluirDoacao(d.id).subscribe({
      next: () => {
        this.doacoes.update((l) => l?.filter((x) => x.id !== d.id) ?? null);
        this.selecionada.set(null);
        this.fb.sucesso('Doação excluída.');
      },
      error: (e) => this.fb.erro(mensagemErro(e)),
    });
  }
}
