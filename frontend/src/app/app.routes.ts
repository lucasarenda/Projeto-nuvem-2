import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', title: 'DoaPerto — sua doação no lugar certo', loadComponent: () => import('./pages/home/home').then((m) => m.Home) },
  { path: 'doar', title: 'Quero doar · DoaPerto', loadComponent: () => import('./pages/doar/doar').then((m) => m.Doar) },
  {
    path: 'ongs',
    children: [
      { path: '', title: 'ONGs · DoaPerto', loadComponent: () => import('./pages/ongs/ong-lista').then((m) => m.OngLista) },
      { path: 'nova', title: 'Nova ONG · DoaPerto', loadComponent: () => import('./pages/ongs/ong-form').then((m) => m.OngFormPage) },
      { path: ':id', title: 'ONG · DoaPerto', loadComponent: () => import('./pages/ongs/ong-detalhe').then((m) => m.OngDetalhe) },
      { path: ':id/editar', title: 'Editar ONG · DoaPerto', loadComponent: () => import('./pages/ongs/ong-form').then((m) => m.OngFormPage) },
    ],
  },
  {
    path: 'necessidades',
    children: [
      { path: '', title: 'Necessidades · DoaPerto', loadComponent: () => import('./pages/necessidades/necessidade-lista').then((m) => m.NecessidadeLista) },
      { path: 'nova', title: 'Nova necessidade · DoaPerto', loadComponent: () => import('./pages/necessidades/necessidade-form').then((m) => m.NecessidadeFormPage) },
      { path: ':id/editar', title: 'Editar necessidade · DoaPerto', loadComponent: () => import('./pages/necessidades/necessidade-form').then((m) => m.NecessidadeFormPage) },
    ],
  },
  { path: 'doacoes', title: 'Doações · DoaPerto', loadComponent: () => import('./pages/doacoes/doacoes').then((m) => m.Doacoes) },
  { path: 'doadores', title: 'Doadores · DoaPerto', loadComponent: () => import('./pages/doadores/doadores').then((m) => m.Doadores) },
  { path: 'relatorios', title: 'Impacto · DoaPerto', loadComponent: () => import('./pages/relatorios/relatorios').then((m) => m.Relatorios) },
  { path: '**', title: 'Página não encontrada · DoaPerto', loadComponent: () => import('./pages/nao-encontrado').then((m) => m.NaoEncontrado) },
];
