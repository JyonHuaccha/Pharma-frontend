import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';

// Sirve el build real con un proxy HTTP; no intercepta ni simula respuestas.
const raiz = resolve('dist/pharma-frontend/browser');
const backend = new URL(process.env.E2E_API_URL ?? 'http://localhost:8080');
const tipos = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};
http
  .createServer(async (req, res) => {
    if (req.url.startsWith('/api/') || req.url.startsWith('/actuator/')) {
      const remoto = http.request(
        new URL(req.url, backend),
        { method: req.method, headers: { ...req.headers, host: backend.host } },
        (respuesta) => {
          res.writeHead(respuesta.statusCode, respuesta.headers);
          respuesta.pipe(res);
        },
      );
      remoto.on('error', () => {
        res.writeHead(502);
        res.end('Backend no disponible');
      });
      req.pipe(remoto);
      return;
    }
    try {
      let archivo = resolve(
        raiz,
        '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname),
      );
      if (!archivo.startsWith(raiz + sep) && archivo !== raiz) {
        res.writeHead(403);
        res.end();
        return;
      }
      if (!extname(archivo)) archivo = resolve(raiz, 'index.html');
      const contenido = await readFile(archivo);
      res.writeHead(200, {
        'Content-Type': tipos[extname(archivo)] ?? 'application/octet-stream',
        'Cache-Control': 'no-store',
      });
      res.end(contenido);
    } catch {
      res.writeHead(404);
      res.end('Archivo no encontrado');
    }
  })
  .listen(Number(process.env.E2E_PORT ?? 4210), '127.0.0.1', () =>
    console.log('Build de pruebas disponible'),
  );
