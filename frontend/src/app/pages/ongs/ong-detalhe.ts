import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, input, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { ApiService, mensagemErro } from '../../core/api.service';
import { FeedbackService } from '../../core/feedback.service';
import { Doacao, Importacao, Necessidade, Ong, STATUS_DOACAO, STATUS_NECESSIDADE } from '../../core/models';
import { UploadService } from '../../core/upload.service';
import { Anexos } from '../../shared/anexos';
import { Icon } from '../../shared/icon';
import { Avatar, CatIcon, Progresso, UrgenciaBadge, Vazio } from '../../shared/pequenos';

type Aba = 'necessidades' | 'doacoes' | 'importar' | 'arquivos';

const MODELO_CSV = `titulo;categoria;quantidade;unidade;urgencia;descricao
Arroz 5 kg;alimento;100;pacotes;alta;Arroz tipo 1
Cobertor de casal;cobertor;40;unidades;alta;
Camiseta infantil;roupa;60;peças;media;Tamanhos 4 a 10
Kit de higiene;higiene;80;kits;baixa;Sabonete, escova e pasta
`;

@Component({
  selector: 'app-ong-detalhe',
  imports: [RouterLink, DatePipe, DecimalPipe, Icon, Avatar, CatIcon, Progresso, UrgenciaBadge, Vazio, Anexos],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ong-detalhe.html',
  styleUrl: './ong-detalhe.scss',
})
export class OngDetalhe implements OnInit {
  readonly id = input.required<string>();

  private readonly api = inject(ApiService);
  private readonly fb = inject(FeedbackService);
  private readonly upload = inject(UploadService);
  private readonly router = inject(Router);

  protected readonly statusNec = STATUS_NECESSIDADE;
  protected readonly statusDoacao = STATUS_DOACAO;
  protected readonly ong = signal<Ong | null>(null);
  protected readonly erro = signal('');
  protected readonly necessidades = signal<Necessidade[]>([]);
  protected readonly doacoes = signal<Doacao[]>([]);
  protected readonly importacoes = signal<Importacao[]>([]);
  protected readonly aba = signal<Aba>('necessidades');
  protected readonly enviandoLogo = signal(false);
  protected readonly enviandoCsv = signal<number | null>(null);
  protected readonly arrastando = signal(false);

  protected readonly abertas = computed(() => this.necessidades().filter((n) => n.status === 'ABERTA'));
  protected readonly itensRecebidos = computed(() =>
    this.doacoes().filter((d) => d.status === 'ENTREGUE').reduce((s, d) => s + d.quantidade, 0),
  );
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
  }

  ngOnInit(): void {
    this.carregar();
  }

  protected get idNum(): number {
    return Number(this.id());
  }

  private carregar(): void {
    this.api.ong(this.idNum).subscribe({ next: (o) => this.ong.set(o), error: (e) => this.erro.set(mensagemErro(e)) });
    this.carregarNecessidades();
    this.api.listarDoacoes({ ongId: this.idNum }).subscribe({ next: (l) => this.doacoes.set(l), error: () => {} });
    this.carregarImportacoes();
  }

  private carregarNecessidades(): void {
    this.api.listarNecessidades({ ongId: this.idNum }).subscribe({ next: (l) => this.necessidades.set(l), error: () => {} });
  }

  private carregarImportacoes(tentativas = 0): void {
    clearTimeout(this.timer);
    this.api.listarImportacoes(this.idNum).subscribe({
      next: (l) => {
        const antes = this.importacoes().find((i) => i.status === 'AGUARDANDO_UPLOAD');
        this.importacoes.set(l);
        const agora = antes && l.find((i) => i.id === antes.id);
        if (agora && agora.status !== 'AGUARDANDO_UPLOAD') {
          this.carregarNecessidades();
          if (agora.status === 'CONCLUIDA') this.fb.sucesso(`${agora.linhasImportadas} necessidades importadas pela Lambda.`);
          else this.fb.erro('A importação terminou com erro. Veja os detalhes.');
        }
        if (tentativas > 0 && l.some((i) => i.status === 'AGUARDANDO_UPLOAD')) {
          this.timer = setTimeout(() => this.carregarImportacoes(tentativas - 1), 2500);
        }
      },
      error: () => {},
    });
  }

  protected async excluir(): Promise<void> {
    const o = this.ong();
    if (!o) return;
    const ok = await this.fb.confirmar('Excluir ONG?', `"${o.nome}" e todas as suas necessidades e doações serão removidas.`, {
      confirmar: 'Excluir', perigo: true,
    });
    if (!ok) return;
    this.api.excluirOng(o.id).subscribe({
      next: () => {
        this.fb.sucesso('ONG excluída.');
        this.router.navigate(['/ongs']);
      },
      error: (e) => this.fb.erro(mensagemErro(e)),
    });
  }

  protected async excluirNecessidade(n: Necessidade): Promise<void> {
    if (!(await this.fb.confirmar('Excluir necessidade?', `"${n.titulo}" será removida.`, { confirmar: 'Excluir', perigo: true }))) return;
    this.api.excluirNecessidade(n.id).subscribe({
      next: () => this.necessidades.update((l) => l.filter((x) => x.id !== n.id)),
      error: (e) => this.fb.erro(mensagemErro(e)),
    });
  }

  protected trocarLogo(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const arquivo = input.files?.[0];
    input.value = '';
    if (!arquivo) return;
    this.enviandoLogo.set(true);
    this.upload.enviar(arquivo, this.api.autorizarLogo(this.idNum, arquivo)).subscribe({
      next: (e) => {
        if (e.tipo === 'concluido') {
          this.fb.sucesso('Logo atualizado.');
          this.enviandoLogo.set(false);
          this.api.ong(this.idNum).subscribe((o) => this.ong.set(o));
        }
      },
      error: (e) => {
        this.enviandoLogo.set(false);
        this.fb.erro(mensagemErro(e, 'Falha ao enviar o logo.'));
      },
    });
  }

  protected escolherCsv(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const arquivo = input.files?.[0];
    input.value = '';
    if (arquivo) this.importar(arquivo);
  }

  protected soltarCsv(ev: DragEvent): void {
    ev.preventDefault();
    this.arrastando.set(false);
    const arquivo = ev.dataTransfer?.files?.[0];
    if (arquivo) this.importar(arquivo);
  }

  private importar(arquivo: File): void {
    if (!arquivo.name.toLowerCase().endsWith('.csv')) {
      this.fb.erro('Envie um arquivo .csv');
      return;
    }
    this.enviandoCsv.set(0);
    this.upload.enviar(arquivo, this.api.autorizarImportacao(this.idNum, arquivo)).subscribe({
      next: (e) => {
        if (e.tipo === 'progresso') this.enviandoCsv.set(e.percentual);
        else {
          this.enviandoCsv.set(null);
          this.fb.info('CSV no S3! A Lambda está importando as linhas…');
          this.carregarImportacoes(10);
        }
      },
      error: (e) => {
        this.enviandoCsv.set(null);
        this.fb.erro(mensagemErro(e, 'Falha ao enviar o CSV.'));
      },
    });
  }

  protected baixarModelo(): void {
    const blob = new Blob(['﻿' + MODELO_CSV], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'modelo-necessidades.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  }
}
