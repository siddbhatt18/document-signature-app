# Backend — Document Signature App

A RESTful API built with Express.js and MongoDB that handles user authentication, PDF document management, signature workflows, and audit logging.

---

## Tech Stack

| Tool | Purpose |
|---|---|
| [Node.js](https://nodejs.org/) | Runtime environment |
| [Express 5](https://expressjs.com/) | Web framework |
| [MongoDB](https://www.mongodb.com/) + [Mongoose 9](https://mongoosejs.com/) | Database & ODM |
| [JSON Web Tokens](https://github.com/auth0/node-jsonwebtoken) | Authentication & share link tokens |
| [bcrypt](https://github.com/kelektiv/node.bcrypt.js) | Password hashing |
| [Multer](https://github.com/expressjs/multer) | PDF file uploads |
| [pdf-lib](https://pdf-lib.js.org/) | Embedding signatures into PDFs |
| [dotenv](https://github.com/motdotla/dotenv) | Environment variable management |
| [cors](https://github.com/expressjs/cors) | Cross-origin resource sharing |
| [nodemon](https://nodemon.io/) | Dev auto-restart *(dev only)* |

---

## Project Structure

```
backend/
├── controllers/
│   ├── auditController.js      # Audit log creation & retrieval
│   ├── authController.js       # User registration & login
│   ├── docController.js        # Document upload, fetch, share & public access
│   └── signatureController.js  # Signature placement & PDF finalization
├── middleware/
│   ├── authMiddleware.js       # JWT verification (supports user & share tokens)
│   └── uploadMiddleware.js     # Multer config — PDF-only, 5 MB limit
├── models/
│   ├── Audit.js                # Audit log schema
│   ├── Document.js             # Document schema
│   ├── Signature.js            # Signature position schema
│   └── User.js                 # User schema
├── routes/
│   ├── auditRoutes.js          # GET /api/audit/:documentId
│   ├── authRoutes.js           # POST /api/auth/register|login
│   ├── docRoutes.js            # Document CRUD & sharing routes
│   └── signatureRoutes.js      # Signature save, fetch & finalize routes
├── uploads/                    # Uploaded & signed PDFs (auto-created at runtime)
├── server.js                   # App entry point
└── package.json
```

---

## Getting Started

### Prerequisites

- Node.js >= 20
- A running MongoDB instance (local or [MongoDB Atlas](https://www.mongodb.com/atlas))

### Installation

```bash
cd backend
npm install
```

### Environment Variables

Create a `.env` file in the `backend/` directory:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/document-signature-app
JWT_SECRET=your_strong_secret_key_here
FRONTEND_URL=http://localhost:5173
```

| Variable | Description |
|---|---|
| `PORT` | Port the server listens on (default: `5000`) |
| `MONGO_URI` | Full MongoDB connection string |
| `JWT_SECRET` | Secret used to sign and verify all JWTs |
| `FRONTEND_URL` | Allowed CORS origin (your frontend URL) |

### Running the Server

```bash
# Development (auto-restart on file changes)
npm run dev

# Production
npm start
```

The API will be available at `http://localhost:5000`.

---

## API Reference

### Auth — `/api/auth`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/register` | Public | Register a new user |
| `POST` | `/login` | Public | Login and receive a JWT |

**Register / Login request body:**
```json
{ "name": "Jane Doe", "email": "jane@example.com", "password": "secret" }
```

**Login response:**
```json
{
  "token": "<jwt>",
  "user": { "id": "...", "name": "Jane Doe", "email": "jane@example.com" }
}
```

---

### Documents — `/api/docs`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/upload` | Protected | Upload a new PDF document |
| `GET` | `/` | Protected | List all documents for the logged-in user |
| `GET` | `/:id` | Protected | Fetch a single document by ID |
| `POST` | `/:id/share` | Protected | Generate a 7-day signing link |
| `GET` | `/public/:token` | Public | Verify a share token and return the document |

> **Note:** The `/public/:token` route is declared **above** `/:id` in the router to prevent Express from matching the literal string `"public"` as a document ID.

---

### Signatures — `/api/signatures`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/` | Protected | Save a signature position (x, y, page) |
| `GET` | `/:documentId` | Protected | Fetch all signatures for a document |
| `POST` | `/finalize` | Protected | Embed all pending signatures into the PDF |

The **finalize** endpoint reads all `pending` signatures for a document, stamps `Signed by: <name>` at each position using `pdf-lib`, updates the document status to `Signed`, and saves the modified PDF back to `uploads/`.

---

### Audit Trail — `/api/audit`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/:documentId` | Protected | Retrieve the full audit log for a document |

Logs are returned newest-first. Each entry captures the action, performer, IP address, and timestamp.

**Tracked actions:**

| Action | Trigger |
|---|---|
| `Document Uploaded` | Successful PDF upload |
| `Document Shared` | Share link generated |
| `Signature Placed` | Signature position saved |
| `Document Finalized` | PDF signed and saved |

---

## Authentication

All protected routes require a `Bearer` token in the `Authorization` header:

```
Authorization: Bearer <jwt>
```

The `authMiddleware.js` verifies the token and attaches the decoded payload to `req.user`. Two token types are supported:

- **User JWT** — issued at login, contains `{ id }`. Used for all authenticated routes.
- **Share JWT** — issued when sharing a document, contains `{ documentId, email }`. Used on public signing routes. External signers are identified by email in audit logs since they have no user account.

All `401` responses trigger automatic logout and redirect on the frontend.

---

## File Uploads

Uploaded files are stored in `backend/uploads/`, which is created automatically if it does not exist.

| Setting | Value |
|---|---|
| Allowed types | `application/pdf` only |
| Max file size | 5 MB |
| Filename format | `<timestamp>-<originalname>` |
| Signed file prefix | `signed-<originalfilename>` |

Files are served as static assets via Express's `express.static` middleware at `/uploads/<filename>`.

---

## Data Models

### User
```
name        String   required
email       String   required, unique
password    String   required, bcrypt-hashed
timestamps
```

### Document
```
userId      ObjectId → User    required
title       String             required
fileName    String             required
filePath    String             required
status      Enum               Pending | Signed | Rejected  (default: Pending)
timestamps
```

### Signature
```
documentId  ObjectId → Document   required
userId      ObjectId → User       required
x           Number                required
y           Number                required
page        Number                required, default: 1
status      Enum                  pending | signed  (default: pending)
timestamps
```

### Audit
```
documentId  ObjectId → Document   required
action      Enum                  Document Uploaded | Document Shared | Signature Placed | Document Finalized
performedBy String                user ID or signer email
ipAddress   String                required
timestamps
```

---

## Security Notes

- Passwords are hashed with `bcrypt` (salt rounds: 10) — plain-text passwords are never persisted.
- JWTs expire after **1 day** (user tokens) or **7 days** (share link tokens).
- CORS is restricted to the origin defined in `FRONTEND_URL`.
- File uploads are validated by MIME type before storage.
