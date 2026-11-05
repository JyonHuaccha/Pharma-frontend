export interface VentaPorCategoria {
  categoriaId: number;
  categoriaNombre: string;
  cantidadVendida: number;
  montoTotal: number;
}

export interface ProductoMasVendido {
  productoId: number;
  productoNombre: string;
  categoriaNombre: string;
  cantidadVendida: number;
  montoTotal: number;
}

/** Contrato del reporte existente de PharmaBackend. */
export interface ProductoMasVendidoServidor {
  id: number;
  name: string;
  categoria: string;
  cantidad: number;
  total: number;
}
