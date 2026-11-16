export interface Categoria {
  id: number;
  nombre: string;
  descripcion: string | null;
  estado: boolean;
  creadoPor?: string | null;
  modificadoPor?: string | null;
  fechaCreacion: string;
  fechaModificacion: string | null;
}

export interface CategoriaRequest {
  nombre: string;
  descripcion: string | null;
  estado: boolean;
}
