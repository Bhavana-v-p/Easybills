// routes/claimsRoutes.js (Update POST route)

const { multerUpload, uploadToFirebase } = require('../middleware/uploadMiddleware');

// ... (other routes)

// POST /api/faculty/claims - Enables claim submission and file upload
// Runs in sequence: 1. Auth check, 2. Multer parses form, 3. Uploads to Firebase, 4. Calls controller
router.route('/claims').post(protect, multerUpload, uploadToFirebase, submitClaim); 

// ...