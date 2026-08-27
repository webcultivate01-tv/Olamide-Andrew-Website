# Olamide

A Next.js website with an admin panel, and a separate Node.js/Express API that
handles admin authentication and the enquiries sent from the public site.

```
olamide/
├── frontend/     Next.js — the public site + the /admin panel
└── backend/      Node.js + Express + MySQL — the API
```

The two run as separate apps and talk over REST, plus one Socket.IO connection
that lets the API push new enquiries to the admin panel as they arrive:

```
Next.js (localhost:3000)  ──►  Express API (localhost:5000)  ──►  MySQL (localhost:3306)
        ▲                                 │
        │                                 └──►  Nodemailer  ──►  admin's inbox
        └────  Socket.IO  ────────────────┘
```

## Getting started

You need Node.js 20+ and a local MySQL server.

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env      # then fill in DB_PASSWORD and the secrets
npm run db:setup          # creates the database, the tables, and the first admin
npm run dev               # http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev               # http://localhost:3000
```

Then open http://localhost:3000/admin/login.

### Development login

```
Email:    admin@gmail.com
Password: Admin123
```

MySQL stores only the bcrypt hash of that password, never the text itself.
Change it before this goes anywhere near production.

## Enquiries

A visitor fills in the form on `/contact`, and it lands in the admin panel
without anyone reloading anything:

```
/contact  ──►  POST /api/enquiries  ──►  validate  ──►  save to MySQL
                                                             │
                                          ┌──────────────────┴───────────┐
                                          ▼                              ▼
                                   status defaults to NEW        emit "new_enquiry"
                                          │                              │
                                          └──────────┬───────────────────┘
                                                     ▼
                                            🔔 in /admin/enquiries
```

The bell count is not a separate flag — it is the number of enquiries still at
status `NEW`. That is what makes it survive a refresh, a new tab or a different
machine, without a notifications table to keep in sync: the count is recomputed
from MySQL every time a page loads, and clears itself when an admin actually
moves an enquiry along rather than merely glancing at it.

An enquiry runs `NEW → CONTACTED → IN_PROGRESS → CONVERTED → CLOSED`.

### Endpoints

| Method | Path | Who |
| --- | --- | --- |
| `POST` | `/api/enquiries` | Public — rate limited to 5 per 15 minutes per IP |
| `GET` | `/api/admin/enquiries` | Admin — `?page=&perPage=&status=&search=` |
| `GET` | `/api/admin/enquiries/stats` | Admin — totals per status, and the unread count |
| `GET` | `/api/admin/enquiries/:id` | Admin |
| `PATCH` | `/api/admin/enquiries/:id/status` | Admin |
| `DELETE` | `/api/admin/enquiries/:id` | Admin |

Everything under `/api/admin` sits behind `requireAuth`, which verifies the JWT
and re-reads the account from MySQL on every request. The Socket.IO handshake
goes through the same check, so an unauthenticated socket cannot subscribe to
the enquiry feed.

### Cookies across domains

The session cookie authenticates both the REST calls and the socket. In
development both apps are on `localhost`, so the default `COOKIE_SAME_SITE=lax`
is fine. If the API and the site end up on **different domains** in production,
that cookie will not be sent at all — set `COOKIE_SAME_SITE=none` (which
requires HTTPS, since `secure` is forced on in production).

## Where things are

| What | Where |
| --- | --- |
| Admin login / OTP / reset screens | `frontend/app/admin/` |
| Enquiry list, filters and detail view | `frontend/app/admin/enquiries/` |
| Notification bell and the socket connection | `frontend/app/admin/_components/` |
| Public enquiry form | `frontend/app/contact/_components/contact-hero.js` |
| Route protection (first pass) | `frontend/proxy.js` |
| Calls to the API | `frontend/lib/api.js` |
| Enquiry SQL | `backend/models/enquiry.model.js` |
| Socket.IO setup and auth | `backend/services/realtime.service.js` |
| Table definitions | `backend/database/migrations/` |
