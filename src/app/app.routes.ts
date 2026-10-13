import { Routes } from '@angular/router';
import { MainLayout } from './layout/main-layout/main-layout';
import { NoEncontrado } from './shared/pages/no-encontrado/no-encontrado';

export const routes: Routes = [
  {
    path: '',
    component: MainLayout,
    children: [
      {
        path: 'reportes',
        loadChildren: () => import('./features/reportes/reportes.routes').then(m => m.REPORTES_ROUTES),
      },
      {
        path: 'inicio',
        loadComponent: () => import('./features/inicio/inicio').then((m) => m.Inicio),
      },
      {
        path: 'categorias',
        loadChildren: () =>
          import('./features/categorias/categorias.routes').then((m) => m.CATEGORIAS_ROUTES),
      },
      {
        path: 'clientes',
        loadChildren: () =>
          import('./features/clientes/clientes.routes').then((m) => m.CLIENTES_ROUTES),
      },
      {
        path: 'productos',
        loadChildren: () =>
          import('./features/productos/productos.routes').then((m) => m.PRODUCTOS_ROUTES),
      },
      {
        path: '',
        redirectTo: 'inicio',
        pathMatch: 'full',
      },
      {
       path: 'ventas',
       loadChildren: () =>
        import('./features/ventas/ventas.routes').then(m => m.VENTAS_ROUTES),
     },
    ],
  },
  {
    path: '**',
    component: NoEncontrado,
  },
];
