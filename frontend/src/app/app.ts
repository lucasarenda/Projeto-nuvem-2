import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

import { Feedback } from './shared/feedback';
import { Icon } from './shared/icon';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icon, Feedback],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly menuAberto = signal(false);
  protected readonly ano = new Date().getFullYear();
  protected readonly links = [
    { rota: '/ongs', rotulo: 'ONGs', icone: 'predio' },
    { rota: '/necessidades', rotulo: 'Necessidades', icone: 'caixa' },
    { rota: '/doacoes', rotulo: 'Doações', icone: 'coracao' },
    { rota: '/doadores', rotulo: 'Doadores', icone: 'pessoas' },
    { rota: '/relatorios', rotulo: 'Impacto', icone: 'grafico' },
  ];

  constructor() {
    inject(Router).events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => this.menuAberto.set(false));
  }
}
