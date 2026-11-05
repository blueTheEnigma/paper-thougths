# Paper Thoughts (PT) 📖✨

> *An opinionated reading community spanning Zaria, Kaduna, and Abuja. We read heavily, debate fiercely, and never use PDFs. Join us in the lines.*

[![Next.js](https://img.shields.io/badge/Next.js-16.2.2-20070e?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.4-c96a42?style=flat&logo=react&logoColor=white)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-F2A98A?style=flat&logo=tailwindcss&logoColor=black)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon_Serverless-4169e1?style=flat&logo=postgresql&logoColor=white)](https://neon.tech/)
[![Auth.js](https://img.shields.io/badge/Auth-NextAuth_v5-5C1A2E?style=flat&logo=auth0&logoColor=white)](https://authjs.dev/)
[![Watchdog](https://img.shields.io/badge/Watchdog-Passing_100%25-green?style=flat&logo=shield)](./scripts/pt_watchdog.js)
[![Privacy Specification](https://img.shields.io/badge/Privacy-Sovereignty_v1.0-burgundy?style=flat&logo=lock)](./PRIVACY.md)

---

## Table of Contents
- [About Paper Thoughts](#about-paper-thoughts)
- [Core Features & Sanctum Rituals](#core-features--sanctum-rituals)
- [Tech Stack & Architecture](#tech-stack--architecture)
- [🔒 Security, Privacy & Data Sovereignty](#-security-privacy--data-sovereignty)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Quality Assurance & Automated Watchdog](#quality-assurance--automated-watchdog)
- [Sanctuary Chapters](#sanctuary-chapters)
- [Contributing & Colophon](#contributing--colophon)

---

## About Paper Thoughts

**Paper Thoughts** is a bespoke literary clubhouse, digital archive, and physical salon ecosystem designed for dedicated readers and writers across Northern Nigeria and the diaspora.

Blending production-grade modern engineering with tactile, warm parchment aesthetics (burgundy `#20070e`, rich burnt copper `#c96a42`, peach highlights `#F2A98A`, and warm cream `#FBF7EE`), the platform bridges physical chapter gatherings with an online guild economy of **Leaves**, **Milestone Tokens**, and consecrated **LK-IDs**.

---

## Core Features & Sanctum Rituals

### 1. The Living Anthology
A monthly curated literary volume featuring short fiction, essays, and poetry submitted by community writers. Pieces undergo peer critique, automated AI editorial synthesis, and community voting, culminating in permanent consecrated editions and downloadable square/portrait social cards.

### 2. Hardcopy Bookstore & Physical Relics
An integrated physical bookstore powered by Paystack. Readers can redeem accrued **Spendable Leaves** earned through weekly writing streaks and peer reviews for real book discounts and official merchandise delivered across Nigerian chapters.

### 3. The Seedling Onboarding Ritual (`OnboardingSequence.jsx`)
When a reader joins the clubhouse, they experience an interactive 5-act onboarding ceremony:
- **Act 1 & 2:** Tapping the mysterious Archive Egg until it shatters with particle confetti to reveal their seedling Panguin.
- **Act 3 (The Reader's Registry):** Inscribing their permanent **Membership LK-ID** (e.g. `LK-2026-1045`), selecting their Sanctuary Chapter and Birthday, and claiming their unique public **`@alias`** via real-time debounced availability checks.
- **Act 4 & 5:** Unfurling the Three Tenets of the Lore Scrolls before stepping through the 3D Grand Archive Doors into the Manor Dashboard.

### 4. Writers' Village & Weekly Crucible
Interactive writing workspaces tied to weekly prompts, live streak trackers, and peer critiques. The system encourages habitual daily craft through leaf-based incentives and milestone rewards.

### 5. Reader Archetypes & Book Zodiac
Custom literary psychometric tools allowing readers to discover their archetype (e.g., *The Chronicler, The Alchemist, The Scribe*) and sync their profiles with community leaderboards.

---

## Tech Stack & Architecture

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router, Turbopack, and Edge-ready route handlers)
- **Frontend:** [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/)
- **Database:** [Neon Serverless PostgreSQL](https://neon.tech/) hosted on AWS (London `eu-west-2`) using native `pg.Pool` connection pooling
- **Authentication:** [NextAuth v5 (Auth.js)](https://authjs.dev/) with stateless encrypted JWT sessions, Google OAuth, and bcrypt credentials
- **Payment Gateway:** [Paystack](https://paystack.com/) for Nigerian debit cards, bank transfers, and automated webhook verification
- **Communications:** [Resend](https://resend.com/) and [Brevo](https://www.brevo.com/) for transactional emails; Web Push VAPID for browser dispatch
- **AI Synthesis:** Google Gemini AI Interactions API for automated literary reviews and critique synthesis

---

## 🔒 Security, Privacy & Data Sovereignty

Paper Thoughts takes member data sovereignty seriously. We believe reader data should be transparent, minimal, and fiercely protected.

| Dimension | Architectural Specification |
| :--- | :--- |
| **Password Storage** | Hashed with **`bcryptjs`** at **10 salt rounds**. Zero plaintext is ever logged, stored, or visible to admins. |
| **Google OAuth** | Minimal OpenID Connect scopes (`openid`, `email`, `profile`). **No access** to Google Drive, Gmail, or Contacts. |
| **Session Model** | Stateless, encrypted HTTP-only JWT cookies (30-day lifetime) resistant to XSS and CSRF. |
| **Database Security** | Neon Serverless PostgreSQL running in AWS London (`eu-west-2`) with TLS transport and AES-256 disk encryption. |
| **Clerk Status** | **Decommissioned.** Clerk is fully replaced by local NextAuth. Clerk servers receive zero network traffic or user data. |
| **Commercial Isolation** | **Zero ad trackers, zero data broker resale, zero surveillance telemetry.** |

👉 **For the complete architectural breakdown and member rights, read the [Privacy & Data Sovereignty Specification (PRIVACY.md)](./PRIVACY.md).**

---

## Getting Started

### Prerequisites
- **Node.js:** `v20.x` or `v24.x`
- **npm:** `v10.x` or higher
- **PostgreSQL:** Neon or local PostgreSQL instance

### 1. Clone & Install
```bash
git clone https://github.com/blueTheEnigma/paper-thougths.git
cd paper-thougths
npm install
```

### 2. Configure Environment
Copy the example environment settings and populate your keys:
```bash
cp .env.example .env.local  # or edit .env.local directly
```

### 3. Initialize Database
Apply the base schema and permissions:
```bash
# Seed initial tables, chapters, and permissions
npm run watchdog
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to enter the Sanctuary.

---

## Environment Variables

| Variable | Description |
| :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string (`postgresql://...`) |
| `AUTH_SECRET` | NextAuth secret key for encrypting session JWTs |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID for social registration |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Paystack public key for client-side checkout |
| `PAYSTACK_SECRET_KEY` | Paystack secret key for server-side payment verification |
| `RESEND_API_KEY` | Resend API key for transactional emails |
| `GEMINI_API_KEY` | Gemini API key for editorial synthesis |

---

## Quality Assurance & Automated Watchdog

Paper Thoughts maintains a strict zero-regression policy. The automated production watchdog verifies database health, navigation budgets, body scroll locks, and client defensive defaults:

```bash
# Run the automated watchdog health auditor
npm run watchdog
```

---

## Sanctuary Chapters

Paper Thoughts convenes in-person reading circles, book discussions, and live salons across three anchor chapters:

- **Zaria Chapter:** Ahmadu Bello University (ABU) & Samaru Literary Circle
- **Kaduna Chapter:** Central Kaduna Reading Guild
- **Abuja Chapter:** Federal Capital Territory Salon & Living Anthology Circle

RSVPs and schedule updates are published dynamically on the `/events` hub.

---

## Contributing & Colophon

All creative contributions, essays, and code refinements are welcome under community stewardship.

- **Lead Engineer & Creative Director:** [@blueTheEnigma](https://github.com/blueTheEnigma)
- **General Inquiries:** [paperthoughts01@gmail.com](mailto:paperthoughts01@gmail.com)
- **Bug Reports & Issues:** [GitHub Issues](https://github.com/blueTheEnigma/paper-thougths/issues)

*Paper Thoughts © 2026. Built with devotion to the written word.*
