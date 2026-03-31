# Feature: Multiples bultos distintos en una misma orden

## Contexto

Un cliente puede necesitar lavar varios tipos de bulto en un mismo pedido. Por ejemplo:

- 1 bulto pequeño de ropa negra
- 1 bulto jumbo de ropa de color

El backend ya soporta este caso. No requiere cambios. Cada combinacion de tipo de bulto es una linea (`orderDetail`) independiente en la orden.

---

## Como funciona

Cada `orderDetail` representa una linea con:

- Su **tipo de bulto** (via `pricingOptionName`)
- Su **precio** (via `servicePrice`)
- Su **desglose de ropa** (via `coloredClothQuantity` y `blackClothQuantity`)

No hay limite de lineas del mismo servicio por orden.

---

## Ejemplo de request con multiples bultos

`POST /api/Orders`

```json
{
  "order": {
    "userId": "user-123",
    "...": "..."
  },
  "orderDetails": [
    {
      "serviceId": "uuid-lavado",
      "serviceName": "Lavado y Secado",
      "servicePrice": 40.00,
      "uoM": "BULTO",
      "servicePricingOptionId": "uuid-bulto-pequeno",
      "pricingOptionName": "Bulto pequeño",
      "coloredClothQuantity": 0,
      "blackClothQuantity": 1,
      "quantity": 1
    },
    {
      "serviceId": "uuid-lavado",
      "serviceName": "Lavado y Secado",
      "servicePrice": 140.00,
      "uoM": "BULTO",
      "servicePricingOptionId": "uuid-bulto-jumbo",
      "pricingOptionName": "Bulto jumbo",
      "coloredClothQuantity": 1,
      "blackClothQuantity": 0,
      "quantity": 1
    }
  ]
}
```

El backend calcula SubTotal por linea:

| Linea | effectiveQty | servicePrice | SubTotal |
|---|---|---|---|
| Bulto pequeño (negra) | 1 | 40.00 | 40.00 |
| Bulto jumbo (color) | 1 | 140.00 | 140.00 |
| **Total orden** | | | **180.00** |

---

## Responsabilidad del frontend

El backend no agrega lineas automaticamente. El frontend debe construir el array `orderDetails` con una entrada por cada combinacion tipo-bulto que el usuario configure.

### Flujo de UX recomendado

1. El usuario elige el servicio (ejemplo: Lavado y Secado).
2. Se muestra un selector de tipo de bulto con las opciones activas del servicio.
3. Para cada tipo de bulto seleccionado, se captura:
   - Cantidad de ropa de color (`coloredClothQuantity`)
   - Cantidad de ropa negra (`blackClothQuantity`)
4. Boton **"+ Agregar otro bulto"** para que el usuario agregue tantas lineas como necesite.
5. Cada linea produce un objeto separado en `orderDetails`.
6. `quantity` de cada linea = `coloredClothQuantity + blackClothQuantity`.

### Resumen visual de los campos por linea

| Campo | Tipo | Requerido cuando es bulto |
|---|---|---|
| `serviceId` | string (uuid) | Si |
| `serviceName` | string | Si |
| `servicePrice` | decimal | Si |
| `uoM` | string (`BULTO`) | Si |
| `servicePricingOptionId` | uuid | Si |
| `pricingOptionName` | string | Si |
| `coloredClothQuantity` | int >= 0 | Si |
| `blackClothQuantity` | int >= 0 | Si |
| `quantity` | int > 0 | Si (= suma de ambos) |
