export interface Cliente {
  id: number;
  dni: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string | null;
  direccion: string | null;
  estado: boolean;
  fechaCreacion: string;
  fechaModificacion: string | null;
}

export interface ClienteRequest {
  dni: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string | null;
  direccion: string | null;
  estado: boolean;
}
export type OrdenCliente = 'dni' | 'apellidos' | 'email';
export type Direccion = 'asc' | 'desc';
