# Document Signature App

A full-stack web application for uploading, sharing, and digitally signing PDF documents. Users can upload PDFs, invite external signers via tokenized share links, place signatures with a drag-and-drop interface, and track all document activity through a detailed audit trail.

---

## Overview

The application is split into two independently runnable services:

| Folder | Description |
|---|---|
| [`/frontend`](./frontend) | React SPA — document dashboard, PDF viewer, signature placement |
| [`/backend`](./backend) | Express REST API — auth, document management, signing, audit logs |

Each folder contains its own `README.md` with setup instructions, project structure, and detailed API/component documentation.

---

## Tech Stack

### Frontend
| Tool | Purpose |
|---|---|
| React 19 + Vite 7 | UI framework & build tool |
| React Router v7 | Client-side routing |
| Axios | HTTP client with JWT interceptor |
| React PDF + pdfjs-dist | In-browser PDF rendering |
| @dnd-kit/core | Drag-and-drop signature placement |
| React Hook Form + Zod | Form management & validation |
| Tailwind CSS 3 | Utility-first styling |
| React Hot Toast | Toast notifications |

### Backend
| Tool | Purpose |
|---|---|
| Node.js + Express 5 | Runtime & web framework |
| MongoDB + Mongoose 9 | Database & ODM |
| JSON Web Tokens | Auth & share link tokens |
| bcrypt | Password hashing |
| Multer | PDF file upload handling |
| pdf-lib | Embedding signatures into PDFs |

---

## Features

- **User authentication** — Register, login, and JWT-protected sessions
- **Document management** — Upload PDFs, view them in-browser, track status
- **Signature workflow** — Drag-and-drop signature placement with PDF finalization
- **External signing** — Share documents with anyone via a time-limited tokenized link — no account required for signers
- **Audit trail** — Full activity log per document (uploaded, shared, signed, finalized) with performer and timestamp

---

## Project Structure

```
document-signature-app/
├── frontend/               # React SPA (Vite)
│   ├── src/
│   │   ├── components/     # Dashboard, DocumentViewer, Login, Register, PublicSign, AuditTrailModal
│   │   └── utils/          # Axios instance & interceptors
│   ├── .env                # VITE_API_URL
│   └── README.md
├── backend/                # Express REST API
│   ├── controllers/        # Route handler logic
│   ├── middleware/         # Auth & file upload middleware
│   ├── models/             # Mongoose schemas
│   ├── routes/             # Express routers
│   ├── uploads/            # Stored & signed PDFs (auto-created)
│   ├── .env                # PORT, MONGO_URI, JWT_SECRET, FRONTEND_URL
│   └── README.md
└── README.md               # ← You are here
```

---

## Getting Started

### Prerequisites

- **Node.js** >= 20
- **MongoDB** — local instance or [MongoDB Atlas](https://www.mongodb.com/atlas) cluster

### 1. Clone the repository

```bash
git clone https://github.com/your-username/document-signature-app.git
cd document-signature-app
```

### 2. Set up the Backend

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/document-signature-app
JWT_SECRET=your_strong_secret_key_here
FRONTEND_URL=http://localhost:5173
```

Start the backend server:

```bash
npm run dev
```

The API will be available at `http://localhost:5000`.

### 3. Set up the Frontend

Open a new terminal:

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the dev server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Environment Variables

### Backend (`/backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Port for the API server (default: `5000`) |
| `MONGO_URI` | **Yes** | MongoDB connection string |
| `JWT_SECRET` | **Yes** | Secret for signing JWTs — use a long, random string in production |
| `FRONTEND_URL` | **Yes** | Allowed CORS origin |

### Frontend (`/frontend/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | No | Base URL for API calls (default: `http://localhost:5000/api`) |

---

## How It Works

### Authentication
Users register and log in via the API. A JWT is returned on login and stored in `localStorage`. All subsequent API requests include the token in the `Authorization` header. A response interceptor on the frontend automatically clears the session and redirects to `/login` on any `401 Unauthorized` response.

### Document Upload & Viewing
Authenticated users can upload PDF files (max 5 MB) from the dashboard. Uploaded files are stored in `backend/uploads/` and served as static assets. The frontend renders PDFs in-browser using `react-pdf`.

### Signature Placement
Inside the document viewer, users drag a signature placeholder to the desired position on any page. The coordinates and page number are saved to the database. When the user finalizes the document, `pdf-lib` reads the original PDF, stamps a signature annotation at each saved position, writes a new file (`signed-<filename>`), and updates the document status to `Signed`.

### External Signing via Share Link
Document owners can share a document for external signature. The backend generates a JWT containing the `documentId` and the recipient's email, valid for 7 days. The frontend constructs a public link (`/sign/:token`) that allows the recipient to view and sign the document without creating an account. All actions by external signers are recorded in the audit log by email address.

### Audit Trail
Every significant action — upload, share, signature placement, and finalization — is logged with the performer's identity, their IP address, and a timestamp. The full log is accessible from the document dashboard in a modal timeline view.

---

## API Summary

| Group | Base Path | Description |
|---|---|---|
| Auth | `/api/auth` | Register & login |
| Documents | `/api/docs` | Upload, fetch, share, public access |
| Signatures | `/api/signatures` | Place, fetch & finalize signatures |
| Audit | `/api/audit` | Retrieve document activity logs |

See [`/backend/README.md`](./backend/README.md) for full endpoint documentation.

---

## Deployment

### Backend
Deploy to any Node.js-compatible host (Railway, Render, Fly.io, etc.). Ensure all environment variables are set in the hosting platform's config. The `uploads/` directory must be writable — use a persistent disk or replace local storage with a cloud provider such as AWS S3 for production workloads.

### Frontend
Deploy to [Vercel](https://vercel.com) or any static hosting provider. The included `vercel.json` configures a catch-all rewrite for client-side routing:

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

Set `VITE_API_URL` to your deployed backend URL in the hosting platform's environment variable settings.

---

## Development Scripts

### Backend
```bash
npm run dev     # Start with nodemon (auto-restart)
npm start       # Start without nodemon
```

### Frontend
```bash
npm run dev     # Start Vite dev server
npm run build   # Production build → dist/
npm run preview # Preview production build locally
npm run lint    # Run ESLint
```

---

## Security Considerations

- **JWT_SECRET** must be a long, randomly generated string in production — never commit it to version control
- **bcrypt** is used with 10 salt rounds for password hashing
- **CORS** is locked to `FRONTEND_URL` — update this for each deployment environment
- **File uploads** are validated by MIME type; only `application/pdf` is accepted
- **Share link tokens** expire after 7 days; user session tokens expire after 1 day
- For production, consider storing uploaded files in cloud object storage (e.g. S3) rather than the local filesystem
