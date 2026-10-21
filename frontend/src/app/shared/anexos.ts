import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, input, signal } from '@angular/core';

import { ApiService, mensagemErro } from '../core/api.service';
import { FeedbackService } from '../core/feedback.service';
import { Anexo, EntidadeTipo } from '../core/models';
import { UploadService } from '../core/upload.service';
import { Icon } from './icon';

const ACEITOS = 'image/jpeg,image/png,image/webp,image/gif,application/pdf';

/**
 * Galeria + upload de arquivos de uma entidade. Depois do PUT no S3 a lista é
 * consultada de novo algumas vezes até a Lambda marcar o arquivo como processado.
 */
@Component({
  selector: 'app-anexos',
  imports: [Icon, DatePipe, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label class="dropzone" [class.arrastando]="arrastando()"
           (dragover)="$event.preventDefault(); arrastando.set(true)"
           (dragleave)="arrastando.set(false)"
           (drop)="soltar($event)">
      <input type="file" class="sr-only" [accept]="aceitos" multiple (change)="escolher($event)" />
      <span class="dz-icon"><app-icon nome="upload" [tamanho]="24" /></span>
      @if (enviando()) {
        <strong>Enviando… {{ progresso() }}%</strong>
        <div class="progress" style="width: 220px"><span [style.width.%]="progresso()"></span></div>
      } @else {
        <strong>{{ titulo() }}</strong>
        <span class="small">Arraste ou clique · JPG, PNG, WEBP ou PDF até 10 MB</span>
      }
    </label>

    @if (anexos().length) {
      <div class="galeria mt-2">
        @for (a of anexos(); track a.id) {
          <figure class="item">
            <a class="thumb" [href]="a.url" target="_blank" rel="noopener" [class.pdf]="!ehImagem(a)">
              @if (ehImagem(a) && (a.thumbnailUrl || a.url)) {
                <img [src]="a.thumbnailUrl || a.url" [alt]="a.nomeOriginal" loading="lazy" />
              } @else {
                <app-icon nome="arquivo" [tamanho]="34" [traco]="1.6" />
              }
              <span class="estado" [class]="'estado ' + a.status">
                @switch (a.status) {
                  @case ('PROCESSADO') { <app-icon nome="check" [tamanho]="12" [traco]="3" /> }
                  @case ('ERRO') { <app-icon nome="alerta" [tamanho]="12" [traco]="3" /> }
                  @default { <span class="spinner" style="width:10px;height:10px;border-width:2px"></span> }
                }
              </span>
            </a>
            <figcaption>
              <span class="truncate small strong" [title]="a.nomeOriginal">{{ a.nomeOriginal }}</span>
              <span class="tiny muted">
                @if (a.status === 'PROCESSADO') {
                  @if (a.largura) { {{ a.largura }}×{{ a.altura }} px · }
                  @if (a.paginas) { {{ a.paginas }} pág. · }
                  {{ (a.tamanhoBytes ?? 0) / 1024 | number: '1.0-0' }} KB
                } @else if (a.status === 'ERRO') {
                  <span style="color: var(--danger)">{{ a.erro || 'Erro no processamento' }}</span>
                } @else {
                  Processando na Lambda…
                }
              </span>
              <span class="tiny muted">{{ a.criadoEm | date: 'dd/MM/yy HH:mm' }}</span>
            </figcaption>
            <button class="btn btn-icon btn-sm remover" (click)="remover(a)" aria-label="Remover arquivo">
              <app-icon nome="lixeira" [tamanho]="15" />
            </button>
          </figure>
        }
      </div>
    }
  `,
  styles: `
    .galeria { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 14px; }
    .item { margin: 0; position: relative; display: flex; flex-direction: column; gap: 8px; }
    .thumb { aspect-ratio: 4/3; border-radius: 14px; overflow: hidden; background: var(--bg-2); display: grid; place-items: center;
      color: var(--muted); position: relative; border: 1px solid var(--line); }
    .thumb img { width: 100%; height: 100%; object-fit: cover; transition: transform .3s; }
    .thumb:hover img { transform: scale(1.04); }
    .estado { position: absolute; left: 8px; top: 8px; width: 22px; height: 22px; border-radius: 50%; display: grid; place-items: center;
      background: var(--sun); color: #5a3b00; box-shadow: 0 0 0 2px #fff; }
    .estado.PROCESSADO { background: var(--primary); color: #fff; }
    .estado.ERRO { background: var(--danger); color: #fff; }
    figcaption { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .remover { position: absolute; right: 6px; top: 6px; opacity: 0; transition: opacity .15s; background: #fff; }
    .item:hover .remover, .remover:focus-visible { opacity: 1; }
  `,
})
export class Anexos {
  readonly entidadeTipo = input.required<EntidadeTipo>();
  readonly entidadeId = input.required<number>();
  readonly titulo = input('Adicionar fotos ou documentos');

  private readonly api = inject(ApiService);
  private readonly upload = inject(UploadService);
  private readonly fb = inject(FeedbackService);

  protected readonly aceitos = ACEITOS;
  protected readonly anexos = signal<Anexo[]>([]);
  protected readonly enviando = signal(false);
  protected readonly progresso = signal(0);
  protected readonly arrastando = signal(false);
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    effect(() => this.carregar(this.entidadeTipo(), this.entidadeId()));
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
  }

  protected ehImagem(a: Anexo): boolean {
    return a.contentType.startsWith('image/');
  }

  protected escolher(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    this.enviarArquivos(Array.from(input.files ?? []));
    input.value = '';
  }

  protected soltar(ev: DragEvent): void {
    ev.preventDefault();
    this.arrastando.set(false);
    this.enviarArquivos(Array.from(ev.dataTransfer?.files ?? []));
  }

  protected async remover(a: Anexo): Promise<void> {
    if (!(await this.fb.confirmar('Remover arquivo?', `"${a.nomeOriginal}" será apagado do S3.`, { confirmar: 'Remover', perigo: true }))) return;
    this.api.excluirAnexo(a.id).subscribe({
      next: () => this.anexos.update((l) => l.filter((x) => x.id !== a.id)),
      error: (e) => this.fb.erro(mensagemErro(e)),
    });
  }

  private enviarArquivos(arquivos: File[], i = 0): void {
    const arquivo = arquivos[i];
    if (!arquivo) return;
    if (!ACEITOS.split(',').includes(arquivo.type)) {
      this.fb.erro(`"${arquivo.name}" não é um tipo aceito.`);
      this.enviarArquivos(arquivos, i + 1);
      return;
    }
    this.enviando.set(true);
    this.progresso.set(0);
    this.upload.enviar(arquivo, this.api.autorizarUpload(this.entidadeTipo(), this.entidadeId(), arquivo)).subscribe({
      next: (ev) => {
        if (ev.tipo === 'progresso') this.progresso.set(ev.percentual);
        else {
          this.fb.sucesso(`"${arquivo.name}" enviado ao S3.`);
          this.enviando.set(false);
          this.carregar(this.entidadeTipo(), this.entidadeId(), 8);
          this.enviarArquivos(arquivos, i + 1);
        }
      },
      error: (e) => {
        this.enviando.set(false);
        this.fb.erro(mensagemErro(e, 'Falha no upload. Confira o CORS do bucket.'));
      },
    });
  }

  /** Recarrega a lista; enquanto houver arquivo aguardando a Lambda, tenta de novo. */
  private carregar(tipo: EntidadeTipo, id: number, tentativas = 0): void {
    clearTimeout(this.timer);
    this.api.listarAnexos(tipo, id).subscribe({
      next: (lista) => {
        this.anexos.set(lista);
        if (tentativas > 0 && lista.some((a) => a.status === 'AGUARDANDO_UPLOAD')) {
          this.timer = setTimeout(() => this.carregar(tipo, id, tentativas - 1), 2500);
        }
      },
      error: () => this.anexos.set([]),
    });
  }
}
