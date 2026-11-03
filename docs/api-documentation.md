# RBHU OpsHub — API Documentation

Base backend URL:

`http://localhost:5000`

All request and response bodies use JSON unless otherwise specified.

## 1. Health

### GET /api/health

Checks backend availability.

Example response:

```json
{
  "status": "ok",
  "service": "RBHU OpsHub API"
}
```

### GET /api/db-test

Checks PostgreSQL connectivity.

## 2. Customers

Base path: `/api/customers`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/customers` | List customers |
| POST | `/api/customers` | Create customer |
| GET | `/api/customers/:id` | Retrieve a customer |
| PUT | `/api/customers/:id` | Update a customer |
| DELETE | `/api/customers/:id` | Soft-delete/deactivate a customer |

Example create request:

```json
{
  "name": "Amit Sharma",
  "email": "amit@example.com",
  "phone": "9876543210",
  "company": "RBHU Demo"
}
```

Email must be unique. Optional fields may be omitted.

The delete operation is designed to deactivate a customer rather than physically remove the database record.

## 3. Shipments

Base path: `/api/shipments`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/shipments` | List shipments |
| POST | `/api/shipments` | Create shipment |
| GET | `/api/shipments/:id` | Retrieve shipment |
| PATCH | `/api/shipments/:id/status` | Update shipment status |

Example create request:

```json
{
  "trackingNumber": "RBHU-1002",
  "origin": "Mumbai",
  "destination": "Pune",
  "customerId": "CUSTOMER_UUID"
}
```

Supported shipment statuses:

- PENDING
- PROCESSING
- IN_TRANSIT
- DELIVERED
- CANCELLED

Example status update:

```json
{
  "status": "IN_TRANSIT"
}
```

A successful status update triggers the Socket.IO event `shipment_status_changed`.

## 4. AI Assistant

### POST /api/chat

Accepts a user message and optional conversation history.

Example request:

```json
{
  "message": "Explain the shipment tracking process.",
  "history": [
    {
      "role": "user",
      "content": "What is a shipment?"
    },
    {
      "role": "assistant",
      "content": "A shipment is a consignment being transported."
    }
  ]
}
```

History supports `user` and `assistant` roles and a maximum of 20 entries.

Example successful response:

```json
{
  "success": true,
  "reply": "Shipment tracking allows operations teams to monitor delivery progress."
}
```

If Azure OpenAI configuration is missing, the endpoint returns HTTP 503.

## 5. Announcements

### GET /api/announcements

Returns sample announcements.

Example response:

```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "id": "ANN-001",
      "title": "Welcome to RBHU OpsHub",
      "message": "The operations platform is now available.",
      "category": "Platform Update",
      "priority": "high",
      "publishedAt": "2026-11-02T09:00:00.000Z",
      "pinned": true
    }
  ]
}
```

The current implementation uses in-memory mock data.

## 6. Analytics Microservice

Base URL:

`http://localhost:8000`

### GET /health

Checks the Flask analytics service.

### POST /analyze

Uploads a CSV file using multipart/form-data.

Form field:

`file`

Required CSV columns:

- salesperson
- revenue
- region

The response contains summary statistics, revenue grouped by region, top salespeople and chart data.

## 7. Real-Time Socket.IO Event

Event:

`shipment_status_changed`

Example payload:

```json
{
  "shipmentId": "shipment-uuid",
  "status": "DELIVERED"
}
```

The frontend listens for this event and updates the shipment display.

## 8. Interactive API Documentation

Swagger UI:

`http://localhost:5000/api-docs`

The OpenAPI definition currently documents selected backend endpoints. Refer to the route implementation for the complete endpoint behaviour.