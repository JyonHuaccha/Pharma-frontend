import { Routes } from '@angular/router';
import { permisoGuardGuard } from '../../core/guards/permiso-guard-guard';
import { VentaList } from './pages/venta-list/venta-list';
import { VentaForm } from './pages/venta-form/venta-form';
import { VentaDetalle } from './pages/venta-detalle/venta-detalle';
export const VENTAS_ROUTES: Routes = [
{ path: '', component: VentaList, title: 'Consulta de ventas' },
{ path: 'nueva', component: VentaForm, title: 'Nueva venta', canActivate: [permisoGuardGuard], data: { permiso: 'VENTAS_REGISTRAR' } },
{ path: ':id', component: VentaDetalle, title: 'Detalle de venta' },
];
