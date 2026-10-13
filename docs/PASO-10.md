# Sesión 9: continuar desde el paso 10

## Resultado del segundo intento

Se reiniciaron Angular y Spring Boot desde las carpetas de este proyecto. La versión actualizada quedó ejecutándose en `http://localhost:4200` y `http://localhost:8080`, conectada a Oracle.

Se crearon datos sintéticos identificados como **S9 Prueba 10112302**. Las ventas de prueba fueron la 7 (concurrencia) y la 8 (formulario). Esos registros se conservaron para consultar las evidencias.

Comprobado contra la API real:

- Categoría 92 y cliente 30: baja lógica, mismo ID y registro recuperable por GET con estado inactivo.
- Categoría 91 con productos y cliente 28 con ventas: HTTP 409 con el mensaje de asociación.
- Dos ventas simultáneas de la última unidad del producto 38: una respuesta 201 y una 409; stock final 0.
- Venta con una segunda línea sin stock: HTTP 409 y recuperación del stock de la primera línea.
- Venta 8 desde Angular: total estimado y total del servidor de **S/ 13,00**. Producto 34 pasó de 10 a 7 y producto 37 de 10 a 9.
- Consulta por cliente 28 y fecha 11/10/2026: devuelve las ventas 7 y 8.

Comprobado visualmente: avisos de asociaciones en ambos módulos, guardado de categoría, bloqueo al desmarcar Activo, paginación de ambos listados y orden descendente de categorías y clientes. Se verificó la desaparición del aviso; el plazo exacto de 3000 ms está cubierto por las pruebas automáticas.

| Paso | Estado en este intento | Evidencia |
|---|---|---|
| 1 | Verificado en Angular | `evidencias/s9-01-formulario-vacio.jpg` |
| 2 | Verificado: búsqueda sin tildes, sin coincidencias e inactivos excluidos | `evidencias/s9-02-busqueda-sin-tildes.jpg`, `evidencias/s9-02-sin-resultados.jpg` |
| 3 | Verificado: cantidad 3 y subtotal S/ 7,50 | `evidencias/s9-03-subtotal-cantidad-tres.jpg` |
| 4 | Verificado Enter y eliminación de una línea; uno de los productos adicionales se agregó con clic | `evidencias/s9-04-enter-y-quitar.jpg` |
| 5 | Verificado: acumula cantidad sin duplicar la línea | `evidencias/s9-05-producto-repetido.jpg` |
| 6 | Verificado: cantidad 11 frente a stock 10 bloquea la revisión | `evidencias/s9-06-exceso-stock.jpg` |
| 7 | Verificado: resumen con 2 productos y S/ 13,00 | `evidencias/s9-07-resumen.jpg` |
| 8 | Verificado: Volver cierra la confirmación y conserva el formulario | `evidencias/s9-08-volver.jpg` |
| 9 | Verificado: registro y navegación al comprobante 8 | `evidencias/s9-09-venta-registrada.jpg` |
| 10 | Verificado: total del comprobante y de la API coinciden | `evidencias/s9-10-total-comprobante.jpg`, `evidencias/verificacion-venta-ui.json` |
| 11 | Pendiente verificar el diálogo y la vista previa de impresión | La casilla está presente y marcada inicialmente; el registro usado para el caso 9 la desmarcó |
| 12 | Pendiente verificar impresión de una venta anulada | Existe una venta anulada en la consulta, pero no se completó la vista previa |
| 13 | Pendiente verificar la impresión de la consulta | No se completó la vista previa |
| 14 | Verificado con lectura de stock en la API | `evidencias/verificacion-venta-ui.json` |
| 15 | Verificado con solicitudes simultáneas a la API y comprobación de rollback | `evidencias/verificacion-api.json` |
| 16 | Verificado en Angular y la API | `evidencias/s9-16-filtro-cliente-fecha.jpg`, `evidencias/verificacion-venta-ui.json` |
| 17 | Verificado: mensaje de rango inválido en Angular | `evidencias/s9-17-fechas-invalidas.jpg` |

Las pruebas 11–13 quedaron pendientes por una limitación del control de impresión: el navegador integrado no respondió al abrirla. El usuario autorizó una ventana aparte de Chrome; la revisión automática impidió leer la ventana existente de Google Meet por ser ajena a la tarea. Se intentó abrir otra ventana y Computer Use terminó porque no pudo verificar con confianza su URL. No se envió ningún trabajo a una impresora.

Las imágenes son capturas reales de la interfaz. Los archivos JSON son resultados de la API; no reemplazan las capturas de Red solicitadas para la entrega académica. El PDF final de las 17 pruebas sigue pendiente hasta completar impresión y esas evidencias de Red.

## Cambios realizados

- Categorías y Clientes: diálogo antes de guardar o dar de baja; cancelar no ejecuta la operación.
- Avisos comunes de éxito y error durante 3000 ms, incluso al volver del formulario al listado.
- Categorías: baja lógica, conservación del registro y bloqueo si tiene productos asociados.
- Clientes: baja lógica y bloqueo si tiene ventas asociadas, incluidas las anuladas.
- Las mismas restricciones se aplican al desmarcar Activo al editar.
- Listados con búsqueda, orden ascendente/descendente, indicador de orden, tamaños 5/10/20 y navegación.
- La API devuelve arreglos: el filtrado, ordenamiento y paginación se realizan en Angular antes de mostrar la página.
- Ventas: descuento condicional de stock dentro de la transacción para evitar que dos cajas consuman las mismas unidades; prevención del doble envío en el formulario.

## Preparar la comprobación manual

1. Reinicia tu instancia de Spring Boot para cargar los cambios. Se encontró una instancia previa ocupando el puerto 8080; compilar no actualiza automáticamente ese proceso.
2. Inicia o reinicia Angular con `npm start` desde `pharma-frontend`.
3. Abre `http://localhost:4200`. CORS está configurado para localhost; usar 127.0.0.1 como origen no es equivalente.
4. Verifica Oracle y la API en `http://localhost:8080/swagger-ui.html`.
5. Usa datos de práctica: al menos tres clientes activos y cinco productos activos con stock. Anota el stock antes de vender.
6. Abre F12 → Red y conserva una captura por caso. No registres ventas sobre datos reales para estas pruebas.

## Pruebas de la guía

Las pruebas automáticas sirven de apoyo; **no sustituyen las 17 capturas con la aplicación y la base de datos**. El resultado actualizado y las capturas obtenidas están en la tabla del segundo intento, arriba. La imagen `evidencias/confirmacion-categoria.jpg` corresponde únicamente al nuevo diálogo de categorías.

| N.º | Acción | Qué debe quedar en la evidencia |
|---|---|---|
| 1 | Revisar la venta vacía | Validaciones visibles; no hay confirmación ni POST. Cubierto también por prueba unitaria. |
| 2 | Buscar apellido sin tilde y texto inexistente | Coincidencias sin tildes, exclusión de inactivos y estado sin resultados. Lógica cubierta por prueba unitaria. |
| 3 | Agregar un producto y cantidad 3 | Subtotal = precio × 3; total actualizado. Cálculo cubierto por prueba unitaria. |
| 4 | Agregar con Enter y quitar una línea | Enter no envía; se recalcula el total. Lógica cubierta por pruebas unitarias. |
| 5 | Repetir un producto | Aumenta su cantidad sin duplicar la línea. Cubierto por prueba unitaria. |
| 6 | Superar el stock | Advertencia y bloqueo de la revisión. Cubierto por prueba unitaria. |
| 7 | Corregir y revisar | Resumen con cliente, productos y total estimado. |
| 8 | Pulsar Volver | Resumen cerrado sin POST en Red. |
| 9 | Confirmar | POST 201 y comprobante. En pruebas unitarias se valida el cuerpo enviado y la navegación con una respuesta simulada. |
| 10 | Comparar importes | Total del comprobante igual al calculado con los precios vigentes. |
| 11 | Confirmar con impresión marcada | Diálogo de impresión, DNI y pie; sin menú ni botones. |
| 12 | Imprimir una venta anulada | Comprobante con ANULADA y diálogo de impresión. |
| 13 | Filtrar e imprimir consulta | Filtros aplicados, tabla y total de ventas registradas de la página. |
| 14 | Consultar stock después de vender | Diferencia igual a las unidades vendidas. |
| 15 | Vender las últimas unidades desde dos pestañas | Una operación obtiene 201, la otra 409; no hay stock negativo ni venta parcial. Se añadió descuento condicional; la concurrencia y el rollback reales requieren esta prueba con Oracle. |
| 16 | Consultar por cliente y fechas | GET con filtros seleccionados y resultados coherentes. |
| 17 | Desde posterior a Hasta | Mensaje en pantalla y ausencia de nueva petición. |

## Comprobaciones adicionales de Categorías y Clientes

- Guardar y cancelar en el diálogo: no debe enviarse POST/PUT.
- Confirmar creación o edición: aviso de éxito durante 3 segundos al regresar al listado.
- Dar de baja una categoría sin productos o un cliente sin ventas: cambia a Inactivo y conserva su ID.
- Intentar dar de baja registros asociados: respuesta 409 y mensaje durante 3 segundos; el estado sigue activo.
- Repetir lo anterior desmarcando Activo desde Editar.
- Ordenar en ambos sentidos, cambiar el tamaño, avanzar y buscar: el filtro reinicia la página y no aparecen páginas fuera de rango.

## Verificación automatizada

Frontend, desde `pharma-frontend`:

```powershell
npm run build
npm test -- --watch=false
```

Se configuró Vitest con un trabajador de tipo thread para evitar los fallos de inicio del ejecutor observados en Windows. Si el entorno restringido bloquea los procesos, ejecuta estos comandos desde tu terminal habitual.

Backend, desde `pharmaSoft-main`:

```powershell
.\mvnw.cmd -Dtest=BajaLogicaTest test
```

Las pruebas del backend usan repositorios simulados: verifican reglas, baja lógica y uso del descuento condicional; no son pruebas de concurrencia ni persistencia real.

## Entrega y paso 11

Después de completar las capturas, reúne las 17 evidencias en el PDF de entrega de la práctica. La guía continúa con versionado y solicitud de incorporación: revisa primero los cambios que ya tenías, incluidos los archivos nuevos de Ventas. No se han creado commits ni enviado cambios al remoto en esta revisión.
