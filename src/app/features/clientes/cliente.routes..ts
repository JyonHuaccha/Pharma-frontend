import { Routes } from '@angular/router';
import { ClienteListComponent } from './pages/cliente-list/cliente-list';
import { ClienteFormComponent } from './pages/cliente-form/cliente-form';

export const CLIENTES_ROUTES: Routes = [
  { path: '', component: ClienteListComponent },
  { path: 'nuevo', component: ClienteFormComponent },
  { path: ':id/editar', component: ClienteFormComponent },
];
