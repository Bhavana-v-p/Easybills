# EasyBills - Copilot Instructions

## Project Overview
EasyBills is a Node.js/Express-based expense claim management system designed for faculty members to submit, track, and manage reimbursement claims. The system enforces role-based access control with role-based authorization (Faculty, Department Heads, Finance Teams).

## Project Structure
```
Easybills/
├── config/
│   └── db.js              # Sequelize PostgreSQL configuration
├── models/
│   └── Claim.js           # ExpenseClaim model with JSONB fields
├── controllers/
│   └── claimsController.js    # Business logic for claim operations
├── routes/
│   └── claims.js          # Route definitions for API endpoints
├── server.js              # Express app entry point
├── .env.example           # Environment variables template
└── .github/
    └── copilot-instructions.md
```

## Architecture

### Key Components
- **Controllers**: Handle HTTP endpoints and business logic (e.g., `claimsController.js`)
  - Controllers use async/await patterns for all database operations
  - Response format: `{ success: boolean, data: object|array, message: string, error: string }`
  - All endpoints are private and require authentication via `req.user.id`

- **Models**: ORM models (Sequelize) for database entities (referenced as `../models/Claim`)
  - Audit trail tracking is embedded in the Claim model
  - Support for document attachments as array fields

### Data Flow
1. Faculty submits claim → `submitClaim()` creates Claim with audit trail entry
2. Audit trail records: timestamp, status, changedBy (role), notes
3. Faculty retrieves claims → `getFacultyClaims()` filters by facultyId, sorted DESC by createdAt

### Role-Based Features
- **Faculty**: Submit claims, view own claims only
- **Finance/Approvers**: Review claims (implied by audit trail structure)
- Access control enforced via route-level middleware (not in controller)

## Code Patterns & Conventions

### Request/Response Pattern
```javascript
// Standard response structure
res.status(CODE).json({
    success: true|false,
    data: claimObject,          // omit if error
    count: arrayLength,         // include for list endpoints
    message: 'User-friendly message',
    error: 'Server Error'       // include if success: false
});
```

### Error Handling
- Wrap all async operations in try-catch blocks
- Log errors with `console.error()` before responding
- Return generic `'Server Error'` to clients (don't expose stack traces)
- Use appropriate HTTP status codes: 201 (created), 200 (success), 500 (error)

### Model Operations
- Use Sequelize methods: `Model.create()`, `Model.findAll()`, `Model.findByPk()`, `Model.update()`
- Always order by `createdAt` DESC for chronological listings
- Filter sensitive data based on role (facultyId, auditTrail visibility)

### Claim Status Workflow
Valid statuses (ENUM): `submitted` → `verified` → `approved` → `paid` → `clarification needed`
- Initial status defaults to `submitted` when claim is created
- Only proceed through workflow in this order (Finance logic handles validation)
- `clarification needed` can branch from any state if additional info is required

### Audit Trail Entries
Every status change must append an audit trail entry to the JSONB array:
```javascript
// Appending to existing audit trail (Sequelize with PostgreSQL)
await ExpenseClaim.update(
    {
        status: 'verified',
        auditTrail: sequelize.fn('array_append', 
            sequelize.col('auditTrail'),
            sequelize.literal(`'{"timestamp":"${new Date().toISOString()}","status":"verified","changedBy":"Finance","notes":"Verified against receipts"}'`)
        )
    },
    { where: { id: claimId } }
);

// OR simpler approach: fetch, modify, save
const claim = await ExpenseClaim.findByPk(claimId);
claim.auditTrail.push({
    timestamp: new Date(),
    status: 'verified',
    changedBy: 'Finance',
    notes: 'Verified against receipts'
});
await claim.save();
```

### JSONB Fields
- `documents`: Array of `{ fileName, fileUrl }` - secure storage URLs for bills/receipts
- `auditTrail`: Array of `{ timestamp, status, changedBy, notes }` - maintains compliance trail
- `comments`: Array of feedback from Finance/Approvers for faculty visibility

## Key Files & Dependencies
- `server.js`: Express app entry point - initializes server, connects DB, mounts routes
- `config/db.js`: Sequelize PostgreSQL configuration with `connectDB()` function
- `models/Claim.js`: ExpenseClaim model with JSONB audit/document storage
  - Uses Sequelize ENUM for status and category fields
  - PostgreSQL JSONB for flexible nested data (documents, auditTrail, comments)
  - Auto-timestamps: `createdAt`, `updatedAt` (Sequelize default)
- `controllers/claimsController.js`: Business logic (submitClaim, getFacultyClaims)
- `routes/claims.js`: API route definitions mapping endpoints to controller functions
- Authentication: Express middleware to inject `req.user.id` (TODO: implement)
- Database: Sequelize ORM with PostgreSQL JSONB support

## Common Tasks

### Adding a New Endpoint
1. Define route in router file (pattern: `/api/[role]/[resource]`)
2. Create async controller function with standard try-catch-response pattern
3. Validate input parameters from `req.body` or `req.params`
4. Interact with model (e.g., `await ExpenseClaim.findAll()`)
5. Return standard response format with appropriate HTTP status

### Modifying Claim Status Workflow
1. Create new endpoint in claimsController for status transitions (e.g., `/api/finance/claims/:id/verify`)
2. Follow the required status progression: submitted → verified → approved → paid
3. Append audit trail entry using one of two methods:
   - **Direct SQL (Sequelize)**: Use `sequelize.fn('array_append')` for atomic JSONB updates
   - **Fetch-Modify-Save**: Load claim, push to auditTrail array, call `claim.save()`
4. Include `changedBy` based on authenticated user's role (Faculty, Finance, Manager)
5. Add meaningful `notes` describing why the status changed (e.g., "Verified against receipts")

### Filtering & Authorization
- Use `where: { facultyId }` for faculty-scoped queries
- Role-based route handlers should filter audit trail visibility
- All queries assume `req.user.id` is populated by auth middleware

## Testing & Debugging
- **No test framework configured** - add Jest or Mocha if needed
- **No build step** - runs Node.js directly
- Placeholder IDs (e.g., `req.user.id || 1`) used in development
- **Database Debugging**: Enable SQL logging in `config/db.js` by setting `logging: console.log`
- **Connection Issues**: Verify `.env` file has correct PostgreSQL credentials and host
- **Running the Server**:
  ```bash
  npm install  # Install dependencies (Express, Sequelize, dotenv, pg)
  node server.js  # Start server on PORT (default: 3000)
  ```
- **API Testing**: Use Postman or curl to test endpoints:
  ```bash
  # Submit a claim
  curl -X POST http://localhost:3000/api/faculty/claims \
    -H "Content-Type: application/json" \
    -d '{"category":"Travel","amount":500,"description":"Conference","dateIncurred":"2025-01-15"}'
  
  # Get faculty claims
  curl -X GET http://localhost:3000/api/faculty/claims
  ```

## External Dependencies
- Express.js: Web framework
- Sequelize: ORM for database abstraction
- PostgreSQL: Required database (configured via environment variables)
- dotenv: Environment variable management

## Database Setup
- **Configuration**: `config/db.js` initializes Sequelize with PostgreSQL
- **Environment Variables** (required in `.env`):
  - `PG_DATABASE`: Database name (default: easybills_db)
  - `PG_USER`: PostgreSQL user (default: postgres)
  - `PG_PASSWORD`: PostgreSQL password
  - `PG_HOST`: Database host (default: localhost)
  - `PORT`: Server port (default: 3000)
  - `NODE_ENV`: Environment (development/production)
- **Setup Steps**:
  1. Copy `.env.example` to `.env` and fill in PostgreSQL credentials
  2. Run `npm install` to install dependencies
  3. Run `node server.js` to start the server
  4. Server will auto-create tables via `sequelize.sync()`
- **Connection Flow**: `server.js` calls `connectDB()` → authenticates → runs `sequelize.sync()` to create tables
- **Development Mode**: Edit `config/db.js` and use `sequelize.sync({ force: true })` to drop/recreate tables
- **SQL Logging**: Set `logging: console.log` in db.js to debug SQL queries

## Next Steps When Extending
- Add models for: Users, Departments, FinanceApprovers, Documents
- Implement missing routes: approve, reject, process claims
- Add input validation middleware (express-validator)
- Add authentication/authorization middleware (passport.js or JWT)
