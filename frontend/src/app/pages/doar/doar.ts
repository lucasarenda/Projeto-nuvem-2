import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { ApiService, mensagemErro } from '../../core/api.service';
import { FeedbackService } from '../../core/feedback.service';
import { CIDADES, cidadeMaisProxima, localizacaoAtual } from '../../core/geo';
import { CATEGORIAS, Categoria, Doacao, Doador, LISTA_CATEGORIAS, Sugestao } from '../../core/models';
import { Anexos } from '../../shared/anexos';
import { Icon } from '../../shared/icon';
import { Avatar, CatIcon, Progresso, UrgenciaBadge } from '../../shared/pequenos';

interface Local {
  lat: number;
  lng: number;
  rotulo: string;
  cidade: string;
  uf: string;
}

@Component({
  selector: 'app-doar',
  imports: [FormsModule, RouterLink, DecimalPipe, Icon, CatIcon, Avatar, Progresso, UrgenciaBadge, Anexos],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './doar.html',
  styleUrl: './doar.scss',
})
export class Doar implements OnInit {
  /** ?categoria=ROUPA vindo da home. */
  readonly categoriaInicial = input<string | undefined>(undefined, { alias: 'categoria' });

  private readonly api = inject(ApiService);
  private readonly fb = inject(FeedbackService);

  protected readonly categorias = LISTA_CATEGORIAS.map((c) => ({ chave: c, ...CATEGORIAS[c] }));
  protected readonly cidades = CIDADES;
  protected readonly etapas = ['O quê', 'Onde', 'Para quem', 'Seus dados'];

  protected readonly passo = signal(1);
  protected readonly categoria = signal<Categoria | null>(null);
  protected readonly descricao = signal('');
  protected readonly quantidade = signal(1);

  protected readonly local = signal<Local | null>(null);
  protected readonly localizando = signal(false);
  protected readonly cidadeEscolhida = signal('');

  protected readonly sugestoes = signal<Sugestao[] | null>(null);
  protected readonly escolhida = signal<Sugestao | null>(null);

  protected readonly email = signal('');
  protected readonly nome = signal('');
  protected readonly telefone = signal('');
  protected readonly doadorExistente = signal<Doador | null>(null);
  protected readonly enviando = signal(false);
  protected readonly doacao = signal<Doacao | null>(null);

  protected readonly infoCategoria = computed(() => (this.categoria() ? CATEGORIAS[this.categoria()!] : null));
  protected readonly passo1Ok = computed(() => !!this.categoria() && this.descricao().trim().length >= 3 && this.quantidade() > 0);
  protected readonly passo4Ok = computed(
    () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email().trim()) && (this.doadorExistente() || this.nome().trim().length >= 2),
  );

  ngOnInit(): void {
    const c = this.categoriaInicial()?.toUpperCase() as Categoria | undefined;
    if (c && c in CATEGORIAS) this.categoria.set(c);
  }

  protected irPara(p: number): void {
    if (p < this.passo()) this.mudarPasso(p);
  }

  private mudarPasso(p: number): void {
    this.passo.set(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  protected avancar(): void {
    const p = this.passo();
    if (p === 1 && this.passo1Ok()) this.mudarPasso(2);
    else if (p === 2 && this.local()) {
      this.mudarPasso(3);
      this.buscarSugestoes();
    } else if (p === 3 && this.escolhida()) {
      this.quantidade.update((q) => Math.min(q, Math.max(1, this.escolhida()!.faltam)) || q);
      this.mudarPasso(4);
    }
  }

  protected async usarLocalizacao(): Promise<void> {
    this.localizando.set(true);
    try {
      const { lat, lng } = await localizacaoAtual();
      const c = cidadeMaisProxima(lat, lng);
      this.local.set({ lat, lng, rotulo: `Sua localização (perto de ${c.nome}/${c.uf})`, cidade: c.nome, uf: c.uf });
      this.cidadeEscolhida.set('');
    } catch (e) {
      this.fb.erro((e as Error).message);
    } finally {
      this.localizando.set(false);
    }
  }

  protected escolherCidade(valor: string): void {
    this.cidadeEscolhida.set(valor);
    const c = CIDADES.find((x) => `${x.nome}/${x.uf}` === valor);
    if (c) this.local.set({ lat: c.lat, lng: c.lng, rotulo: `${c.nome}/${c.uf}`, cidade: c.nome, uf: c.uf });
  }

  protected buscarSugestoes(): void {
    const l = this.local();
    if (!l) return;
    this.sugestoes.set(null);
    this.escolhida.set(null);
    this.api.sugestoes({ categoria: this.categoria() ?? undefined, lat: l.lat, lng: l.lng, limite: 6 }).subscribe({
      next: (s) => {
        this.sugestoes.set(s);
        if (s.length) this.escolhida.set(s[0]);
      },
      error: (e) => {
        this.sugestoes.set([]);
        this.fb.erro(mensagemErro(e));
      },
    });
  }

  protected verificarEmail(): void {
    const email = this.email().trim();
    if (!email.includes('@')) return;
    this.api.listarDoadores({ email }).subscribe({
      next: (l) => {
        this.doadorExistente.set(l[0] ?? null);
        if (l[0]) this.nome.set(l[0].nome);
      },
      error: () => this.doadorExistente.set(null),
    });
  }

  protected async confirmar(): Promise<void> {
    const s = this.escolhida();
    const l = this.local();
    if (!s || !l || !this.passo4Ok()) return;
    this.enviando.set(true);
    try {
      let doador = this.doadorExistente();
      if (!doador) {
        doador = await firstValueFrom(this.api.salvarDoador({
          nome: this.nome().trim(), email: this.email().trim(), telefone: this.telefone().trim() || null,
          cidade: l.cidade, uf: l.uf, latitude: l.lat, longitude: l.lng,
        }));
      } else if (doador.latitude == null) {
        doador = await firstValueFrom(this.api.salvarDoador({
          ...doador, cidade: doador.cidade ?? l.cidade, uf: doador.uf ?? l.uf, latitude: l.lat, longitude: l.lng,
        }, doador.id));
      }
      const doacao = await firstValueFrom(this.api.criarDoacao({
        doadorId: doador.id, necessidadeId: s.necessidadeId, descricao: this.descricao().trim(), quantidade: this.quantidade(),
      }));
      this.doacao.set(doacao);
      this.mudarPasso(5);
    } catch (e) {
      this.fb.erro(mensagemErro(e));
    } finally {
      this.enviando.set(false);
    }
  }

  protected recomecar(): void {
    this.mudarPasso(1);
    this.descricao.set('');
    this.quantidade.set(1);
    this.sugestoes.set(null);
    this.escolhida.set(null);
    this.doacao.set(null);
  }
}
