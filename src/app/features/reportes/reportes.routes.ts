import { Routes } from '@angular/router';

export const REPORTES_ROUTES: Routes = [
  { path: '', redirectTo: 'ventas-por-categoria', pathMatch: 'full' },
  {
    path: 'ventas-por-categoria',
    loadComponent: () => import('./pages/ventas-categoria/ventas-categoria').then(m => m.VentasCategoria),
    title: 'Reporte de ventas por categoría',
  },
];
