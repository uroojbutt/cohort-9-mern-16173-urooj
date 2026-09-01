# Notesify — MERN Rich-Text Notes Application

Notesify is a full-stack notes management application built with NestJS on the backend and React 19 + Vite on the frontend. It supports JWT authentication, rich-text editing, and bulk import/export of user notes.

## Key Features

*   **Authentication & Authz**: User signup/login with password hashing via `bcrypt` and route protection using `passport-jwt`.
*   **Rich Text Editor**: Powered by Tiptap for full formatting capabilities.
*   **Notes Import/Export**: Export notes to structured JSON files and bulk-import JSON/TXT files with duplicate checking and schema validation.
*   **Logging & Security**: Server logs via `pino-http` / `nestjs-pino`, strict DTO validation with `class-validator`, and security headers via Helmet.

---

## Tech Stack

*   **Backend**: NestJS (v11), TypeScript, Mongoose (MongoDB), Passport.js
*   **Frontend**: React 19, Vite, Tailwind CSS v4, Framer Motion, Tiptap, Axios
*   **Testing**:
    *   Backend: Mocha, Chai, Sinon, NYC
    *   Frontend: Jest, React Testing Library

---

## Project Structure

```text
cohort-9-mern-16173-urooj/
├── backend/                  # NestJS backend
│   ├── src/
│   │   ├── auth/             # Authentication module & guards
│   │   ├── notes/            # Notes CRUD, import/export logic & DTOs
│   │   └── users/            # User management
│   └── test/                 # Mocha test setup & helper files
└── frontend/                 # React 19 application
    └── src/
        ├── api/              # Axios configuration & auth interceptors
        ├── components/       # UI components & route protection
        ├── context/          # State management (AuthContext)
        └── pages/            # Dashboard, Editor, Auth views

```

---

## Getting Started

### Prerequisites

* Node.js (v20+)
* MongoDB (Local or Atlas)

### 1. Backend Setup

```bash
cd backend
npm install

```

Create a `.env` file in `backend/`:

```env
PORT=3000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:5173
USE_CUSTOM_DNS=false

```

Start dev server:

```bash
npm run start:dev

```

Run tests and coverage:

```bash
npm run test
npm run test:cov

```

### 2. Frontend Setup

```bash
cd frontend
npm install

```

Create a `.env` file in `frontend/` (optional, defaults to `http://localhost:3000/api`):

```env
VITE_API_URL=http://localhost:3000/api

```

Start dev server:

```bash
npm run dev

```

Run frontend tests:

```bash
npm run test

```

---

## API Endpoints (`/api`)

| Method | Endpoint | Description | Auth Required |
| --- | --- | --- | --- |
| `POST` | `/auth/signup` | Register new user | No |
| `POST` | `/auth/login` | Authenticate & receive JWT | No |
| `GET` | `/notes` | Fetch all user notes | Yes |
| `POST` | `/notes` | Create a note | Yes |
| `GET` | `/notes/:id` | Get single note by ID | Yes |
| `PUT` | `/notes/:id` | Update note | Yes |
| `DELETE` | `/notes/:id` | Delete note | Yes |
| `GET` | `/notes/export` | Download notes as JSON | Yes |
| `POST` | `/notes/import` | Import notes from file upload | Yes |

---

## Testing

* **Backend**: Tested with Mocha, Chai, and Sinon across services and controllers. Coverage reports are generated using `nyc`. (E2E testing is planned for future iterations).
* **Frontend**: Tested with Jest and React Testing Library for route guards, page behaviors, and editor states.