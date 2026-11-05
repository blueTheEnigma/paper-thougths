# Paper Thoughts — Privacy & Data Sovereignty Specification

> **Version:** 1.0  
> **Effective Date:** November 2026  
> **Contact:** [paperthoughts01@gmail.com](mailto:paperthoughts01@gmail.com)  
> **Repository:** [github.com/blueTheEnigma/paper-thougths](https://github.com/blueTheEnigma/paper-thougths)

---

## 1. Core Philosophy: The Sanctuary Compact

Paper Thoughts is an opinionated reading and writing community spanning Zaria, Kaduna, and Abuja. We build technology to serve literature, intellectual debate, and human fellowship—not ad networks or surveillance capitalism.

Our data architecture follows three unbending principles:
1. **Data Minimization:** We only collect information required to run the reading community, track literary milestones, and deliver physical book orders.
2. **Zero Commercial Surveillance:** We do not sell, rent, or share personal data with data brokers, ad networks, or telemetry trackers.
3. **Cryptographic Integrity:** Passwords and credentials are never stored in plaintext, sessions are cryptographically signed, and transport is encrypted end-to-end.

---

## 2. Authentication & Credential Architecture

Paper Thoughts operates two primary authentication pathways via **NextAuth v5 (Auth.js)**:

```
┌────────────────────────────────────────────────────────┐
│                   Authentication Gateway               │
└───────────────────────────┬────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            ▼                               ▼
  [ Credentials Flow ]            [ Google OAuth Flow ]
  • Email + Password              • OpenID Connect
  • bcrypt salt rounds = 10       • Scopes: openid, email, profile
  • password_hash column          • password_hash = NULL
            │                               │
            └───────────────┬───────────────┘
                            ▼
              [ NextAuth v5 JWT Session ]
              • Encrypted, HTTP-only cookie
              • Max age: 30 days
```

### A. Credentials Registration (Email + Password)
- **Hashing Algorithm:** Passwords are hashed using **`bcryptjs`** with a work factor of **10 salt rounds** (`bcrypt.hash(password, 10)`).
- **Zero Plaintext:** Passwords are never logged, never stored as plaintext, and are mathematically irrecoverable by database administrators.
- **Verification:** During sign-in, NextAuth compares the user-submitted candidate password against the database hash using `bcrypt.compare`.
- **Database Column:** Stored strictly in the `password_hash` column of the `users` table.

### B. Google OAuth Sign-In
- **Protocol:** Standard **OAuth 2.0 / OpenID Connect (OIDC)** authorization code flow.
- **Scopes Requested:** Absolute bare minimum:
  - `openid` (user verification)
  - `email` (primary contact and account linking)
  - `profile` (initial display name)
- **What We Never Access:** We do **NOT** request, access, or store access to your Google Drive, Gmail, Google Contacts, Calendar, Google Photos, or browser history.
- **Credential Storage:** Users registering via Google OAuth have no password created or stored on our servers (`password_hash` remains `NULL`).

### C. Session Management
- Sessions use **stateless JSON Web Tokens (JWT)** signed with a high-entropy secret (`AUTH_SECRET`).
- Tokens are stored in secure, `HttpOnly`, `SameSite=Lax` browser cookies to mitigate cross-site scripting (XSS) and cross-site request forgery (CSRF) vectors.
- Session lifetime is capped at **30 days**.

---

## 3. Third-Party Integrations & Data Boundaries

| Service | Purpose | Data Shared | What We Receive |
| :--- | :--- | :--- | :--- |
| **Google Identity** | Single Sign-On (OAuth 2.0) | None (Redirected to Google login) | Email address, verified name |
| **Neon / AWS** | Serverless PostgreSQL Database | Encrypted application data | Database hosting & replication |
| **Paystack** | Bookstore & voucher payments | Transaction reference, payment amount | Verification status (Success/Failure) |
| **Resend / Brevo** | Transactional emails & notifications | Recipient email, member name, message body | Delivery status |

### The Clerk Decommission
Paper Thoughts originally utilized Clerk for authentication. As of commit `c805250`, **Clerk has been fully decommissioned** in favor of self-hosted NextAuth v5 and native PostgreSQL storage:
- Custom internal shims (`src/lib/clerk-shims/server.js` and `client.js`) alias historical `@clerk/nextjs` references directly to our local NextAuth session state.
- **Clerk servers receive zero user data, credentials, or session activity today.**
- Any legacy `clerk_id` database columns or `.env` keys exist purely as historical records and receive no external network traffic.

### Payment Data Isolation (Paystack)
When purchasing hardcopy books in the Bookstore or tipping authors:
- Payment is handled directly by **Paystack** via client-side checkout.
- Credit/debit card numbers, CVVs, and bank PINs **never touch Paper Thoughts servers**.
- We store only the Paystack transaction reference ID, payment amount, and order fulfillment status.

---

## 4. What We Store (Database Architecture)

All application data is hosted on **Neon Serverless PostgreSQL** deployed in the **AWS Europe (London) region (`eu-west-2`)**:
- All connections enforce **SSL/TLS encryption in transit** (`sslmode=require`).
- Database disks are **encrypted at rest** using AES-256 standard on AWS infrastructure.

### Data Inventory by Category

#### 1. Member Profile & Identity (`users` table)
- `email`: Required for account identification and notifications.
- `full_name`: Your real name or preferred display name.
- `alias`: Your unique public clubhouse handle (e.g., `@foluso_reads`), chosen during onboarding.
- `lk_id`: Sequential guild membership serial number (e.g., `LK-2026-1045`), used for internal ledger mapping and referral links.
- `chapter_id`: Your local community chapter (`Zaria (ABU)`, `Kaduna`, `Abuja`, or `Other`).
- `birthday`: Optional date used exclusively for sanctuary birthday honors and annual leaves conferral.
- `whatsapp`: Cleaned contact number for chapter gathering dispatches and reading circle alerts.
- `instagram`: Optional public handle for literary attribution.
- `preferred_genres`: Array of reading tastes (e.g., *Fiction, Memoir, Poetry*).

#### 2. Literary Activity & Sanctuary Economy
- **Milestone Tokens & Leaves:** `milestone_tokens`, `spendable_leaves`, `lifetime_leaves`, `writing_streak`.
- **Submissions & Editorial:** Drafts, story manuscripts, poetry submissions, and revision histories submitted to the Living Anthology.
- **Reviews & Critiques:** Reviews written for community pieces, AI synthesis feedback, and salon comments.
- **Physical Events:** RSVP statuses, attendance corroborate confirmations, and herald records.

---

## 5. Member Rights & Data Sovereignty

Every Paper Thoughts member maintains complete authority over their personal data:

1. **Profile Modification:** You can update your Full Name, Alias, Chapter, WhatsApp, Birthday, and Preferred Genres at any time directly in the **Dashboard Settings** tab.
2. **Pseudonymity & Pen Names:** Members may write and critique under their chosen `@alias` or distinct piece-specific pen names without revealing their legal identity.
3. **Account Deletion & Data Erasure:** If you wish to delete your account, contact sanctuary administration at [paperthoughts01@gmail.com](mailto:paperthoughts01@gmail.com). Upon verification:
   - Your email, password hash, WhatsApp number, and personal profile data will be permanently purged from the database.
   - Any published contributions in finalized physical Anthology volumes remain under their respective author copyright terms.
4. **Data Portability:** You can request a machine-readable export (`JSON`) of your submissions, reviews, and transaction ledger by writing to our support inbox.

---

## 6. Security Inquiries & Contact

If you have questions about this privacy specification, discover a security vulnerability, or wish to exercise your data rights:

- **Email:** [paperthoughts01@gmail.com](mailto:paperthoughts01@gmail.com)
- **Lead Administrator:** [umorgan2001@gmail.com](mailto:umorgan2001@gmail.com)
- **GitHub Issues:** [github.com/blueTheEnigma/paper-thougths/issues](https://github.com/blueTheEnigma/paper-thougths/issues)

