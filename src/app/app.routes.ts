import { Routes } from '@angular/router';
import { MainLayout } from './layout/main-layout/main-layout';
import { NoEncontrado } from './shared/pages/no-encontrado/no-encontrado';
import { authGuardGuard, invitadoGuard } from './core/guards/auth-guard-guard';
import { permisoGuardGuard } from './core/guards/permiso-guard-guard';

export const routes: Routes = [
  {
    path: 'login',
    title: 'Iniciar sesión',
    canActivate: [invitadoGuard],
    loadComponent: () => import('./features/auth/pages/login/login').then(m => m.Login),
  },
  {
    path: '',
    component: MainLayout,
    canActivate: [authGuardGuard],
    canActivateChild: [authGuardGuard],
    children: [
      {
        path: 'reportes',
        canActivate: [permisoGuardGuard],
        data: { permiso: 'REPORTES_VER' },
        loadChildren: () => import('./features/reportes/reportes.routes').then(m => m.REPORTES_ROUTES),
      },
      {
        path: 'inicio',
        title: 'Inicio',
        loadComponent: () => import('./features/inicio/inicio').then((m) => m.Inicio),
      },
      {
        path: 'categorias',
        title: 'Categorías',
        canActivate: [permisoGuardGuard],
        data: { permiso: 'CATALOGO_LEER' },
        loadChildren: () =>
          import('./features/categorias/categorias.routes').then((m) => m.CATEGORIAS_ROUTES),
      },
      {
        path: 'clientes',
        title: 'Clientes',
        canActivate: [permisoGuardGuard],
        data: { permiso: 'CLIENTES_LEER' },
        loadChildren: () =>
          import('./features/clientes/clientes.routes').then((m) => m.CLIENTES_ROUTES),
      },
      {
        path: 'productos',
        canActivate: [permisoGuardGuard],
        data: { permiso: 'CATALOGO_LEER' },
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
       canActivate: [permisoGuardGuard],
       data: { permiso: 'VENTAS_LEER' },
       loadChildren: () =>
        import('./features/ventas/ventas.routes').then(m => m.VENTAS_ROUTES),
     },
      {
        path: 'acceso-denegado',
        title: 'Acceso denegado',
        loadComponent: () => import('./shared/pages/acceso-denegado/acceso-denegado').then(m => m.AccesoDenegado),
      },
    ],
  },
  {
    path: '**',
    component: NoEncontrado,
  },
];
