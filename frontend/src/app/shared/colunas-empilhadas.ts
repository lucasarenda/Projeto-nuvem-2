import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

export interface SerieColuna {
  nome: string;
  cor: string;
  valores: number[];
}

/**
 * Colunas empilhadas em SVG (doações por mês × categoria).
 * Segmentos com 2px de respiro, topo arredondado, grade discreta e
 * tooltip por coluna com o detalhamento de cada série.
 */
@Component({
  selector: 'app-colunas-empilhadas',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="legenda">
      @for (s of series(); track s.nome) {
        <span class="leg"><span class="leg-cor" [style.background]="s.cor"></span>{{ s.nome }}</span>
      }
    </div>
    <div class="area" (mouseleave)="ativo.set(null)">
      <svg [attr.viewBox]="'0 0 ' + L + ' ' + A" role="img" [attr.aria-label]="rotuloAria()">
        @for (g of grade(); track g.v) {
          <line [attr.x1]="ME" [attr.x2]="L" [attr.y1]="g.y" [attr.y2]="g.y" class="grade" />
          <text [attr.x]="ME - 8" [attr.y]="g.y + 4" class="eixo" text-anchor="end">{{ g.v }}</text>
        }
        @for (c of colunas(); track c.i) {
          <g>
            <rect class="alvo" [attr.x]="c.x - passo() * 0.1" y="0" [attr.width]="passo()" [attr.height]="A - MB"
                  (mouseenter)="ativo.set(c.i)" />
            @for (seg of c.segs; track seg.nome) {
              <path [attr.d]="seg.d" [style.fill]="seg.cor" [class.esmaecido]="ativo() !== null && ativo() !== c.i" />
            }
            <text [attr.x]="c.x + largura() / 2" [attr.y]="A - MB + 18" class="eixo" text-anchor="middle">{{ c.rotulo }}</text>
          </g>
        }
      </svg>
      @if (tooltip(); as t) {
        <div class="tooltip" [style.left.%]="t.esquerda">
          <strong>{{ t.titulo }}</strong>
          @for (l of t.linhas; track l.nome) {
            <div class="tt-linha"><span class="leg-cor" [style.background]="l.cor"></span><span class="grow">{{ l.nome }}</span><b>{{ l.valor }}</b></div>
          }
          <div class="tt-linha tt-total"><span class="grow">Total</span><b>{{ t.total }}</b></div>
        </div>
      }
    </div>
  `,
  styles: `
    :host { display: block; }
    .legenda { display: flex; flex-wrap: wrap; gap: 6px 16px; margin-bottom: 14px; font-size: .8rem; color: var(--ink-2); }
    .leg { display: inline-flex; align-items: center; gap: 6px; }
    .leg-cor { width: 10px; height: 10px; border-radius: 3px; flex: none; }
    .area { position: relative; }
    svg { width: 100%; height: auto; display: block; overflow: visible; }
    .grade { stroke: var(--line); stroke-width: 1; vector-effect: non-scaling-stroke; }
    .eixo { font-size: 11px; fill: var(--muted); font-family: var(--font); }
    .alvo { fill: transparent; }
    path { transition: opacity .15s; }
    .esmaecido { opacity: .35; }
    .tooltip { position: absolute; top: 0; transform: translateX(-50%); min-width: 170px; pointer-events: none; z-index: 2;
      background: var(--ink); color: #fff; border-radius: 12px; padding: 10px 12px; font-size: .78rem; box-shadow: var(--shadow-lg); }
    .tt-linha { display: flex; align-items: center; gap: 8px; margin-top: 4px; }
    .tt-total { border-top: 1px solid rgba(255,255,255,.2); padding-top: 4px; margin-top: 6px; }
  `,
})
export class ColunasEmpilhadas {
  readonly rotulos = input.required<string[]>();
  readonly series = input.required<SerieColuna[]>();

  protected readonly L = 720;
  protected readonly A = 260;
  protected readonly ME = 34;
  protected readonly MB = 26;
  protected readonly ativo = signal<number | null>(null);

  protected readonly totais = computed(() =>
    this.rotulos().map((_, i) => this.series().reduce((s, serie) => s + (serie.valores[i] ?? 0), 0)),
  );
  private readonly maximo = computed(() => {
    const m = Math.max(1, ...this.totais());
    const passo = m <= 5 ? 1 : m <= 10 ? 2 : m <= 25 ? 5 : m <= 50 ? 10 : Math.ceil(m / 50) * 10;
    return Math.ceil(m / passo) * passo;
  });
  protected readonly passo = computed(() => (this.L - this.ME) / Math.max(1, this.rotulos().length));
  protected readonly largura = computed(() => Math.min(36, this.passo() * 0.62));

  protected readonly grade = computed(() => {
    const max = this.maximo();
    const util = this.A - this.MB;
    return [0, 0.25, 0.5, 0.75, 1].map((f) => ({ v: Math.round(max * f), y: util - util * f }));
  });

  protected readonly colunas = computed(() => {
    const util = this.A - this.MB;
    const escala = util / this.maximo();
    const w = this.largura();
    return this.rotulos().map((rotulo, i) => {
      const x = this.ME + i * this.passo() + (this.passo() - w) / 2;
      let base = util;
      const presentes = this.series().filter((s) => (s.valores[i] ?? 0) > 0);
      const segs = presentes.map((s, k) => {
        const h = (s.valores[i] ?? 0) * escala;
        const topo = k === presentes.length - 1;
        const y = base - h;
        const hVis = Math.max(1, h - (topo ? 0 : 2)); // 2px de respiro entre segmentos
        base = y;
        return { nome: s.nome, cor: s.cor, d: topo ? this.retanguloArredondado(x, y, w, hVis, 4) : `M${x},${y + 2}h${w}v${hVis}h${-w}Z` };
      });
      return { i, x, rotulo, segs };
    });
  });

  protected readonly tooltip = computed(() => {
    const i = this.ativo();
    if (i === null) return null;
    const linhas = this.series()
      .map((s) => ({ nome: s.nome, cor: s.cor, valor: s.valores[i] ?? 0 }))
      .filter((l) => l.valor > 0);
    const esquerda = ((this.ME + (i + 0.5) * this.passo()) / this.L) * 100;
    return { titulo: this.rotulos()[i], linhas, total: this.totais()[i], esquerda: Math.min(85, Math.max(15, esquerda)) };
  });

  protected readonly rotuloAria = computed(
    () => 'Doações por mês: ' + this.rotulos().map((r, i) => `${r} ${this.totais()[i]}`).join(', '),
  );

  private retanguloArredondado(x: number, y: number, w: number, h: number, r: number): string {
    const rr = Math.min(r, h, w / 2);
    return `M${x},${y + h}V${y + rr}Q${x},${y} ${x + rr},${y}H${x + w - rr}Q${x + w},${y} ${x + w},${y + rr}V${y + h}Z`;
  }
}
