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
- POST `/api/faculty/claims/:id/documents` - Upload a document to a claim (multipart/form-data, field name: `document`)
- GET `/api/faculty/claims/:id/documents` - List all documents for a claim
- PUT `/api/finance/claims/:id/status` - Update claim status and send notification (body: `status`, `notes`)
- POST `/api/demo/send-email` - Send a demo email for testing (body: `email`, `claimId`, `status`, `notes`)

### Email Notifications

When a claim status changes, an email is automatically sent to the faculty member. Supported statuses:

| Status | Email Type | Use Case |
|--------|-----------|----------|
| `submitted` | Submission confirmation | Sent when claim is first created |
| `verified` | Status update | Finance team has verified the claim |
| `approved` | Approval notification | Claim has been approved for payment |
| `paid` | Payment confirmation | Reimbursement has been processed |
| `clarification needed` | Action required | Additional info is needed from faculty |
| `rejected` | Rejection notice | Claim has been rejected |

### Testing Email Templates

Use the demo endpoint to preview emails before they go live:

```powershell
# Test "approved" email
curl -X POST http://localhost:3000/api/demo/send-email `
  -H "Content-Type: application/json" `
  -d '{"email":"test@gmail.com","claimId":"DEMO-001","status":"approved","notes":"Claim approved for reimbursement"}'

# Test "clarification needed" email
curl -X POST http://localhost:3000/api/demo/send-email `
  -H "Content-Type: application/json" `
  -d '{"email":"test@gmail.com","claimId":"DEMO-002","status":"clarification needed","notes":"Please provide itemized receipts"}'

# Test "rejected" email
curl -X POST http://localhost:3000/api/demo/send-email `
  -H "Content-Type: application/json" `
  -d '{"email":"test@gmail.com","claimId":"DEMO-003","status":"rejected","notes":"Claim does not meet policy requirements"}'
```

### Email Configuration

Required `.env` variables for email:

```
EMAIL_SERVICE=gmail              # Service provider (gmail, sendgrid, aws-ses, etc.)
EMAIL_USER=your-email@gmail.com  # Email account for sending
EMAIL_PASSWORD=your-app-password  # App-specific password (NOT Gmail password)
EMAIL_FROM=noreply@easybills.com # From address in emails
```

**For Gmail:**
1. Enable 2-Step Verification in your Google Account
2. Create an App Password (16 characters) in Account Security
3. Use the App Password in `EMAIL_PASSWORD`

**For other services:**
- SendGrid: Use API key or SMTP credentials
- AWS SES: Configure IAM credentials
- Other SMTP: Use SMTP username/password

### File Upload (Firebase Cloud Storage)

Faculty can upload documents (receipts, invoices, etc.) to claims after creation:

```powershell
# Upload a file to a claim
curl -X POST http://localhost:3000/api/faculty/claims/1/documents `
  -F "document=@C:\path\to\receipt.pdf"

# Get all documents for a claim
curl -X GET http://localhost:3000/api/faculty/claims/1/documents
```

**File Upload Configuration:**

Required `.env` variables:

```
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-key.json    # Path to Firebase service account JSON key
FIREBASE_STORAGE_BUCKET=your-bucket-name.appspot.com # Cloud Storage bucket name
```

**Setup Steps:**

1. Create a Firebase project: https://console.firebase.google.com
2. Create a Cloud Storage bucket in your project
3. Generate a service account key:
   - Go to Project Settings → Service Accounts → Generate New Private Key
   - Save the JSON key to `./firebase-key.json` in your project root
4. Add the bucket name and key path to `.env`
5. Add `firebase-key.json` to `.gitignore` to prevent accidental secret commits

**Supported File Types:** PDF, PNG, JPG, GIF, DOCX, XLSX, DOC, XLS (max 10MB each)

**Upload Response Example:**

```json
{
  "success": true,
  "data": {
    "fileName": "receipt.pdf",
    "fileUrl": "https://firebasestorage.googleapis.com/v0/b/...",
    "uploadedAt": "2025-01-20T10:30:00Z",
    "size": 245632
  },
  "message": "Document uploaded successfully"
}
```

Files are stored with 1-year signed URLs, allowing secure access without authentication.

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

Run with Docker (Postgres + pgAdmin)

If you don't want to install Postgres locally, start a Postgres server and pgAdmin with Docker Compose:

```powershell
cd C:\Users\bhvp\Downloads\Easybills
docker compose up -d
```

By default the `docker-compose.yml` maps Postgres `5432` and pgAdmin on `http://localhost:8080`.

Environment variables may be read from your `.env` file (Docker Compose will not automatically load `.env` unless you set it in your shell). Example values in `.env.example`:

```
PG_DATABASE=easybills_db
PG_USER=postgres
PG_PASSWORD=your_password
PG_HOST=localhost
```

After the services are running, copy `.env.example` to `.env`, ensure the DB credentials match the Docker Compose settings (or set `PG_HOST=db` to reference the container from other containers), then run `npm install` and `node server.js` as documented above.

To stop and remove containers:

```powershell
docker compose down -v
```
