# Delivery Modes - Contratos Backend para Frontend

## Razon de ser

Se agrego el paso Modo de entrega en checkout para permitir al usuario elegir rapidez de entrega con impacto economico.

Objetivos tecnicos:

- Evitar texto libre en la seleccion del modo.
- Usar identificadores estables para la opcion elegida.
- Mantener backend como fuente de verdad del costo final.
- Evitar llamadas entre microservicios al momento de crear la orden.
- Guardar snapshot del modo elegido en la orden para trazabilidad historica.

Por esta razon, DeliveryModes vive en Orders y no depende de consultas a Catalogs durante el create order.

---

## Endpoint para poblar el selector de modo de entrega

### GET /api/Orders/delivery-modes

Devuelve los modos activos ordenados por SortOrder.

### Response 200

```json
{
  "message": "Delivery modes retrieved successfully",
  "data": [
    {
      "id": 1,
      "code": "EXPRESS_3H",
      "name": "Tres horas (Express)",
      "etaHours": 3,
      "surchargeAmount": 80.0,
      "isActive": true,
      "sortOrder": 1
    },
    {
      "id": 2,
      "code": "SIX_HOURS",
      "name": "Seis horas",
      "etaHours": 6,
      "surchargeAmount": 50.0,
      "isActive": true,
      "sortOrder": 2
    },
    {
      "id": 3,
      "code": "TWELVE_HOURS",
      "name": "Doce horas",
      "etaHours": 12,
      "surchargeAmount": 25.0,
      "isActive": true,
      "sortOrder": 3
    },
    {
      "id": 4,
      "code": "TWENTY_FOUR_HOURS",
      "name": "24 horas",
      "etaHours": 24,
      "surchargeAmount": 0.0,
      "isActive": true,
      "sortOrder": 4
    }
  ]
}
```

---

## Contrato de creacion de orden

### POST /api/Orders

La seleccion del modo se envia con order.deliveryModeId.

### Request ejemplo

```json
{
  "order": {
    "userId": "user-123",
    "userName": "Jair",
    "userPhone": "8123456789",
    "userAddressId": 10,
    "shippingAddress": {
      "title": "Casa",
      "street": "Av. Siempre Viva 123",
      "neighbourhood": "Centro",
      "city": "Monterrey",
      "state": "Nuevo Leon",
      "zipCode": "64000",
      "latitude": 25.6866,
      "longitude": -100.3161
    },
    "userPaymentMethodId": 4,
    "pickupDate": "2026-04-01",
    "pickupTime": "15:30:00",
    "isPostPayment": true,
    "postPaymentMethod": "cash",
    "deliveryModeId": 2
  },
  "orderDetails": [
    {
      "serviceId": "6f0b1ff8-7eb5-4b5b-beb5-5ab17d1b1e2f",
      "serviceName": "Lavado y Secado",
      "quantity": 2,
      "servicePrice": 90.0,
      "uoM": "BULTO",
      "servicePricingOptionId": "31f03c9b-15fd-4f67-98ff-7f1fd497a6fb",
      "pricingOptionName": "Bulto mediano",
      "coloredClothQuantity": 1,
      "blackClothQuantity": 1
    }
  ]
}
```

### Response 200

```json
{
  "message": "Order created successfully",
  "orderId": "8f7d4cae-5ad9-4834-9d50-f53e8781d06d"
}
```

---

## Reglas de backend que frontend debe conocer

1. orderDetails es obligatorio y debe traer al menos una linea.
2. Cada detail se valida con reglas de negocio existentes (cantidad, bulto, color/negra, etc).
3. DeliveryModeId debe existir y estar activo.
4. Si deliveryModeId no llega, backend aplica por defecto id 4 (24 horas).
5. Backend recalcula siempre:
   - deliveryFee = surchargeAmount del modo seleccionado
   - totalAmount = sum(subtotales de detalles) + deliveryFee
6. backend ignora cualquier total manipulado del cliente.
7. backend guarda snapshot del modo elegido en la orden:
   - deliveryModeId
   - deliveryModeCode
   - deliveryModeName
   - deliveryEtaHours
   - deliveryModeSurcharge

---

## Implicaciones para frontend

1. El selector de Modo de entrega debe poblarse desde GET /api/Orders/delivery-modes.
2. Al confirmar checkout, enviar solo deliveryModeId seleccionado.
3. Mostrar costo estimado en UI usando surchargeAmount del catalogo, pero considerar que backend recalculara el total final.
4. No construir reglas de negocio con strings del nombre; usar siempre id y code para logica de cliente.
5. Mantener compatibilidad: si por alguna razon frontend no envia deliveryModeId, backend cae a 24 horas.

---

## Resumen corto

- DeliveryModes se administra localmente en Orders.
- No hay dependencia en tiempo real con Catalogs para crear orden.
- El costo final de entrega y total siempre lo define backend.
- Frontend solo selecciona id y envia la orden.
