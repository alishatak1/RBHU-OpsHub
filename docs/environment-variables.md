# Environment Variable Guide

## Backend

Create backend/.env using backend/.env.example.

| Variable | Purpose |
|---|---|
| PORT | Backend server port (5000 locally) |
| DATABASE_URL | PostgreSQL / Neon connection string |
| AI_API_KEY | Gemini API key |
| AI_MODEL | Gemini model (gemini-2.5-flash) |
| AI_BASE_URL | Gemini API endpoint |

## Frontend

| Variable | Purpose |
|---|---|
| VITE_API_URL | Backend API URL, including /api |

Local example: http://localhost:5000/api

## Analytics

No custom environment variables are currently referenced in the analytics Python source code.

## Security

- Never commit .env files or real credentials.
- Configure production variables through Render environment settings.
- Keep database URLs and API keys private.
