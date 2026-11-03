# RBHU OpsHub
### Enterprise Operations Management Platform

RBHU OpsHub is a full-stack operations management application for managing customers, tracking shipments, monitoring operational activity and analyzing sales performance.

## Features

- Customer management with create, read, update and soft-delete operations.
- Shipment creation, retrieval and status management.
- Real-time shipment status notifications using Socket.IO.
- Operations dashboard with shipment statistics and charts.
- CSV-based sales analytics using Python, Pandas and Plotly.
- AI logistics assistant API with Azure OpenAI integration support.
- JWT-based admin authentication with protected API routes.
- Operations announcements API.
- Swagger/OpenAPI documentation.
- PostgreSQL database managed using Prisma ORM.

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Vite |
| UI | CSS, Recharts, Lucide React |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL |
| ORM | Prisma |
| Validation | Zod |
| Real-time communication | Socket.IO |
| Analytics | Python, Flask, Pandas, Plotly |
| AI integration | Azure OpenAI compatible API |
| API documentation | Swagger UI / OpenAPI |
| Database hosting | Neon PostgreSQL (development) |

## Project Structure

```text
RBHU-OpsHub/
â”œâ”€â”€ backend/
â”‚   â”œâ”€â”€ prisma/
â”‚   â””â”€â”€ src/
â”‚       â”œâ”€â”€ config/
â”‚       â”œâ”€â”€ controllers/
â”‚       â”œâ”€â”€ middleware/
â”‚       â”œâ”€â”€ repositories/
â”‚       â”œâ”€â”€ routes/
â”‚       â”œâ”€â”€ schemas/
â”‚       â”œâ”€â”€ services/
â”‚       â””â”€â”€ sockets/
â”œâ”€â”€ frontend/
â”‚   â””â”€â”€ src/
â”œâ”€â”€ analytics/
â”‚   â”œâ”€â”€ app.py
â”‚   â”œâ”€â”€ requirements.txt
â”‚   â””â”€â”€ sample-sales.csv
â”œâ”€â”€ docs/
â””â”€â”€ README.md
```

## Prerequisites

- Node.js 22 or compatible modern LTS version
- npm
- Python 3
- PostgreSQL database
- Git

## Local Setup

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd RBHU-OpsHub
```

### 2. Configure the backend

```bash
cd backend
npm install
```

Create `backend/.env` using `.env.example` as a reference.

Required database configuration:

```env
PORT=5000
DATABASE_URL="YOUR_POSTGRESQL_CONNECTION_STRING"
```

Optional AI configuration:

```env
AZURE_OPENAI_ENDPOINT=
AZURE_OPENAI_API_KEY=
AZURE_OPENAI_DEPLOYMENT=
AZURE_OPENAI_API_VERSION=2024-10-21
```

Never commit real credentials or `.env` files.

Generate the Prisma client and apply migrations:

```bash
npx prisma generate
npx prisma migrate deploy
```

For local development when creating a new migration:

```bash
npx prisma migrate dev --name migration_name
```

Start the backend:

```bash
npm run dev
```

Backend URL: `http://localhost:5000`

Swagger documentation: `http://localhost:5000/api-docs`

### 3. Configure the frontend

Open a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend URL: `http://localhost:5173` (or the port displayed by Vite).

### 4. Configure the analytics service

Open another terminal:

```bash
cd analytics
python -m venv venv
```

Activate the environment on Windows:

```powershell
.\venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start Flask:

```bash
python app.py
```

Analytics URL: `http://localhost:8000`

## Authentication

The application uses JWT-based admin authentication.

- POST /api/auth/setup creates the initial administrator.
- POST /api/auth/login authenticates an administrator.
- GET /api/auth/me returns the authenticated administrator.
- Protected customer and shipment routes require a Bearer token.

Never publish real credentials or tokens.

## Services

| Service | Local URL |
|---|---|
| React frontend | http://localhost:5173 |
| Express backend | http://localhost:5000 |
| Swagger | http://localhost:5000/api-docs |
| Analytics | http://localhost:8000 |
| Backend health | http://localhost:5000/api/health |
| Database health | http://localhost:5000/api/db-test |
| Analytics health | http://localhost:8000/health |

## Main API Modules

- `/api/customers` â€” customer management.
- `/api/shipments` â€” shipment management.
- `/api/chat` â€” AI assistant.
- `/api/announcements` â€” operations announcements.
- `/analyze` â€” CSV analytics.

See [API Documentation](docs/api-documentation.md).

## Real-Time Shipment Updates

The backend uses Socket.IO to broadcast the `shipment_status_changed` event when a shipment status is updated.

Event payload:

```json
{
  "shipmentId": "shipment-uuid",
  "status": "IN_TRANSIT"
}
```

## Analytics

Upload a CSV file containing these columns:

- salesperson
- revenue
- region

The analytics service calculates summary statistics, revenue by region and top salespeople.

A sample file is available at `analytics/sample-sales.csv`.

## AI Assistant

The AI assistant accepts a message and optional conversation history. It can connect to Azure OpenAI when valid configuration is supplied.

Without the required credentials, the API responds with HTTP 503 and a configuration message.

## Architecture and Design Documents

- [System Architecture](docs/architecture.md)
- [API Documentation](docs/api-documentation.md)
- [Database Schema](docs/database-schema.md)
- [Azure Deployment Design](docs/azure-deployment.md)
- [Microsoft Fabric Readiness](docs/fabric-readiness.md)
- [Voice Agent Design](docs/voice-agent.md)
- [SharePoint Integration](docs/sharepoint-integration.md)

## Security Notes

- Store secrets in environment variables or a managed secret store.
- Do not commit `.env` files.
- Use HTTPS in production.
- Configure restricted CORS origins.
- Use proper authentication and authorization before production.
- Validate incoming data.
- Use private networking for managed database access where possible.

## Deployment

The Azure deployment architecture is documented as a proposed design. The current development database uses Neon PostgreSQL. Actual Azure deployment is not claimed.

## Project Status

This project is a technical assessment implementation and architecture demonstration. Azure production deployment, Microsoft Fabric integration and voice-agent integration are proposed extensions.

---
RBHU OpsHub | Operations Management Platform
## Integration and Deployment Status

| Component | Current Status |
|---|---|
| Customer and shipment management | Implemented |
| JWT authentication | Implemented |
| PostgreSQL and Prisma | Implemented |
| Real-time shipment updates | Implemented |
| CSV analytics | Implemented |
| AI assistant API | Implemented; Azure credentials required for live responses |
| Announcements | Implemented with mock data |
| SharePoint live integration | Design documented; not connected |
| Voice Agent | Architecture documented; not deployed |
| Microsoft Fabric | Readiness documented; not connected |
| Azure deployment | Deployment design documented; not deployed |

The project runs locally. Live cloud integrations require the relevant Azure subscription, services and credentials.
