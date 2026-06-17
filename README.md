# Intercontinental Crest — Enterprise Digital Banking Platform

## Overview

A full-stack, production-grade digital banking platform built with Next.js 15, NestJS, PostgreSQL, and Redis.

**Live Demo:** https://intercontinentalcrest.com  
**Tagline:** Global Banking. Trusted Worldwide.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- Git

### 1. Clone & Install

```bash
git clone https://github.com/Hubert24hrs/intercontinentalcrest.git
cd intercontinentalcrest

# Install frontend dependencies
npm install

# Copy environment file
cp .env.example .env
# Edit .env with your values
```

### 2. Run with Docker (Recommended)

```bash
docker-compose up -d
```

Services will be available at:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:4000
- **Postgres:** localhost:5432
- **Redis:** localhost:6379

### 3. Run in Development

```bash
# Frontend
npm run dev

# Opens at http://localhost:3000
```

---

## 📁 Project Structure

```
intercontinental-crest/
├── app/                    # Next.js App Router pages
│   ├── (public)/           # Marketing pages
│   │   ├── page.tsx        # Homepage
│   │   ├── about/
│   │   ├── services/
│   │   ├── loans/
│   │   ├── investments/
│   │   ├── contact/
│   │   ├── faq/
│   │   ├── privacy/
│   │   └── terms/
│   ├── login/              # Auth pages
│   ├── register/
│   ├── dashboard/          # Customer portal
│   │   ├── page.tsx        # Overview with charts
│   │   ├── transfer/       # Fund transfers
│   │   ├── transactions/   # Transaction history
│   │   ├── bills/          # Bill payments
│   │   ├── beneficiaries/  # Manage beneficiaries
│   │   ├── statements/     # Download statements
│   │   └── settings/       # Profile settings
│   └── admin/              # Admin control panel
│       ├── page.tsx        # Admin dashboard
│       ├── customers/      # Customer management
│       ├── transactions/   # Transaction management
│       ├── kyc/            # KYC review workflow
│       ├── loans/          # Loan management
│       ├── investments/    # Investment management
│       ├── audit/          # Audit logs
│       ├── roles/          # Role management
│       └── settings/       # System settings
├── components/             # Reusable React components
│   ├── Header.tsx
│   ├── Footer.tsx
│   └── sections/           # Homepage sections
├── docker/                 # Docker configuration
│   ├── nginx/nginx.conf
│   └── postgres/init.sql
├── docker-compose.yml
├── .env.example
└── tailwind.config.ts
```

---

## 🎨 Design System

| Token | Value |
|---|---|
| Primary | `#00B7F1` (Cyan Blue) |
| Secondary | `#0A2342` (Deep Navy) |
| Accent | `#7DD3FC` (Sky Blue) |
| Font | Inter + Outfit (Google) |

---

## 🔒 Security Features

- JWT + Refresh Token authentication
- Two-Factor Authentication (TOTP)
- Account lockout after 5 failed attempts
- Rate limiting (API & Auth endpoints)
- CSRF protection
- 256-bit AES encryption
- Security headers (HSTS, CSP, X-Frame-Options)
- Bcrypt password hashing (rounds: 12)
- Audit logging for all admin actions
- FDIC insured simulation
- ISO 27001 / PCI DSS compliant architecture

---

## 📊 Pages

### Public Marketing
| Page | Path |
|---|---|
| Homepage | `/` |
| About | `/about` |
| Services | `/services` |
| Loans | `/loans` |
| Investments | `/investments` |
| Contact | `/contact` |
| FAQ | `/faq` |
| Privacy Policy | `/privacy` |
| Terms of Service | `/terms` |

### Authentication
| Page | Path |
|---|---|
| Login (+ 2FA) | `/login` |
| Register (Multi-step) | `/register` |
| Forgot Password | `/forgot-password` |

### Customer Dashboard
| Page | Path |
|---|---|
| Overview | `/dashboard` |
| Fund Transfer | `/dashboard/transfer` |
| Transaction History | `/dashboard/transactions` |
| Bill Payments | `/dashboard/bills` |
| Beneficiaries | `/dashboard/beneficiaries` |
| Statements | `/dashboard/statements` |
| Settings | `/dashboard/settings` |

### Admin Panel
| Page | Path |
|---|---|
| Dashboard | `/admin` |
| Customers | `/admin/customers` |
| Transactions | `/admin/transactions` |
| KYC Management | `/admin/kyc` |
| Loans | `/admin/loans` |
| Investments | `/admin/investments` |
| Audit Logs | `/admin/audit` |
| Roles | `/admin/roles` |
| Settings | `/admin/settings` |

---

## 🛠 Tech Stack

- **Frontend:** Next.js 15, TypeScript, Tailwind CSS, Recharts, Framer Motion
- **Database:** PostgreSQL 15 with full schema
- **Cache:** Redis 7
- **Proxy:** Nginx with SSL + rate limiting
- **Deployment:** Docker Compose

---

## 📄 License

© 2025 Intercontinental Crest. All rights reserved.
