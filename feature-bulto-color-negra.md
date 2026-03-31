# Feature puntual: Bulto con desglose de ropa de color y negra

## Alcance

Este documento describe unicamente la feature de checkout para opciones tipo bulto:

- Permitir separar cuanta ropa es de color.
- Permitir separar cuanta ropa es negra.
- Mantener compatibilidad con el flujo actual de ordenes.

No cubre otras partes del proyecto.

---

## Objetivo funcional

Cuando el usuario seleccione una opcion de precio tipo bulto (por ejemplo, `Bulto mediano`), el frontend debe capturar dos cantidades:

- `coloredClothQuantity`
- `blackClothQuantity`

Y enviar ambas en el detalle de la orden.

---

## Contrato actualizado (solo para esta feature)

### Endpoint

`POST /api/Orders`

### Campos nuevos en cada `orderDetails[]`

- `coloredClothQuantity` (int, nullable en BD)
- `blackClothQuantity` (int, nullable en BD)

### Regla de envio esperada

Para opciones tipo bulto:

- Enviar `coloredClothQuantity` y `blackClothQuantity`.
- Enviar `quantity` como suma de ambas cantidades.

Formula:

`quantity = coloredClothQuantity + blackClothQuantity`

### Ejemplo de request (bulto)

```json
{
  "order": {
    "userId": "user-123"
  },
  "orderDetails": [
    {
      "serviceId": "a8f9d8b6-2f67-4dd2-9a83-bef7d2ea88b4",
      "serviceName": "Lavado y Secado",
      "servicePrice": 90.00,
      "uoM": "BULTO",
      "servicePricingOptionId": "dc6464fc-9707-4de0-89c9-8c8fa24a9098",
      "pricingOptionName": "Bulto mediano",
      "coloredClothQuantity": 3,
      "blackClothQuantity": 2,
      "quantity": 5
    }
  ]
}
```

---

## Validaciones backend de esta feature

Si `pricingOptionName` contiene `Bulto`, backend valida:

1. `coloredClothQuantity` requerido y >= 0
2. `blackClothQuantity` requerido y >= 0
3. `coloredClothQuantity + blackClothQuantity > 0`

Si no es bulto, se mantiene la validacion tradicional:

- `quantity > 0`

---

## Calculo de subtotal

Para cada detalle:

- Si hay desglose color/negra con suma > 0, se usa esa suma.
- Si no, se usa `quantity`.

Formula efectiva:

`subTotal = effectiveQuantity * servicePrice`

Donde `effectiveQuantity` es:

- `coloredClothQuantity + blackClothQuantity` (cuando aplica)
- `quantity` (fallback)

---

## Compatibilidad

- Los nuevos campos son nullable en base de datos.
- Ordenes historicas siguen funcionando sin cambios.
- El frontend puede habilitar la UI de desglose solo cuando la opcion elegida sea tipo bulto.

---

## Regla UI recomendada para frontend

Si `pricingOptionName` contiene `Bulto`:

1. Mostrar 2 inputs numericos: color y negra.
2. Calcular y setear `quantity` automaticamente como suma.
3. Bloquear envio si ambos valores son 0 o vacios.

Si no es bulto:

1. Ocultar esos 2 inputs.
2. Usar solo `quantity` como hasta ahora.
