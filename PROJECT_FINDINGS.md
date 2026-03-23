# Hallazgos Del Proyecto

Fecha de revisión: 2026-03-10

## Resumen

El proyecto es una SPA en Angular 19 para lavandería a domicilio. La app ya cubre el flujo principal de negocio:

- Landing pública
- Registro e inicio de sesión
- Perfil del usuario
- Direcciones
- Métodos de pago
- Nueva recolección
- Historial y detalle de pedidos

La base funcional existe, pero hay deuda técnica importante en seguridad, contratos HTTP y consistencia de datos.

## Hallazgos Prioritarios

### 1. Manejo inseguro de tarjetas

Problema:

- El frontend envía y manipula `cardNumber` y `cvv` como si fueran datos ordinarios.
- Además hay `console.log` con información sensible.

Impacto:

- Riesgo alto de exposición de datos sensibles.
- El flujo actual no es compatible con buenas prácticas de PCI.

Corrección recomendada:

1. No guardar `cvv` en backend ni frontend después de capturarlo.
2. No almacenar tarjetas completas; usar tokenización con un proveedor de pagos.
3. Eliminar todos los `console.log` que imprimen payloads de pago o sesión.
4. Separar métodos de pago reales de “preferencias de cobro”.

### 2. Inconsistencia entre `userId` e `id`

Problema:

- El tipo de login usa `userId`, pero varios componentes consumen `user_session.id`.

Impacto:

- Riesgo de fallos silenciosos en perfil, direcciones, métodos de pago y pedidos.

Corrección recomendada:

1. Definir una sola interfaz fuente de verdad para la sesión.
2. Alinear el backend y el frontend al mismo nombre de propiedad.
3. Reemplazar `any` por interfaces explícitas.

### 3. Protección de rutas basada solo en `localStorage`

Problema:

- El `authGuard` únicamente valida si existe `user_session`.
- No hay JWT, interceptor ni validación de identidad hacia las APIs.

Impacto:

- La navegación queda “protegida”, pero la seguridad real depende totalmente del backend.

Corrección recomendada:

1. Cuando llegue el momento, implementar autenticación real en backend.
2. Emitir un token o sesión firmada.
3. Agregar un `HttpInterceptor` para adjuntar credenciales.
4. Manejar expiración y cierre de sesión correctamente.

Nota:

- Por decisión actual del proyecto, esto puede quedarse diferido por ahora.

### 4. Contratos HTTP poco consistentes

Problema:

- Algunos servicios tipan arreglos simples, pero los componentes esperan objetos como `data.addresses`, `data`, o `services`.

Impacto:

- El proyecto compila, pero depende de `any` y es frágil ante cambios del backend.

Corrección recomendada:

1. Tipar cada endpoint con su respuesta real.
2. Eliminar `any` en componentes y servicios.
3. Crear interfaces como `ApiResponse<T>` cuando aplique.

### 5. Login con doble disparo

Problema:

- En login se llama `login()` por `(ngSubmit)` y por `(click)` en el botón.

Impacto:

- Puede duplicar requests, estados de carga y errores.

Corrección recomendada:

1. Dejar una sola vía de envío, preferentemente `(ngSubmit)`.
2. Quitar el `(click)` del botón submit.

### 6. Pruebas y markup desalineados

Problema:

- El spec principal espera contenido que ya no existe.
- Hay markup sobrante en `index.html`, como `app-footer` sin componente y un `router-outlet` fuera del documento.

Impacto:

- Las pruebas pierden valor y el HTML base queda confuso.

Corrección recomendada:

1. Actualizar los specs a la UI real.
2. Limpiar `index.html`.
3. Mantener las pruebas alineadas a flujos críticos, no al boilerplate inicial.

### 7. Configuración de entornos mezclada

Problema:

- `environment.ts` contiene endpoints locales, otros comentados por IP y otros cloud.

Impacto:

- Mayor riesgo de errores manuales y despliegues inconsistentes.

Corrección recomendada:

1. Dejar cada ambiente en su archivo correspondiente.
2. Evitar bloques comentados como mecanismo de cambio.
3. Centralizar la configuración por ambiente.

## Mejora Implementada En Esta Iteración

Se agregó soporte visual para direcciones con mapa en la pantalla de direcciones:

- Vista previa del mapa con OpenStreetMap + Leaflet
- Búsqueda de la dirección a partir de los campos del formulario
- Marcador ajustable manualmente
- Persistencia de `latitude` y `longitude` en el payload de dirección
- Visualización de coordenadas en direcciones guardadas

## Recomendaciones De La Parte De Mapa

La implementación actual usa geocodificación con Nominatim desde frontend. Esto sirve para avanzar, pero conviene endurecerlo después:

1. Mover la geocodificación al backend o a un servicio propio si el volumen crece.
2. Aplicar rate limiting y caching.
3. Validar qué proveedor de mapas/geocodificación usarás en producción.
4. Asegurar que el backend ya acepte y persista `latitude` y `longitude`.

## Orden Sugerido De Corrección

1. Unificar `id` vs `userId`.
2. Alinear contratos HTTP y eliminar `any`.
3. Limpiar logs sensibles.
4. Corregir login duplicado.
5. Ajustar pruebas base.
6. Ordenar environments.
7. Diseñar autenticación real cuando el backend esté listo.
