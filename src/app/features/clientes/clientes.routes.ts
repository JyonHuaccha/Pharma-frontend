import { Routes } from '@angular/router';
import { permisoGuardGuard } from '../../core/guards/permiso-guard-guard';
import { ClienteListComponent } from './pages/cliente-list/cliente-list';
import { ClienteFormComponent } from './pages/cliente-form/cliente-form';

export const CLIENTES_ROUTES: Routes = [
  { path: '', component: ClienteListComponent },
  { path: 'nuevo', component: ClienteFormComponent, canActivate: [permisoGuardGuard], data: { permiso: 'CLIENTES_ESCRIBIR' } },
  { path: ':id/editar', component: ClienteFormComponent, canActivate: [permisoGuardGuard], data: { permiso: 'CLIENTES_ESCRIBIR' } },
];
