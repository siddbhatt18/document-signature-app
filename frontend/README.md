# Frontend — Document Signature App

A React-based single-page application for uploading, viewing, signing, and sharing PDF documents. Built with Vite, Tailwind CSS, and integrated with the Document Signature REST API.

---

## Tech Stack

| Tool | Purpose |
|---|---|
| [React 19](https://react.dev/) | UI framework |
| [Vite 7](https://vite.dev/) | Build tool & dev server |
| [React Router v7](https://reactrouter.com/) | Client-side routing |
| [Axios](https://axios-http.com/) | HTTP client |
| [React PDF](https://github.com/wojtekmaj/react-pdf) | PDF rendering |
| [React Hook Form](https://react-hook-form.com/) | Form state management |
| [Zod](https://zod.dev/) | Schema validation |
| [@dnd-kit/core](https://dndkit.com/) | Drag-and-drop interactions |
| [React Hot Toast](https://react-hot-toast.com/) | Toast notifications |
| [Tailwind CSS 3](https://tailwindcss.com/) | Utility-first styling |

---

## Project Structure

```
frontend/
├── public/
│   └── vite.svg
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── AuditTrailModal.jsx   # Document activity timeline modal
│   │   ├── Dashboard.jsx         # Main document management view
│   │   ├── DocumentViewer.jsx    # PDF viewer with signature placement
│   │   ├── Login.jsx             # Login form
│   │   ├── PublicSign.jsx        # Public signing page (via share link)
│   │   └── Register.jsx          # Registration form
│   ├── utils/
│   │   └── axiosConfig.js        # Axios instance with base URL & interceptors
│   ├── App.jsx                   # Root component with routing
│   ├── App.css
│   ├── index.css                 # Tailwind directives
│   └── main.jsx                  # React entry point
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── vercel.json                   # SPA rewrite rule for Vercel deployment
└── package.json
```

---

## Getting Started

### Prerequisites

- Node.js >= 20
- Backend server running (see `/backend`)

### Installation

```bash
cd frontend
npm install
```

### Environment Variables

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_URL=http://localhost:5000/api
```

> **Note:** The `VITE_API_URL` variable is also used to resolve the static file base URL for serving uploaded PDFs. If omitted, it falls back to `http://localhost:5000/api`.

### Running the Dev Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

### Building for Production

```bash
npm run build
```

Output is placed in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

---

## Features

### Authentication
- User registration and login via JWT
- Tokens are stored in `localStorage`
- Axios interceptor automatically redirects to `/login` on any `401 Unauthorized` response and clears the stored token

### Dashboard
- Lists all documents belonging to the authenticated user
- Upload PDFs (max 5 MB, PDF only)
- Share a document for external signature via email link
- View document activity log

### Document Viewer
- Renders PDFs using `react-pdf` with pdfjs-dist
- Drag-and-drop signature placeholder to any position on any page
- Save signature position to the backend
- Finalize and embed the signature into the PDF

### Public Signing
- External signers access documents via a tokenized link (`/sign/:token`)
- No account required — the share token is verified server-side
- Full document viewer and signing flow available to external users

### Audit Trail
- Modal timeline showing all recorded actions on a document
- Actions include: Document Uploaded, Document Shared, Signature Placed, Document Finalized
- Color-coded events and timestamps

---

## Routing

| Path | Component | Access |
|---|---|---|
| `/` | `Dashboard` | Protected (requires token) |
| `/login` | `Login` | Public |
| `/register` | `Register` | Public |
| `/sign/:token` | `PublicSign` | Public (token-gated) |

Unauthenticated users are redirected to `/login`. Authenticated users are redirected away from `/login` and `/register` to `/`.

---

## API Configuration

All API calls are made through the centralized Axios instance in `src/utils/axiosConfig.js`:

```js
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});
```

A response interceptor handles session expiry globally — no need to handle `401` errors individually in components.

---

## Deployment

The `vercel.json` file includes a catch-all rewrite rule to support client-side routing on Vercel:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

For other hosting providers, configure your server to serve `index.html` for all routes.

---

## Linting

```bash
npm run lint
```

ESLint is configured with `eslint-plugin-react-hooks` and `eslint-plugin-react-refresh`.
