import { Routes } from '@angular/router';
import { MainLayout } from './layout/main-layout/main-layout';
import { NoEncontrado } from './shared/pages/no-encontrado/no-encontrado';
import { CATEGORIAS_ROUTES } from './features/categorias/categorias.routes';
import { CLIENTES_ROUTES } from './features/clientes/cliente.routes.';

export const routes: Routes = [
  {
    path: '',
    component: MainLayout,
    children: [
      {
        path: 'inicio',
        loadComponent: () => import('./features/inicio/inicio').then((m) => m.Inicio),
      },
      {
        path: 'categorias',
        loadChildren: () =>
          import('./features/categorias/categorias.routes').then((m) => CATEGORIAS_ROUTES),
      },
      {
        path: 'clientes',
        loadChildren: () =>
          import('./features/clientes/cliente.routes.').then((m) => CLIENTES_ROUTES),
      },
      {
        path: '',
        redirectTo: 'inicio',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '**',
    component: NoEncontrado,
  },
];
