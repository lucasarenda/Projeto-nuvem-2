import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Vazio } from '../shared/pequenos';

@Component({
  selector: 'app-nao-encontrado',
  imports: [RouterLink, Vazio],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container page" style="max-width: 640px">
      <app-vazio icone="busca" titulo="Página não encontrada" texto="O endereço pode ter mudado. Que tal voltar ao início?">
        <a routerLink="/" class="btn btn-primary">Ir para o início</a>
      </app-vazio>
    </div>
  `,
})
export class NaoEncontrado {}
