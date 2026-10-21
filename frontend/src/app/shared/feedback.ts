import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { FeedbackService } from '../core/feedback.service';
import { Icon } from './icon';

@Component({
  selector: 'app-feedback',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toasts" aria-live="polite">
      @for (t of fb.toasts(); track t.id) {
        <div class="toast" [class]="'toast toast-' + t.tipo" role="status">
          <span class="toast-icone">
            <app-icon [nome]="t.tipo === 'sucesso' ? 'check' : t.tipo === 'erro' ? 'alerta' : 'info'" [tamanho]="16" [traco]="2.5" />
          </span>
          <span class="grow">{{ t.mensagem }}</span>
          <button class="btn btn-ghost btn-icon btn-sm" (click)="fb.fechar(t.id)" aria-label="Fechar">
            <app-icon nome="x" [tamanho]="16" />
          </button>
        </div>
      }
    </div>

    @if (fb.confirmacao(); as c) {
      <div class="overlay" (click)="c.responder(false)">
        <div class="modal" role="alertdialog" aria-modal="true" (click)="$event.stopPropagation()">
          <div class="row mb-2">
            <span class="cat-icon" [style.--c]="c.perigo ? 'var(--danger)' : 'var(--primary)'">
              <app-icon [nome]="c.perigo ? 'lixeira' : 'info'" />
            </span>
            <h3 class="mb-0">{{ c.titulo }}</h3>
          </div>
          <p class="muted">{{ c.mensagem }}</p>
          <div class="form-actions">
            <button class="btn btn-ghost" (click)="c.responder(false)">Voltar</button>
            <button class="btn" [class.btn-accent]="c.perigo" [class.btn-primary]="!c.perigo" (click)="c.responder(true)">
              {{ c.confirmar }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: `
    .toasts { position: fixed; right: 20px; bottom: 20px; z-index: 200; display: flex; flex-direction: column; gap: 10px; width: min(380px, calc(100vw - 32px)); }
    .toast { display: flex; align-items: center; gap: 12px; padding: 10px 10px 10px 14px; border-radius: 14px; background: var(--ink); color: #fff;
      box-shadow: var(--shadow-lg); font-size: .9rem; animation: subir .25s cubic-bezier(.2,.8,.2,1); }
    .toast .btn { --btn-fg: rgba(255,255,255,.7); }
    .toast-icone { width: 26px; height: 26px; border-radius: 50%; display: grid; place-items: center; flex: none; background: var(--primary); }
    .toast-erro .toast-icone { background: var(--accent); }
    .toast-info .toast-icone { background: #2a78d6; }
  `,
})
export class Feedback {
  protected readonly fb = inject(FeedbackService);
}
