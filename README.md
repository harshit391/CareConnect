# CareConnect

An e-healthcare platform for discovering and booking healthcare services. Search hospitals and doctors by **location**, **specialization**, and **severity of health conditions** -- with secure authentication, provider verification, and streamlined appointment scheduling.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Frontend Routes](#frontend-routes)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [Architecture](#architecture)
- [Security](#security)
- [Future Enhancements](#future-enhancements)

---

## Features

### For Patients
- Register and login with email verification and password reset
- Location-based hospital and doctor search powered by PostGIS
- Severity-based filtering (Low / Moderate / High) to match appropriate facilities
- Browse specializations with tag-based severity matching
- Book appointments with automatic slot management and transaction-safe booking
- View appointment history, request refunds, and pay fines
- Rate hospitals per speciality with feedback

### For Hospitals & Doctors
- Hospital registration with document upload and admin verification
- Doctor management through parent-child hospital relationships
- Specialization assignment with automatic severity count tracking
- Configure operating hours, fees, max appointments, and emergency status
- Manage free slot dates and appointment workflows

### For Admins
- Approve or reject hospitals and doctors
- Verify uploaded documents
- Manage platform users and providers

### Platform
- JWT authentication with Bearer token middleware on all protected routes
- Rate limiting on authentication endpoints to prevent brute-force attacks
- HTTP security headers via Helmet (CSP, HSTS, X-Frame-Options, etc.)
- Parameterized database queries to prevent SQL injection
- Cryptographically secure verification codes
- Email verification and password reset via Nodemailer
- PDF report generation
- Interactive maps with React Leaflet and Google Maps
- Multiple payment method forms (Credit Card, Debit Card, UPI)
- Progressive Web App (PWA) support

---

## Tech Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| React | 19.0.0 | UI framework |
| TypeScript | 5.7.2 | Type safety |
| Vite | 6.1.0 | Build tool and dev server |
| Tailwind CSS | 4.0.12 | Utility-first styling |
| Material UI (MUI) | 6.4.8 | Component library |
| React Router DOM | 7.3.0 | Client-side routing |
| Axios | 1.8.4 | HTTP client |
| React Leaflet | 5.0.0 | Map integration |
| @vis.gl/react-google-maps | 1.5.2 | Google Maps integration |
| React Toastify | 11.0.5 | Toast notifications |
| jsPDF / html2pdf.js | 3.0.1 / 0.10.3 | PDF generation |
| FontAwesome | 6.7.2 | Icon library |

### Backend

| Technology | Version | Purpose |
|---|---|---|
| Express.js | 4.21.2 | Web framework |
| TypeScript | 5.8.2 | Type safety |
| Prisma ORM | 6.5.0 | Database ORM with migrations |
| PostgreSQL + PostGIS | -- | Database with geospatial support |
| bcryptjs | 3.0.2 | Password hashing |
| jsonwebtoken | 9.0.2 | JWT authentication |
| Nodemailer | 7.0.3 | Email delivery |
| Helmet | latest | HTTP security headers |
| express-rate-limit | latest | Rate limiting |
| date-fns | 4.1.0 | Date utilities |

---

## Project Structure

```
CareConnect/
├── client/                          # React frontend
│   ├── src/
│   │   ├── pages/                   # Page components
│   │   │   ├── Auth/                # Login, register, verification, password reset
│   │   │   ├── Appointment/         # Doctor and patient appointment views
│   │   │   ├── Payment/             # Payment success/cancel
│   │   │   ├── Profile/             # User/Hospital/Admin profiles
│   │   │   └── Services/            # Service listing pages
│   │   ├── components/              # Reusable UI (Navbar, Cards, PaymentForms, Map)
│   │   ├── context/                 # Auth context (global state)
│   │   ├── utils/                   # API helpers, validation, route protection, location
│   │   ├── model/                   # TypeScript interfaces
│   │   ├── App.tsx                  # Router setup
│   │   └── main.tsx                 # Entry point
│   ├── public/                      # Static assets (icons, fonts, images)
│   ├── package.json
│   ├── vite.config.ts               # Vite + PWA config
│   ├── tailwind.config.js
│   └── vercel.json                  # Vercel deployment config
│
├── server/                          # Express backend
│   ├── src/
│   │   ├── controllers/             # Business logic
│   │   │   ├── user.controller.ts
│   │   │   ├── hospital.controller.ts
│   │   │   ├── appointment.controller.ts
│   │   │   ├── speciality.controller.ts
│   │   │   ├── ratings.controller.ts
│   │   │   └── contact.controller.ts
│   │   ├── routes/                  # Route definitions with auth middleware
│   │   │   ├── user.routes.ts
│   │   │   ├── hospital.routes.ts
│   │   │   ├── appointment.routes.ts
│   │   │   ├── speciality.routes.ts
│   │   │   ├── ratings.routes.ts
│   │   │   └── contact.routes.ts
│   │   ├── utils/                   # Auth, error handling, logging, constants
│   │   ├── mailtrap/                # Email templates and sending
│   │   ├── types/                   # DTOs and type definitions
│   │   ├── prisma.ts                # Prisma client singleton
│   │   └── index.ts                 # Server entry point with security middleware
│   ├── prisma/
│   │   ├── schema.prisma            # Database schema
│   │   └── migrations/              # Migration history
│   └── package.json
│
└── README.md
```

---

## Database Schema

```
User ──────────── Appointment ──────────── Hospital
 │                                           │  │
 │                                           │  ├── Hospital (self-relation: parent ↔ children/doctors)
 │                                           │  │
 └── Ratings ──── Speciality ───────────────┘  ├── Document
                       │                        │
                  HospitalSpeciality ───────────┘
                  (many-to-many join)

Feedback (standalone contact form submissions)
```

### Models

| Model | Description |
|-------|-------------|
| **User** | Patients with email, phone, location, role (PATIENT/ADMIN), verification status |
| **Hospital** | Hospitals and doctors (self-relation via `parentId`), with location (PostGIS), timings, fees, approval status |
| **Document** | Uploaded documents for hospital verification (PENDING/APPROVED/REJECTED) |
| **Speciality** | Medical specializations with tags, severity counts, and description |
| **HospitalSpeciality** | Many-to-many join table between Hospital and Speciality |
| **Appointment** | Bookings linking User and Hospital with date, status, pricing, and bank details |
| **Ratings** | Per-speciality ratings with feedback, unique per (hospital, user, speciality) |
| **Feedback** | Contact form submissions (name, phone, email, message) |

### Key Relationships
- Hospital uses a self-relation (`parentId`) -- hospitals are parents, doctors are children
- Hospital <-> Speciality is many-to-many via `HospitalSpeciality`
- Ratings are unique per (hospital, user, speciality) combination
- Hospital `location` uses PostGIS `geometry(Point, 4326)` for spatial queries
- Hospital `currLocation` stores JSON coordinates for distance calculations

---

## API Endpoints

### Users -- `/api/users`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | No | Register a new user |
| POST | `/login` | No | Login with email/phone + password + location |
| POST | `/verify` | No | Verify a JWT token |
| POST | `/forgotpassword` | No | Send password reset code (rate limited) |
| POST | `/verify-reset-code` | No | Verify reset code |
| PUT | `/resetpassword` | No | Reset password |
| GET | `/` | Yes | Get all users |
| GET | `/:id` | Yes | Get user by ID with appointments and ratings |
| POST | `/email/:id` | Yes | Send verification email |
| POST | `/verify/:id` | Yes | Verify email code |
| POST | `/location` | Yes | Update user location (uses token for authorization) |
| PUT | `/:id` | Yes | Update user profile (uses token for authorization) |
| DELETE | `/:id` | Yes | Delete user and related data |

### Hospitals -- `/api/hospitals`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | No | Register hospital or doctor (rate limited) |
| POST | `/login` | No | Login hospital/doctor (rate limited) |
| POST | `/forgotpassword` | No | Send password reset code (rate limited) |
| POST | `/verify-reset-code` | No | Verify reset code |
| PUT | `/resetpassword` | No | Reset password |
| GET | `/` | Yes | List hospitals (geospatial filtering, role/approval filter) |
| GET | `/top` | Yes | Top 8 hospitals by proximity |
| GET | `/doctors` | Yes | Doctors with slots in next 7 days |
| GET | `/doc` | Yes | Get all doctor IDs |
| GET | `/documents/:id` | Yes | Get hospital documents |
| GET | `/:id/timings` | Yes | Get hospital operating hours |
| GET | `/:id` | Yes | Get hospital details with relations |
| POST | `/email/:id` | Yes | Send verification email |
| POST | `/verify/:id` | Yes | Verify email code |
| POST | `/bulk-register` | Yes | Bulk register hospitals/doctors |
| POST | `/register/bulk` | Yes | Alternative bulk registration |
| POST | `/documents/:id` | Yes | Upload document |
| POST | `/location` | Yes | Update hospital location (uses token for authorization) |
| PUT | `/approve/:id` | Yes | Approve hospital (admin) |
| PUT | `/reject/:id` | Yes | Reject hospital (admin) |
| PUT | `/date/:id` | Yes | Update free slot date |
| PUT | `/date` | Yes | Update free slot date (by body) |
| PUT | `/:id/timings` | Yes | Update operating hours |
| PUT | `/:id` | Yes | Update hospital profile |
| DELETE | `/:id` | Yes | Delete hospital |
| DELETE | `/documents/:id` | Yes | Delete document |

### Appointments -- `/api/appointments`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/` | Yes | Create appointment (transaction-safe with slot management) |
| GET | `/` | Yes | Get appointments by status |
| GET | `/byDate` | Yes | Get appointments by date (patient or hospital view) |
| GET | `/:id` | Yes | Get appointment by ID (auto-expires if past due) |
| PUT | `/:id/status` | Yes | Update appointment status (ownership verified) |
| PUT | `/:id/refund` | Yes | Request refund (ownership verified) |
| PUT | `/:id/approve-refund` | Yes | Approve refund |
| PUT | `/:id/reject-refund` | Yes | Reject refund |
| PUT | `/:id/cancel` | Yes | Cancel appointment (ownership verified) |
| PUT | `/:id/pay-fine` | Yes | Pay cancellation fine |

### Specialities -- `/api/speciality`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Yes | List specialities (optional severity filter) |
| GET | `/top` | Yes | Top 8 specialities by severity match |
| GET | `/test` | Yes | Get all speciality IDs |
| GET | `/doctor/:id` | Yes | Get doctor's specialities |
| GET | `/:id` | Yes | Get speciality with associated hospitals |
| POST | `/` | Yes | Create specialities (bulk) |
| PUT | `/doctor/:id` | Yes | Assign speciality to doctor |
| PUT | `/doctors/bulk-specialities` | Yes | Bulk assign specialities |
| DELETE | `/doctor/:id` | Yes | Remove speciality from doctor |

### Ratings -- `/api/ratings`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/` | Yes | Create or update a rating (upsert) |

### Contact -- `/api/contact`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | No | Get all feedback messages |
| POST | `/` | No | Submit contact form |

---

## Frontend Routes

| Path | Access | Page |
|------|--------|------|
| `/` | Public | Landing / Dashboard |
| `/auth` | Public | Auth selection |
| `/auth/user` | Public | User login/register |
| `/auth/hospital` | Public | Hospital login/register |
| `/email-verification/:id` | Public | Email verification |
| `/reset-password` | Public | Password reset |
| `/about` | Public | About page |
| `/services` | Public | Services overview |
| `/services/specialties` | Public | Specialties listing |
| `/services/hospitals` | Public | Hospitals listing |
| `/services/emergency` | Public | Emergency services |
| `/services/appointments` | Public | Instant appointments |
| `/contact` | Public | Contact form |
| `/hospitals` | Public | Browse hospitals |
| `/specializations` | Public | Browse specializations |
| `/specializations/:id` | Public | Speciality details |
| `/hospital/:id` | Public | Hospital details |
| `/doctors/:id` | Public | Doctor details |
| `/checkout/:id` | Protected | Payment checkout |
| `/appointments/:id` | Protected | Appointment details |
| `/dashboard` | Protected | User dashboard |
| `/admin` | Admin | Admin approval panel |
| `/profile/:id` | Admin | Profile management |

### Route Protection

- **UnProtectedRoute** -- Public routes, redirects authenticated users away
- **ProtectedRoute** -- Requires a valid JWT token
- **HighlyProtectedRoute** -- Requires ADMIN role

---

## Getting Started

### Prerequisites

- **Node.js** >= 18.x
- **PostgreSQL** >= 13.x with **PostGIS** extension enabled
- **npm** >= 9.x

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/CareConnect.git
   cd CareConnect
   ```

2. **Install dependencies**
   ```bash
   # Server
   cd server
   npm install

   # Client
   cd ../client
   npm install
   ```

3. **Set up environment variables** (see [Environment Variables](#environment-variables))

4. **Set up the database**
   ```bash
   cd server

   # Enable PostGIS (run in psql)
   # CREATE EXTENSION IF NOT EXISTS postgis;

   # Generate Prisma client and run migrations
   npx prisma generate
   npx prisma migrate dev
   ```

5. **Start development servers**
   ```bash
   # Server (from server/)
   npm run dev

   # Client (from client/)
   npm run dev
   ```

   The server runs on `http://localhost:5000` and the client on `http://localhost:5173`.

---

## Environment Variables

### Server (`server/.env`)

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/careconnect"

# Server
PORT=5000

# Authentication
JWT_SECRET="your-jwt-secret-key"

# CORS
CLIENT_URL="http://localhost:5173"

# Email (SMTP / Mailtrap)
MAIL_HOST="smtp.mailtrap.io"
MAIL_PORT=465
CLIENT_USER="your-smtp-username"
CLIENT_PASS="your-smtp-password"

# Company Info (used in email templates)
COMPANY_ADDRESS="Your Company Address"
COMPANY_CITY="Your City"
COMPANY_ZIP="Your Zip Code"
COMPANY_COUNTRY="Your Country"
```

### Client (`client/.env`)

```env
# API Base URL
VITE_REACT_API_URL="http://localhost:5000/api"

# Google Maps
VITE_GOOGLE_MAPS_API_KEY="your-google-maps-api-key"
```

> **Note:** The server validates that `JWT_SECRET` is set on startup and will exit with an error if it is missing.

---

## Scripts

### Server (`server/`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with nodemon (auto-reload) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled production server |

### Client (`client/`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |

### Prisma (from `server/`)

| Command | Description |
|---------|-------------|
| `npx prisma generate` | Regenerate Prisma client after schema changes |
| `npx prisma migrate dev` | Create and apply new migration |
| `npx prisma studio` | Open Prisma Studio (visual database browser) |

---

## Architecture

```
┌─────────────────────┐         ┌──────────────────────────────────────────┐
│                     │  HTTP   │              Express Server               │
│   React Frontend    │◄───────►│                                          │
│   (Vite + TS)       │  JSON   │  Helmet ──► Rate Limiter ──► CORS        │
│                     │         │       │                                   │
│  Context API State  │         │       ▼                                   │
│  React Router v7    │         │  Routes ──► verifyToken ──► Controllers   │
│  Tailwind + MUI     │         │                               │          │
│  Leaflet + Google   │         │                          Prisma ORM      │
│  Maps               │         │                               │          │
│                     │         │                               ▼          │
│  PWA (Service       │         │                      PostgreSQL +        │
│  Worker)            │         │                        PostGIS           │
└─────────────────────┘         └──────────────────────────────────────────┘
```

### Request Flow

1. **Security Middleware** -- Helmet sets HTTP security headers, rate limiter throttles auth endpoints, CORS restricts origins
2. **Body Parsing** -- `express.json()` with a 10MB size limit
3. **Routing** -- Each route maps an HTTP method and path to a controller function
4. **Authentication** -- `verifyToken` middleware validates the JWT Bearer token and injects `req.idFromToken`
5. **Controllers** -- Business logic with authorization checks (ownership verification on mutations)
6. **Database** -- Prisma ORM with parameterized queries; PostGIS for geospatial operations
7. **Transactions** -- Appointment creation uses `prisma.$transaction()` to prevent race conditions

### Key Design Decisions

- **PostGIS** powers proximity-based hospital search with `ST_DistanceSphere` and `ST_MakePoint`
- **Self-referencing Hospital model** -- hospitals are parents, doctors are children (via `parentId`)
- **JWT tokens** (30-day expiry) are sent as `Authorization: Bearer <token>` headers
- **Email verification** uses cryptographically secure 6-digit codes (`crypto.randomInt`) sent via Nodemailer
- **Severity system** uses tag-based matching on specialities to rank results for Low/Moderate/High conditions

---

## Security

### Implemented Measures

| Layer | Measure | Details |
|-------|---------|---------|
| **HTTP** | Helmet | Sets security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options) |
| **Auth** | Rate limiting | 20 requests per 15-minute window on login, register, and password reset endpoints |
| **Auth** | JWT verification | Bearer token middleware on all protected routes with `idFromToken` extraction |
| **Database** | Parameterized queries | All raw SQL uses Prisma tagged template literals (`$executeRaw` / `$queryRaw`) -- no string interpolation |
| **Database** | Transactions | Appointment booking wrapped in `prisma.$transaction()` to prevent overbooking |
| **Passwords** | bcrypt hashing | All passwords hashed with bcryptjs (salt rounds: 10) before storage |
| **Passwords** | Strength validation | Minimum 8 characters, requires uppercase, lowercase, and number |
| **Verification** | Secure codes | `crypto.randomInt(100000, 999999)` replaces `Math.random()` for email verification codes |
| **API** | Ownership checks | Appointment mutations (refund, cancel, status update) verify the requester owns the resource |
| **API** | Body size limit | `express.json()` limited to 10MB to prevent payload attacks |
| **API** | Password exclusion | Raw SQL queries never SELECT password fields; passwords are never returned in API responses |
| **Frontend** | Open redirect protection | Redirect utility validates that paths are relative (blocks `//evil.com` style attacks) |
| **Frontend** | Environment variables | API keys (Google Maps) loaded from env vars, not hardcoded in source |
| **Startup** | Env validation | Server exits immediately if `JWT_SECRET` is not configured |

---

## Future Enhancements

- AI-driven severity detection during appointment booking
- Payment gateway integration (Razorpay / Stripe)
- Real-time patient triage and automated routing to specialized facilities
- Multi-language support for broader accessibility
- Analytics dashboards for hospitals and doctors
- WebSocket notifications for appointment status updates
- Token refresh mechanism with shorter expiry windows
- Role-based access control (RBAC) middleware for admin-only endpoints
- Audit logging for sensitive operations (password resets, approvals, refunds)
