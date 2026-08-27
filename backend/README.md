# Admin Authentication API

Node.js + Express + MySQL. Handles admin login, logout, and the
forgot-password flow (email OTP → reset token → new password).

## Setup

```bash
npm install
cp .env.example .env      # fill in DB_PASSWORD and generate the secrets
npm run db:setup          # migrate + seed, safe to re-run
npm run dev               # http://localhost:5000
```

Generate each secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start with auto-restart on file changes |
| `npm run dev:sqlite` | Same, but on a local SQLite file instead of MySQL (see below) |
| `npm start` | Start normally |
| `npm run db:migrate` | Create the database and tables (skips ones already applied) |
| `npm run db:seed` | Create the first admin (skips if it already exists) |
| `npm run db:seed:case-studies` | Load the four launch case studies (skips ones already there) |
| `npm run db:setup` | All three of the above |

### Running without MySQL

If there is no MySQL server on the machine, `npm run dev` stops at
`Could not connect to MySQL: ECONNREFUSED`. For that case:

```bash
npm run dev:sqlite        # http://localhost:5000
```

That starts the same server with `--import ./dev-sqlite/hooks.mjs`, which
resolves every import of `config/db.js` to `dev-sqlite/sqlite-db.js` instead.
The stand-in exports the same `pool.query(sql, values) -> [rows]` shape mysql2
does and runs the models' real SQL against `dev-sqlite/dev.db`, using the
SQLite that is built into Node. Nothing in the app changes or knows about it -
`config/db.js` is still the MySQL pool for every normal run, and MySQL stays
what production uses.

The tables come from the same files in `database/migrations`, rewritten on the
way in for the few things SQLite spells differently (`AUTO_INCREMENT`, `ENUM`,
`INDEX` inside `CREATE TABLE`, `ON UPDATE CURRENT_TIMESTAMP`). The first admin
is seeded exactly as `npm run db:seed` creates it, so `admin@gmail.com` /
`Admin123` works straight away. `npm run db:migrate` and `npm run db:seed`
still talk to MySQL and are not needed here. Delete `dev-sqlite/dev.db` to
start over.

Startup still prints `MySQL connected: ...` - that line is fixed text in
`server.js` and says nothing about which database answered. The `[sqlite]`
line above it is the one to go by.

### Email during development

Leave `MAIL_HOST` and `MAIL_USER` empty in `.env` and OTP emails are **not**
sent — the code is printed in the backend terminal instead:

```
----------------------------------------
 SMTP not configured - email NOT sent.
 To:  admin@gmail.com
 OTP: 483921
 Valid for 10 minutes.
----------------------------------------
```

That makes the whole reset flow testable before Gmail is set up. To send real
email, fill in the `MAIL_*` values — for Gmail you need a Google App Password,
not your normal account password. Production refuses to start without SMTP
configured.

## Folder layout

```
backend/
├── config/       db.js, mail.js, env.js
├── controllers/  request in, response out
├── services/     the actual logic
├── models/       all the MySQL queries
├── routes/       which URL maps to which controller
├── middleware/   auth, validation, rate limits, errors
├── utils/        jwt, password, otp, response helpers
├── validators/   what each request body must look like
├── database/     migrations + seed
├── uploads/      case study and blog images, served at /uploads (not in git)
├── app.js        builds the Express app
└── server.js     starts it
```

A request travels in one direction:

```
route  →  middleware  →  controller  →  service  →  model  →  MySQL
```

## Database

**admins**

| Column | Notes |
| --- | --- |
| `id` | Primary key |
| `email` | Unique |
| `password_hash` | bcrypt, never the plain password |
| `role` | Defaults to `admin` |
| `is_active` | Set to 0 to disable an account |
| `created_at`, `updated_at` | Timestamps |

**password_reset_otps**

| Column | Notes |
| --- | --- |
| `id` | Primary key |
| `admin_id` | Foreign key to `admins.id`, cascades on delete |
| `otp_hash` | bcrypt hash of the 6 digits |
| `expires_at` | 10 minutes after it was created |
| `attempts` | Wrong guesses so far, max 5 |
| `is_used` | Set once verified, so a code works only once |
| `created_at` | Timestamp |

**case_studies**

| Column | Notes |
| --- | --- |
| `id` | Primary key |
| `title`, `summary` | What the website's grid shows under each image |
| `slug` | Unique, URL-safe; made from the title when the form leaves it blank |
| `client`, `service` | Admin-side detail, also what the panel's search looks through |
| `image_url` | An upload (`/uploads/...`) or a file in the site's `public` folder |
| `image_alt` | Read in place of the image |
| `status` | `DRAFT` or `PUBLISHED` - only published rows reach the website |
| `sort_order` | Lowest first on the grid |
| `published_at` | Stamped on first publish, then left alone |
| `created_at`, `updated_at` | Timestamps |

**blog_posts**

| Column | Notes |
| --- | --- |
| `id` | Primary key |
| `title`, `excerpt` | What the blog index shows on each card |
| `content` | The post itself, as Markdown. Left out of every list response |
| `slug` | Unique, URL-safe; made from the title when the form leaves it blank |
| `author` | Free text, so a post can be credited to a guest |
| `tags` | Comma-separated in the column, an array in the API |
| `cover_image_url` | An upload (`/uploads/...`) or a file in the site's `public` folder |
| `cover_image_alt` | Read in place of the image |
| `reading_time` | Minutes, recalculated from the word count on every save |
| `status` | `DRAFT` or `PUBLISHED` - only published rows reach the website |
| `published_at` | Stamped on first publish, then left alone. Also the sort key |
| `created_at`, `updated_at` | Timestamps |

## API

Base URL: `http://localhost:5000`

Every response has the same shape:

```json
{ "success": true,  "message": "...", "data": {} }
```

```json
{ "success": false, "message": "...", "errors": { "email": "..." } }
```

`errors` only appears on validation failures, and maps a field name to its
message.

---

### POST /api/auth/login

Authentication: not required. Rate limit: 5 failed attempts / 15 min per IP.

Request:

```json
{ "email": "admin@gmail.com", "password": "Admin123" }
```

Response `200`:

```json
{
  "success": true,
  "message": "Login successful",
  "data": { "admin": { "id": 1, "email": "admin@gmail.com", "role": "admin" } }
}
```

Also sets the `admin_token` cookie (HttpOnly, SameSite=Lax, Secure in
production). The token is never in the response body.

Errors: `400` invalid email format or missing field · `401` wrong email or
wrong password (same message either way, on purpose) · `403` account
deactivated · `429` too many failed attempts.

---

### POST /api/auth/logout

Authentication: not required. Clears the cookie.

Response `200`:

```json
{ "success": true, "message": "Logged out successfully." }
```

---

### GET /api/auth/me

Authentication: **required** (cookie).

Used by the admin panel to ask whether a session is really valid — the backend
is the only thing allowed to answer that question.

Response `200`:

```json
{
  "success": true,
  "message": "Authenticated",
  "data": { "id": 1, "email": "admin@gmail.com", "role": "admin" }
}
```

Errors: `401` no cookie, expired token, or the account was disabled.

---

### POST /api/auth/forgot-password

Authentication: not required. Rate limit: 5 / 15 min per IP, and 5 / 15 min
per account.

Request:

```json
{ "email": "admin@gmail.com" }
```

Response `200` — always the same reply, whether or not that email exists:

```json
{ "success": true, "message": "If the email is registered, an OTP has been sent." }
```

That is deliberate. A different reply for an unknown email would let anyone use
this endpoint to discover which addresses have accounts.

Requesting a new code deletes the previous one, so only the newest email works.

Errors: `400` invalid email format · `429` too many requests.

---

### POST /api/auth/verify-otp

Authentication: not required. Rate limit: 10 / 15 min per IP, plus 5 wrong
guesses per code.

Request:

```json
{ "email": "admin@gmail.com", "otp": "483921" }
```

Response `200`:

```json
{
  "success": true,
  "message": "OTP verified successfully.",
  "data": { "resetToken": "eyJhbGciOi...", "expiresIn": "15m" }
}
```

Errors: `400` wrong, expired or already-used code (the message says how many
attempts remain) · `429` five wrong guesses used up, request a new code.

---

### POST /api/auth/reset-password

Authentication: not required, but the reset token from the step above is.
Rate limit: 10 / 15 min per IP.

Request:

```json
{
  "resetToken": "eyJhbGciOi...",
  "newPassword": "NewSecurePass1!",
  "confirmPassword": "NewSecurePass1!"
}
```

Password rules: at least 8 characters, with an uppercase letter, a lowercase
letter, a number and a symbol.

Response `200`:

```json
{ "success": true, "message": "Password reset successfully." }
```

Errors: `400` weak password, passwords do not match, or an invalid / expired /
already-used reset token.

---

### GET /api/admin/profile

Authentication: **required**.

Response `200`:

```json
{
  "success": true,
  "message": "Profile loaded.",
  "data": {
    "admin": {
      "id": 1,
      "email": "admin@gmail.com",
      "role": "admin",
      "isActive": true,
      "createdAt": "2026-08-26T10:00:00.000Z"
    }
  }
}
```

---

### GET /api/admin/dashboard

Authentication: **required**. Returns the admin plus a small account summary.

---

### Case studies

The public pair is read-only and filters on `status = 'PUBLISHED'` in the
query itself, so a draft cannot reach the website even if its address is
guessed. Everything that writes one needs a session.

| Method | Path | Auth | What it does |
| --- | --- | --- | --- |
| GET | `/api/case-studies` | no | Published studies, in display order |
| GET | `/api/case-studies/:slug` | no | One published study |
| GET | `/api/admin/case-studies` | yes | Paged list; `?page=&perPage=&status=&search=` |
| GET | `/api/admin/case-studies/stats` | yes | Counts by status |
| GET | `/api/admin/case-studies/:id` | yes | One study, drafts included |
| POST | `/api/admin/case-studies` | yes | Create; defaults to a draft |
| PATCH | `/api/admin/case-studies/:id` | yes | Update any subset of the fields |
| PATCH | `/api/admin/case-studies/:id/status` | yes | Publish / unpublish only |
| DELETE | `/api/admin/case-studies/:id` | yes | Delete, and remove its uploaded image |
| POST | `/api/admin/case-studies/image` | yes | Upload one image, returns the path to store |

---

### Blog

Same shape as case studies, with three differences worth knowing:

- **Ordering is chronological, not curated.** There is no `sort_order`; posts
  come back newest first by `published_at`, falling back to `created_at` so
  drafts sit sensibly among them.
- **The public list is paged.** A blog grows without limit, so page 1 must not
  get slower every time something is published.
- **Posts carry tags.** They are stored as one comma-separated column and
  handed back as an array. `?tag=` filters on a whole tag, so `brand` does not
  match `brand-strategy`.

The body is Markdown and is left out of every list response - only the two
single-post lookups return `content`.

| Method | Path | Auth | What it does |
| --- | --- | --- | --- |
| GET | `/api/blog` | no | Published posts, newest first; `?page=&perPage=&tag=` |
| GET | `/api/blog/tags` | no | Every tag used by a published post |
| GET | `/api/blog/:slug` | no | One published post, with its body |
| GET | `/api/admin/blog` | yes | Paged list; `?page=&perPage=&status=&tag=&search=` |
| GET | `/api/admin/blog/stats` | yes | Counts by status |
| GET | `/api/admin/blog/tags` | yes | Every tag in use, drafts included |
| GET | `/api/admin/blog/:id` | yes | One post, drafts included |
| POST | `/api/admin/blog` | yes | Create; defaults to a draft |
| PATCH | `/api/admin/blog/:id` | yes | Update any subset of the fields |
| PATCH | `/api/admin/blog/:id/status` | yes | Publish / unpublish only |
| DELETE | `/api/admin/blog/:id` | yes | Delete, and remove its uploaded cover |
| POST | `/api/admin/blog/image` | yes | Upload one image, returns the path to store |

`reading_time` is derived, never sent: it is recalculated from the word count
every time the body is saved, so the stored minutes and the stored words can
never describe different posts.

The two image endpoints are the only multipart ones here. Each takes a single
`image` field, accepts JPEG, PNG, WebP and AVIF up to 4 MB, and stores the file
under a generated name - never the one the browser sent. They write to separate
folders (`uploads/case-studies` and `uploads/blog`), which is what lets a
delete verify that the file it is removing really belongs to that feature.

---

### GET /api/health

No authentication. Confirms the API is up.

---

## Security notes

**Passwords** are hashed with bcrypt (10 rounds), and never logged or returned.

**OTPs** are 6 digits from `crypto.randomInt`, stored as a bcrypt hash, valid
for 10 minutes, allow 5 wrong guesses, are deleted when a new code is
requested, and are marked used the moment they are verified.

**The reset token** exists so `/reset-password` never has to trust an email
address sent by the browser — otherwise anyone reaching that endpoint could
change anyone's password. It is a JWT signed with a *different* secret from the
login token, so the two can never be swapped. It carries the id of the OTP row
that authorised it, and that row is deleted after a successful reset, which is
what makes the token one-time-only.

**The session token** lives in an HttpOnly cookie, so JavaScript in the browser
cannot read it and an XSS bug cannot steal the session. The auth middleware
re-reads the admin from MySQL on every request, so disabling an account takes
effect immediately rather than whenever the token happens to expire.

**SQL injection** is prevented by using `?` placeholders everywhere; no query is
built by joining strings. `multipleStatements` is off, so one query can never
become two.

**Errors** are only described to the client when we threw them on purpose
(`AppError`). Anything else is logged on the server and answered with a generic
message, so stack traces and SQL errors never leak.

**CORS** allows exactly one origin, `FRONTEND_URL`. A `*` origin is not possible
once cookies are involved — browsers reject it.

## Manual test checklist

With both apps running:

- [ ] Log in with `admin@gmail.com` / `Admin123` — lands on the dashboard
- [ ] Log in with the wrong password — "Invalid email or password."
- [ ] Log in with an unregistered email — the *same* message
- [ ] Submit an empty form — per-field validation messages
- [ ] Visit `/admin/dashboard` in a private window — redirected to the login page
- [ ] `curl http://localhost:5000/api/admin/profile` with no cookie — 401
- [ ] Sign out, then press Back — the dashboard is not reachable
- [ ] Forgot password with a registered email — OTP appears in the backend terminal
- [ ] Forgot password with an unregistered email — same reply, no code sent
- [ ] Enter a wrong OTP — error naming the attempts remaining
- [ ] Enter a wrong OTP six times — told to request a new code
- [ ] Request a second code, then try the first one — rejected
- [ ] Enter the correct OTP, then reuse it — rejected
- [ ] Wait 10 minutes, then use the code — rejected
- [ ] Set a weak new password — rejected, naming the rule that failed
- [ ] Set mismatched passwords — "Passwords do not match."
- [ ] Set a valid new password — can log in with it
- [ ] Log in with the old password — fails
