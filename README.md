# Care Connect

An e-healthcare platform for discovering and booking healthcare services. Search hospitals and doctors by **location**, **specialization**, and **severity of health conditions** — with secure authentication, provider verification, and streamlined appointment scheduling.

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
- [Future Enhancements](#future-enhancements)

---

## Features

**For Patients**
- Register/login with email verification and password reset
- Location-based hospital and doctor search powered by PostGIS
- Severity-based filtering (Low / Moderate / High) to match appropriate facilities
- Browse specializations with tag-based severity matching
- Book appointments with automatic slot management
- View appointment history, request refunds, and pay fines
- Rate hospitals per speciality with feedback

**For Hospitals & Doctors**
- Hospital registration with document upload and admin verification
- Doctor management through parent-child hospital relationships
- Specialization assignment with automatic severity count tracking
- Configure operating hours, fees, max appointments, and emergency status
- Manage free slot dates and appointment workflows

**For Admins**
- Approve or reject hospitals and doctors
- Verify uploaded documents
- Manage platform users and providers

**Platform**
- JWT authentication with Bearer token middleware on all protected routes
- Email verification and password reset via Mailtrap/Nodemailer
- PDF report generation
- Interactive maps with React Leaflet
- Multiple payment method forms (Credit Card, Debit Card, UPI, Net Banking)

---

## Tech Stack

### Frontend

| Technology | Version |
|---|---|
| React | 19.0.0 |
| TypeScript | 5.7.2 |
| Vite | 6.1.0 |
| Tailwind CSS | 4.0.12 |
| Material UI (MUI) | 6.4.8 |
| React Router DOM | 7.3.0 |
| Axios | 1.8.4 |
| React Leaflet | 5.0.0 |
| React Toastify | 11.0.5 |
| jsPDF | 3.0.1 |

### Backend

| Technology | Version |
|---|---|
| Express.js | 4.21.2 |
| TypeScript | 5.8.2 |
| Prisma ORM | 6.5.0 |
| PostgreSQL + PostGIS | — |
| bcryptjs | 3.0.2 |
| jsonwebtoken | 9.0.2 |
| Nodemailer | 7.0.3 |
| date-fns | 4.1.0 |

---

## Project Structure

```
CareConnect/
├── client/                          # React frontend
│   ├── src/
│   │   ├── pages/                   # Page components
│   │   │   ├── Auth/                # Login, register, verification, password reset
│   │   │   ├── Appointment/         # Appointment views
│   │   │   ├── Payment/             # Payment success/cancel
│   │   │   ├── Profile/             # User/Hospital/Admin profiles
│   │   │   └── Services/            # Service listing pages
│   │   ├── components/              # Reusable UI (Navbar, Cards, PaymentForms, Map)
│   │   ├── context/                 # Auth context (global state)
│   │   ├── utils/                   # API helpers, validation, route protection
│   │   ├── model/                   # TypeScript interfaces
│   │   ├── App.tsx                  # Router setup
│   │   └── main.tsx                 # Entry point
│   ├── package.json
│   └── vite.config.ts
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
│   │   ├── routes/                  # Thin route wrappers with auth middleware
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
│   │   └── index.ts                 # Server entry point
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

**Models:** User, Hospital, Document, Speciality, HospitalSpeciality, Appointment, Ratings, Feedback

**Key relationships:**
- Hospital uses a self-relation (`parentId`) — hospitals are parents, doctors are children
- Hospital ↔ Speciality is many-to-many via `HospitalSpeciality`
- Ratings are unique per (hospital, user, speciality) combination
- Hospital `location` uses PostGIS `geometry(Point, 4326)` for spatial queries

---

## API Endpoints

### Users — `/api/users`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | No | Register a new user |
| POST | `/login` | No | Login with email/phone + password |
| POST | `/verify` | No | Verify a JWT token |
| POST | `/forgotpassword` | No | Send password reset code |
| POST | `/verify-reset-code` | No | Verify reset code |
| PUT | `/resetpassword` | No | Reset password |
| GET | `/` | Yes | Get all users |
| GET | `/:id` | Yes | Get user by ID with appointments and ratings |
| POST | `/email/:id` | Yes | Send verification email |
| POST | `/verify/:id` | Yes | Verify email code |
| POST | `/location` | Yes | Update user location |
| PUT | `/:id` | Yes | Update user profile |
| DELETE | `/:id` | Yes | Delete user and related data |

### Hospitals — `/api/hospitals`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | No | Register hospital or doctor |
| POST | `/login` | No | Login hospital/doctor |
| POST | `/forgotpassword` | No | Send password reset code |
| POST | `/verify-reset-code` | No | Verify reset code |
| PUT | `/resetpassword` | No | Reset password |
| GET | `/` | Yes | List hospitals (with geospatial filtering) |
| GET | `/top` | Yes | Top 8 hospitals by proximity |
| GET | `/doctors` | Yes | Doctors with slots in next 7 days |
| GET | `/doc` | Yes | Get all doctor IDs |
| GET | `/documents/:id` | Yes | Get hospital documents |
| GET | `/:id/timings` | Yes | Get hospital operating hours |
| GET | `/:id` | Yes | Get hospital details with relations |
| POST | `/email/:id` | Yes | Send verification email |
| POST | `/verify/:id` | Yes | Verify email code |
| POST | `/bulk-register` | Yes | Bulk register hospitals/doctors |
| POST | `/documents/:id` | Yes | Upload document |
| POST | `/location` | Yes | Update hospital location |
| PUT | `/approve/:id` | Yes | Approve hospital (admin) |
| PUT | `/reject/:id` | Yes | Reject hospital (admin) |
| PUT | `/date/:id` | Yes | Update free slot date |
| PUT | `/:id/timings` | Yes | Update operating hours |
| PUT | `/:id` | Yes | Update hospital profile |
| DELETE | `/:id` | Yes | Delete hospital |
| DELETE | `/documents/:id` | Yes | Delete document |

### Appointments — `/api/appointments`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/` | Yes | Create appointment |
| GET | `/` | Yes | Get appointments by status |
| GET | `/byDate` | Yes | Get appointments by date (patient or hospital view) |
| GET | `/:id` | Yes | Get appointment by ID (auto-expires if past due) |
| PUT | `/:id/status` | Yes | Update appointment status |
| PUT | `/:id/refund` | Yes | Request refund |
| PUT | `/:id/approve-refund` | Yes | Approve refund |
| PUT | `/:id/reject-refund` | Yes | Reject refund |
| PUT | `/:id/cancel` | Yes | Cancel appointment |
| PUT | `/:id/pay-fine` | Yes | Pay cancellation fine |

### Specialities — `/api/speciality`

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

### Ratings — `/api/ratings`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/` | Yes | Create or update a rating (upsert) |

### Contact — `/api/contact`

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

---

## Getting Started

### Prerequisites

- **Node.js** >= 16.x
- **PostgreSQL** >= 13.x with **PostGIS** extension enabled
- **Prisma CLI** (`npx prisma`)

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

Create a `.env` file in the `server/` directory:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/careconnect"
PORT=5000
JWT_SECRET="your-jwt-secret"
CLIENT_URL="http://localhost:5173"

# Mailtrap / SMTP
MAIL_HOST="smtp.mailtrap.io"
MAIL_PORT=465
CLIENT_USER="your-smtp-username"
CLIENT_PASS="your-smtp-password"
```

---

## Scripts

### Server (`server/`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with nodemon |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled server |

### Client (`client/`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

---

## Architecture

```
┌─────────────────────┐         ┌─────────────────────────────────────┐
│                     │  HTTP   │              Express Server          │
│   React Frontend    │◄───────►│                                     │
│   (Vite + TS)       │  JSON   │  Routes ──► Controllers ──► Prisma  │
│                     │         │    │                          │      │
│  Context API State  │         │  verifyToken              Singleton  │
│  Axios HTTP Client  │         │  (JWT middleware)             │      │
│  React Router v7    │         │                              ▼      │
│  Tailwind + MUI     │         │                     PostgreSQL +    │
│  Leaflet Maps       │         │                       PostGIS       │
└─────────────────────┘         └─────────────────────────────────────┘
```

- **Routes** are thin wrappers — each maps HTTP method + path to a controller function, with `verifyToken` middleware on protected endpoints
- **Controllers** contain all business logic and database operations via the Prisma singleton
- **PostGIS** powers geospatial queries (`ST_DistanceSphere`, `ST_MakePoint`) for proximity-based hospital search
- **JWT tokens** (30-day expiry) are sent as `Authorization: Bearer <token>` headers
- **Email verification** uses 6-digit codes sent via Nodemailer/Mailtrap

---

## Future Enhancements

- AI-driven severity detection during appointment booking
- Payment gateway integration (Razorpay/Stripe)
- Real-time patient triage and automated routing to specialized facilities
- Multi-language support for broader accessibility
- Analytics dashboards for hospitals and doctors
- WebSocket notifications for appointment status updates
