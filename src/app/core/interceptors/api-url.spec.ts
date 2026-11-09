import { esPeticionApi } from './api-url';

describe('Límites de la API en producción y desarrollo', () => {
  it('acepta API relativa y absoluta del mismo origen en producción', () => {
    expect(esPeticionApi('/api/v1/productos', '/api/v1')).toBe(true);
    expect(esPeticionApi(location.origin + '/api/v1/productos', '/api/v1')).toBe(true);
  });
  it('no permite enviar el JWT a otro origen ni a rutas parecidas', () => {
    expect(esPeticionApi('https://externo.example/api/v1/productos', '/api/v1')).toBe(false);
    expect(esPeticionApi('/api/v1-externa/productos', '/api/v1')).toBe(false);
    expect(esPeticionApi('/api/v1/../v2/productos', '/api/v1')).toBe(false);
  });
  it('respeta el puerto de desarrollo y los parámetros de consulta', () => {
    expect(esPeticionApi('http://localhost:8080/api/v1?pagina=0', 'http://localhost:8080/api/v1')).toBe(true);
    expect(esPeticionApi('http://localhost:8081/api/v1/productos', 'http://localhost:8080/api/v1')).toBe(false);
  });
});
