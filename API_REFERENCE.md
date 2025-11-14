# EasyBills API Reference

Complete API documentation for Vue.js frontend integration.

## Base URL

```
Development: http://localhost:3000
Production: https://api.easybills.example.com (update as needed)
```

## Authentication

All endpoints (except `/auth/google/*`) require the user to be authenticated via Google OAuth 2.0.

The authentication flow:
1. Frontend redirects to `http://localhost:3000/auth/google`
2. User logs in with Google account
3. Backend creates a session and redirects to `FRONTEND_URL` with session cookie
4. Session cookie is included automatically in subsequent requests (credentials: true)

### Authentication Status

Check if user is authenticated:
```javascript
GET /api/user/me
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "googleId": "1234567890",
    "email": "faculty@bits-pilani.ac.in",
    "role": "Faculty",
    "createdAt": "2025-01-15T10:30:00Z",
    "updatedAt": "2025-01-15T10:30:00Z"
  }
}
```

**Response (401 Unauthorized):**
```json
{
  "success": false,
  "error": "Not authenticated"
}
```

---

## Claims Management

### Submit a Claim

```javascript
POST /api/faculty/claims
Content-Type: application/json
```

**Request Body:**
```json
{
  "category": "Travel",
  "amount": 5000,
  "description": "Conference attendance in Delhi",
  "dateIncurred": "2025-01-15"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "facultyId": 1,
    "category": "Travel",
    "amount": 5000,
    "description": "Conference attendance in Delhi",
    "dateIncurred": "2025-01-15",
    "status": "submitted",
    "documents": [],
    "auditTrail": [
      {
        "timestamp": "2025-01-15T10:30:00Z",
        "status": "submitted",
        "changedBy": "Faculty",
        "notes": "Claim submitted for processing."
      }
    ],
    "comments": [],
    "createdAt": "2025-01-15T10:30:00Z",
    "updatedAt": "2025-01-15T10:30:00Z"
  },
  "message": "Expense claim submitted successfully."
}
```

**Status Codes:**
- `201`: Claim created successfully
- `400`: Missing required fields
- `401`: Not authenticated
- `500`: Server error

---

### Get Faculty Claims

```javascript
GET /api/faculty/claims
```

**Query Parameters:**
- `status` (optional): Filter by status (`submitted`, `verified`, `approved`, `paid`, `clarification needed`, `rejected`)
- `category` (optional): Filter by category (`Travel`, `Accommodation`, `Meals`, `Materials`, `Others`)
- `sortBy` (optional): Sort field (`createdAt`, `amount`, `status`) - default: `createdAt`
- `order` (optional): Sort order (`ASC`, `DESC`) - default: `DESC`
- `limit` (optional): Number of claims to return - default: 50
- `offset` (optional): Pagination offset - default: 0

**Example:**
```
GET /api/faculty/claims?status=approved&sortBy=amount&order=DESC&limit=10
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "facultyId": 1,
      "category": "Travel",
      "amount": 5000,
      "description": "Conference attendance",
      "dateIncurred": "2025-01-15",
      "status": "approved",
      "documents": [
        {
          "fileName": "receipt.pdf",
          "fileUrl": "https://firebasestorage.googleapis.com/v0/b/...",
          "uploadedAt": "2025-01-16T10:30:00Z",
          "size": 245632
        }
      ],
      "auditTrail": [
        {
          "timestamp": "2025-01-15T10:30:00Z",
          "status": "submitted",
          "changedBy": "Faculty",
          "notes": "Claim submitted for processing."
        },
        {
          "timestamp": "2025-01-17T14:20:00Z",
          "status": "approved",
          "changedBy": "Finance",
          "notes": "Approved for payment"
        }
      ],
      "comments": [],
      "createdAt": "2025-01-15T10:30:00Z",
      "updatedAt": "2025-01-17T14:20:00Z"
    }
  ],
  "count": 1,
  "message": "Claims retrieved successfully"
}
```

---

### Get Claim Detail

```javascript
GET /api/faculty/claims/:id
```

**Response (200 OK):** Same as individual claim in list above

**Response (404 Not Found):**
```json
{
  "success": false,
  "error": "Claim not found"
}
```

---

### Update Claim Status (Finance Only)

```javascript
PUT /api/finance/claims/:id/status
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "approved",
  "notes": "Approved for payment after verification"
}
```

**Valid Status Transitions:**
- `submitted` → `verified` → `approved` → `paid`
- Any status → `clarification needed` (returns to submitter for more info)
- Any status → `rejected` (final rejection)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "approved",
    "auditTrail": [
      {
        "timestamp": "2025-01-17T14:20:00Z",
        "status": "approved",
        "changedBy": "Finance",
        "notes": "Approved for payment after verification"
      }
    ]
  },
  "message": "Claim status updated and notification email sent"
}
```

**Status Codes:**
- `200`: Status updated successfully
- `400`: Invalid status transition
- `403`: Only Finance users can update status
- `404`: Claim not found
- `500`: Server error

---

## Document Management

### Upload Document to Claim

```javascript
POST /api/faculty/claims/:id/documents
Content-Type: multipart/form-data
```

**Form Data:**
- `document` (file): The file to upload (PDF, JPG, PNG, DOCX, XLSX)

**Example (JavaScript Fetch):**
```javascript
const formData = new FormData();
formData.append('document', fileInput.files[0]);

const response = await fetch(
  'http://localhost:3000/api/faculty/claims/1/documents',
  {
    method: 'POST',
    credentials: 'include', // Include session cookie
    body: formData
  }
);
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "fileName": "receipt.pdf",
    "fileUrl": "https://firebasestorage.googleapis.com/v0/b/bucket/o/...",
    "uploadedAt": "2025-01-16T10:30:00Z",
    "size": 245632
  },
  "message": "Document uploaded successfully"
}
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Invalid file type. Allowed: PDF, images, Word, Excel"
}
```

**Response (413 Payload Too Large):**
```json
{
  "success": false,
  "error": "File size exceeds 10MB limit"
}
```

---

### Get Claim Documents

```javascript
GET /api/faculty/claims/:id/documents
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "fileName": "receipt.pdf",
      "fileUrl": "https://firebasestorage.googleapis.com/v0/b/...",
      "uploadedAt": "2025-01-16T10:30:00Z",
      "size": 245632,
      "mimeType": "application/pdf"
    },
    {
      "fileName": "invoice.xlsx",
      "fileUrl": "https://firebasestorage.googleapis.com/v0/b/...",
      "uploadedAt": "2025-01-16T10:35:00Z",
      "size": 15360,
      "mimeType": "application/vnd.ms-excel"
    }
  ],
  "count": 2,
  "message": "Documents retrieved successfully"
}
```

---

## Claim Categories

Valid claim categories:
- `Travel` - Transportation, flights, trains, cabs
- `Accommodation` - Hotels, lodging
- `Meals` - Food and beverages
- `Materials` - Equipment, supplies
- `Others` - Miscellaneous expenses

---

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "error": "Description of what went wrong"
}
```

**Common Status Codes:**
- `200`: Success
- `201`: Created
- `400`: Bad Request (invalid input)
- `401`: Unauthorized (not authenticated)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `413`: Payload Too Large (file too big)
- `500`: Internal Server Error

---

## Session & Cookies

The backend uses Express sessions with Passport.js. When a user authenticates via Google OAuth:

1. Backend creates a session
2. Session ID is stored in a `connect.sid` cookie
3. Cookie is set with `HttpOnly` flag (cannot be accessed by JavaScript, only sent with requests)
4. Cookie is sent automatically with all requests when `credentials: 'include'` is used

**Frontend Fetch Configuration:**
```javascript
// Always include credentials for authenticated endpoints
fetch('http://localhost:3000/api/faculty/claims', {
  method: 'GET',
  credentials: 'include', // Important!
  headers: {
    'Content-Type': 'application/json'
  }
});
```

**Axios Configuration:**
```javascript
import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:3000',
  withCredentials: true // Include cookies
});

export default instance;
```

---

## Rate Limiting

Not currently implemented. Consider adding for production:
- 100 requests per 15 minutes per IP
- 1000 requests per hour per authenticated user

---

## Pagination

List endpoints support pagination via query parameters:

```javascript
GET /api/faculty/claims?limit=20&offset=40
```

Returns items 40-59 (0-indexed).

---

## CORS Headers

Development environment allows requests from:
- Origin: `http://localhost:5173` (Vue.js dev server)
- Methods: GET, POST, PUT, DELETE, OPTIONS
- Credentials: Allowed

Update `FRONTEND_URL` in `.env` for production deployment.

---

## Demo Endpoint (Development Only)

Test email notifications without submission:

```javascript
POST /api/demo/send-email
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "faculty@bits-pilani.ac.in",
  "claimId": "DEMO-001",
  "status": "approved",
  "notes": "Your claim has been approved"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Demo email sent successfully to faculty@bits-pilani.ac.in"
}
```

---

## Frontend Integration Examples

### Vue 3 Composition API

```javascript
import { ref } from 'vue';
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',
  withCredentials: true
});

export function useClaims() {
  const claims = ref([]);
  const loading = ref(false);
  const error = ref(null);

  const fetchClaims = async () => {
    loading.value = true;
    try {
      const response = await api.get('/api/faculty/claims');
      claims.value = response.data.data;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch claims';
    } finally {
      loading.value = false;
    }
  };

  const submitClaim = async (claimData) => {
    try {
      const response = await api.post('/api/faculty/claims', claimData);
      claims.value.unshift(response.data.data);
      return response.data;
    } catch (err) {
      throw err.response?.data || { error: 'Failed to submit claim' };
    }
  };

  const uploadDocument = async (claimId, file) => {
    const formData = new FormData();
    formData.append('document', file);
    
    try {
      const response = await api.post(
        `/api/faculty/claims/${claimId}/documents`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return response.data;
    } catch (err) {
      throw err.response?.data || { error: 'Failed to upload document' };
    }
  };

  return { claims, loading, error, fetchClaims, submitClaim, uploadDocument };
}
```

### Authentication Flow

```javascript
// Redirect to Google OAuth
function loginWithGoogle() {
  window.location.href = 'http://localhost:3000/auth/google';
}

// After redirect back from Google, session is established
// Check if authenticated:
async function checkAuth() {
  try {
    const response = await api.get('/api/user/me');
    return response.data.data; // User object
  } catch (err) {
    return null; // Not authenticated
  }
}

// Logout
async function logout() {
  await api.get('/auth/logout');
  window.location.href = 'http://localhost:5173/login';
}
```

---

## Support & Issues

For API issues or feature requests, contact the backend development team.
