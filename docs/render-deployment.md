# RBHU OpsHub - Render Deployment Guide

## Deployment Overview

The application is deployed using three separate Render services and Neon PostgreSQL.

| Component | Hosting |
|---|---|
| Frontend | Render Static Site |
| Backend API | Render Web Service |
| Analytics | Render Web Service |
| Database | Neon PostgreSQL |

## 1. Frontend

Live URL:
https://rbhu-opshub-frontend-v2.onrender.com

Build command:
npm install && npm run build

Publish directory:
dist

Environment variable:
VITE_API_URL=https://rbhu-opshub-backend.onrender.com/api

## 2. Backend

Live URL:
https://rbhu-opshub-backend.onrender.com

Health endpoint:
https://rbhu-opshub-backend.onrender.com/api/health

Swagger documentation:
https://rbhu-opshub-backend.onrender.com/api-docs

Configure DATABASE_URL and the required Gemini AI settings in Render environment variables.

## 3. Analytics Service

Live URL:
https://rbhu-opshub-analytics.onrender.com

Health endpoint:
https://rbhu-opshub-analytics.onrender.com/health

Root directory:
analytics

Build command:
pip install -r requirements.txt

Start command:
gunicorn app:app

## 4. Database

The application uses Neon PostgreSQL.

Prisma manages the database schema and migrations. Keep the database connection string private and configure it through the backend service environment settings.

## 5. Deployment Notes

- Frontend, backend and analytics are deployed independently.
- The frontend communicates with the backend through its configured API URL.
- The analytics service handles CSV analysis requests.
- Backend CORS configuration must allow the deployed frontend origin.
- Never commit environment files, passwords or API keys.
- Azure deployment remains a proposed future architecture, not the current hosting setup.
