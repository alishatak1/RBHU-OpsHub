# RBHU OpsHub - Setup Instructions

## Prerequisites
- Node.js 22 or compatible LTS
- npm
- Python 3
- PostgreSQL or Neon PostgreSQL
- Git

## 1. Clone the repository
    git clone https://github.com/alishatak1/RBHU-OpsHub.git
    cd RBHU-OpsHub

## 2. Backend setup
    cd backend
    npm install
    Copy-Item .env.example .env

Edit backend/.env and replace all placeholder values with your actual database URL and AI API key. Do not commit this file.

Generate Prisma Client:
    npx prisma generate

Apply migrations after configuring a valid database connection:
    npx prisma migrate deploy

Start backend:
    npm run dev

Backend: http://localhost:5000
Health: http://localhost:5000/api/health
Swagger: http://localhost:5000/api-docs

## 3. Frontend setup
Open another terminal at the project root:
    cd frontend
    npm install

Create frontend/.env with:
    VITE_API_URL=http://localhost:5000/api

Start:
    npm run dev

Frontend: http://localhost:5173

## 4. Analytics setup
Open another terminal at the project root:
    cd analytics
    python -m venv venv
    .\venv\Scripts\Activate.ps1
    pip install -r requirements.txt
    python app.py

Analytics: http://localhost:8000
Health: http://localhost:8000/health

## 5. Running the application
Keep all three services running in separate terminals:
- Backend: Node.js and Express
- Frontend: React and Vite
- Analytics: Python and Flask

Open the frontend in your browser and sign in with a configured administrator account.

## 6. Additional documentation
- README: ../README.md
- Environment variables: environment-variables.md
- API documentation: api-documentation.md
- Architecture: architecture.md
- Database schema: database-schema.md
- Azure deployment: azure-deployment.md
- Render deployment: render-deployment.md

## Important notes
- The .env.example file contains placeholders, not working credentials.
- Never commit API keys, database passwords or .env files.
- Run migrations only after configuring the intended database.
- The current live deployment uses Render and Neon PostgreSQL. Azure deployment is documented as a design.
