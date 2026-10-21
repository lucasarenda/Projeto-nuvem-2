import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  tipo: 'sucesso' | 'erro' | 'info';
  mensagem: string;
}

export interface PedidoConfirmacao {
  titulo: string;
  mensagem: string;
  confirmar: string;
  perigo: boolean;
  responder: (ok: boolean) => void;
}

/** Toasts e diálogo de confirmação compartilhados pela aplicação. */
@Injectable({ providedIn: 'root' })
export class FeedbackService {
  readonly toasts = signal<Toast[]>([]);
  readonly confirmacao = signal<PedidoConfirmacao | null>(null);
  private seq = 0;

  sucesso(mensagem: string): void {
    this.mostrar('sucesso', mensagem);
  }
  erro(mensagem: string): void {
    this.mostrar('erro', mensagem, 6000);
  }
  info(mensagem: string): void {
    this.mostrar('info', mensagem);
  }

  fechar(id: number): void {
    this.toasts.update((l) => l.filter((t) => t.id !== id));
  }

  confirmar(titulo: string, mensagem: string, opcoes: { confirmar?: string; perigo?: boolean } = {}): Promise<boolean> {
    return new Promise((resolve) => {
      this.confirmacao.set({
        titulo,
        mensagem,
        confirmar: opcoes.confirmar ?? 'Confirmar',
        perigo: opcoes.perigo ?? false,
        responder: (ok) => {
          this.confirmacao.set(null);
          resolve(ok);
        },
      });
    });
  }

  private mostrar(tipo: Toast['tipo'], mensagem: string, duracao = 4000): void {
    const id = ++this.seq;
    this.toasts.update((l) => [...l, { id, tipo, mensagem }]);
    setTimeout(() => this.fechar(id), duracao);
  }
}
