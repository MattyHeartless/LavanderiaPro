# Pricing Options — Guía de cambios para el frontend

## Contexto del cambio

Anteriormente cada servicio de lavandería tenía **un solo precio y una sola unidad de medida** (UoM). Esto impedía que un mismo servicio (ej. "Lavado y Secado") pudiera ofrecerse a distintos precios según el tipo de carga del cliente (por kilo, por pieza, por bulto chico, etc.).

Se introdujo la entidad **`ServicePricingOption`**: una tabla hija de `Services` donde cada fila representa una variante de precio para ese servicio. Cada servicio puede tener de 1 a N opciones activas.

El flujo de checkout cambia: el usuario ya no selecciona solo un servicio, sino también **qué opción de precio** quiere aplicar. El frontend debe guardar el `id` y el `optionName` de la opción elegida al crear la orden.

---

## Catálogo de valores permitidos para `optionName`

Solo se aceptan exactamente estos valores. El campo `uoM` de cada opción **debe coincidir** con el que aparece en la tabla.

| `optionName`    | `uoM` requerido |
|-----------------|-----------------|
| `Por kilo`      | `KG`            |
| `Por pieza`     | `PZ`            |
| `Por docena`    | `DOC`           |
| `Bulto pequeño` | `BULTO`         |
| `Bulto mediano` | `BULTO`         |
| `Bulto grande`  | `BULTO`         |
| `Bulto jumbo`   | `BULTO`         |

---

## Base URL

- **Catalogs:** `http://localhost:5009/api/Catalogs`
- **Orders:** `http://localhost:5252/api/Orders`

---

## Cambios en endpoints existentes

### `GET /api/Catalogs/services`

**Antes** — cada elemento devolvía:
```json
{
  "id": "uuid",
  "name": "Lavado y Secado",
  "description": "...",
  "price": 25.00,
  "uoM": "KG",
  "isActive": true,
  "icon": "...",
  "themeIcon": "..."
}
```

**Ahora** — cada elemento incluye además el array `pricingOptions`:
```json
{
  "id": "uuid",
  "name": "Lavado y Secado",
  "description": "...",
  "price": 25.00,
  "uoM": "KG",
  "isActive": true,
  "icon": "...",
  "themeIcon": "...",
  "pricingOptions": [
    {
      "id": "uuid-opcion",
      "serviceId": "uuid",
      "optionName": "Por kilo",
      "price": 25.00,
      "uoM": "KG",
      "isActive": true,
      "createdAt": "2026-03-30T19:48:35Z",
      "updatedAt": "2026-03-30T19:48:35Z"
    },
    {
      "id": "uuid-opcion-2",
      "serviceId": "uuid",
      "optionName": "Bulto mediano",
      "price": 80.00,
      "uoM": "BULTO",
      "isActive": true,
      "createdAt": "2026-03-30T19:48:35Z",
      "updatedAt": "2026-03-30T19:48:35Z"
    }
  ]
}
```

> `price` y `uoM` en la raíz del servicio son campos legacy. El precio real a mostrar al usuario es el de cada `pricingOption`. Filtrar solo las que tengan `isActive: true`.

---

### `GET /api/Catalogs/services/{id}`

Mismo cambio que el listado: ahora incluye `pricingOptions[]` embebido.

---

### `PUT /api/Catalogs/services/{id}`

**Antes** — se enviaban todos los campos incluyendo `price` y `uoM`:
```json
{
  "name": "Lavado y Secado",
  "description": "...",
  "price": 30.00,
  "uoM": "KG",
  "isActive": true,
  "icon": "...",
  "themeIcon": "..."
}
```

**Ahora** — `price` y `uoM` son **ignorados** en el body (el precio se gestiona solo desde pricing-options). Solo se actualizan: `name`, `description`, `isActive`, `icon`, `themeIcon`.
```json
{
  "name": "Lavado y Secado",
  "description": "...",
  "isActive": true,
  "icon": "...",
  "themeIcon": "..."
}
```

---

### `POST /api/Orders` — crear orden

**Antes** — `orderDetails` con 5 campos:
```json
{
  "order": { ... },
  "orderDetails": [
    {
      "serviceId": "uuid-como-string",
      "serviceName": "Lavado y Secado",
      "quantity": 3,
      "servicePrice": 25.00,
      "uoM": "KG"
    }
  ]
}
```

**Ahora** — `orderDetails` con 2 campos adicionales opcionales (pero se deben enviar cuando el usuario eligió una opción):
```json
{
  "order": { ... },
  "orderDetails": [
    {
      "serviceId": "uuid-como-string",
      "serviceName": "Lavado y Secado",
      "quantity": 3,
      "servicePrice": 25.00,
      "uoM": "KG",
      "servicePricingOptionId": "uuid-opcion",
      "pricingOptionName": "Por kilo"
    }
  ]
}
```

> Los campos `servicePricingOptionId` y `pricingOptionName` son **nullable**. Las órdenes ya existentes en la base de datos tienen `null` en esos campos y siguen funcionando sin cambios.

---

## Nuevos endpoints

### `GET /api/Catalogs/services/{serviceId}/pricing-options`

Devuelve todas las opciones de precio de un servicio (activas e inactivas).

**Response 200:**
```json
{
  "pricingOptions": [
    {
      "id": "uuid-opcion",
      "serviceId": "uuid",
      "optionName": "Por kilo",
      "price": 25.00,
      "uoM": "KG",
      "isActive": true,
      "createdAt": "2026-03-30T19:48:35Z",
      "updatedAt": "2026-03-30T19:48:35Z"
    }
  ]
}
```

---

### `GET /api/Catalogs/pricing-options/{optionId}/is-active`

Consulta rápida para validar en el checkout si la opción que el usuario seleccionó sigue activa antes de crear la orden.

**Response 200:**
```json
{ "isActive": true }
```

**Response 404:**
```json
{ "message": "Pricing option not found" }
```

---

### `POST /api/Catalogs/services/{serviceId}/pricing-options`

Crea una nueva opción de precio para un servicio (uso administrativo).

**Request body:**
```json
{
  "optionName": "Bulto grande",
  "price": 120.00,
  "uoM": "BULTO",
  "isActive": true
}
```

**Response 201:**
```json
{
  "message": "Pricing option added successfully",
  "data": {
    "id": "uuid-nuevo",
    "serviceId": "uuid",
    "optionName": "Bulto grande",
    "price": 120.00,
    "uoM": "BULTO",
    "isActive": true,
    "createdAt": "2026-03-30T19:48:35Z",
    "updatedAt": "2026-03-30T19:48:35Z"
  }
}
```

**Errores posibles:**
| Status | Motivo |
|--------|--------|
| 400 | `optionName` inválido, `uoM` no coincide, `price` ≤ 0, opción duplicada en el servicio |
| 404 | El servicio no existe |

---

### `PUT /api/Catalogs/services/{serviceId}/pricing-options/{optionId}`

Actualiza una opción de precio existente (uso administrativo).

**Request body:**
```json
{
  "optionName": "Bulto grande",
  "price": 130.00,
  "uoM": "BULTO",
  "isActive": true
}
```

**Response 200:**
```json
{
  "message": "Pricing option updated successfully",
  "data": { ... }
}
```

**Errores posibles:**
| Status | Motivo |
|--------|--------|
| 400 | Validación de campos; intentar desactivar la única opción activa del servicio |
| 404 | Opción no encontrada o no pertenece al servicio |

---

### `DELETE /api/Catalogs/services/{serviceId}/pricing-options/{optionId}`

Elimina una opción de precio (uso administrativo).

**Response 200:**
```json
{ "message": "Pricing option deleted successfully", "success": true }
```

**Errores posibles:**
| Status | Motivo |
|--------|--------|
| 400 | Es la única opción activa del servicio — no se puede eliminar |
| 404 | Opción no encontrada o no pertenece al servicio |

---

## Reglas de negocio importantes para el frontend

1. **Mostrar solo opciones activas** (`isActive: true`) en el catálogo de selección del cliente.
2. **Al crear una orden**, antes de hacer el `POST /api/Orders`, llamar a `GET /api/Catalogs/pricing-options/{optionId}/is-active` para verificar que la opción sigue vigente.
3. **Un servicio siempre tiene al menos una opción activa** — el backend lo garantiza, pero el frontend no debe mostrar servicios sin opciones activas en el checkout.
4. Los campos `price` y `uoM` en la raíz de `Service` son legacy y no deben usarse para mostrar precio al cliente final. Usar exclusivamente los de `pricingOptions`.
