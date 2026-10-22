import { Routes } from '@angular/router';
import { permisoGuardGuard } from '../../core/guards/permiso-guard-guard';

export const CATEGORIAS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/categoria-list/categoria-list').then((m) => m.CategoriaList),
  },
  {
    path: 'nuevo',
    canActivate: [permisoGuardGuard],
    data: { permiso: 'CATALOGO_ESCRIBIR' },
    loadComponent: () =>
      import('./pages/categoria-form/categoria-form').then((m) => m.CategoriaForm),
  },
  {
    path: ':id/editar',
    canActivate: [permisoGuardGuard],
    data: { permiso: 'CATALOGO_ESCRIBIR' },
    loadComponent: () =>
      import('./pages/categoria-form/categoria-form').then((m) => m.CategoriaForm),
  },
];
