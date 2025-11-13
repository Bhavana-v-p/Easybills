# EasyBills

Minimal Expense Claim Management API (development scaffold).

Getting started

1. Install Node.js (LTS) from https://nodejs.org and ensure `node` and `npm` are in PATH.
2. In project root:

```powershell
cd C:\Users\bhvp\Downloads\Easybills
npm install
cp .env.example .env
# Edit .env - set your PostgreSQL credentials and DB name
node server.js
```

Endpoints

- POST `/api/faculty/claims` - Submit a claim (body: `category`, `amount`, `description`, `dateIncurred`)
- GET `/api/faculty/claims` - Get claims for the logged-in faculty user

Notes for developers

- A development auth stub `middleware/auth.js` injects `req.user` (id and role). Replace with real auth in production.
- Models use Sequelize and PostgreSQL JSONB fields (`documents`, `auditTrail`, `comments`).
- `config/db.js` runs `sequelize.sync()` on startup to create tables.

Testing locally

Use `curl` or Postman. Example (PowerShell):

```powershell
curl -X POST http://localhost:3000/api/faculty/claims ^
  -H "Content-Type: application/json" ^
  -d '{"category":"Travel","amount":500,"description":"Conference","dateIncurred":"2025-01-15"}'
```

CI

A basic GitHub Actions workflow is included at `.github/workflows/nodejs.yml` that installs dependencies and runs `npm test`.

Security reminder

- Do NOT commit `.env` to the repo. Add secrets to GitHub Actions as repository secrets when needed.
