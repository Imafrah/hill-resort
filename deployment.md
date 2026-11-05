# Deployment & Local Run Guide
## Misty Peaks Estate — Direct-Booking Platform & AI Enquiry Engine

This guide provides instructions for running the project locally, details demo reviewer credentials, lists the required environment variable names, and explains production deployment options.

---

## 1. How to Run Locally (Step by Step)

### Prerequisites
- **Node.js**: v18.18+ or v20+ LTS installed
- **npm**: v9+ or v10+ installed
- **Git**

### Step 1: Clone the Repository & Navigate to Directory
```bash
git clone https://github.com/YOUR_GITHUB_USERNAME/hill-resort.git
cd hill-resort
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Initialize Database & Seed Realistic Sample Data
This command generates the Prisma client, pushes the SQLite schema, and seeds:
- 76 physical keys (64 rooms + 12 villas across 6 room types)
- 540 daily inventory allotment records across 90 days
- 4 staff role profiles
- 4 active promo codes
- Benchmark enquiries including ENQ-4410, ENQ-4411, ENQ-4412, ENQ-4413, and ENQ-4414

```bash
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
```

### Step 4: Run Automated Verification Tests
Run the core test suite to verify the statutory GST tiers (12% vs 18%), benchmark AI classifications, entity extraction, and domain invariants:
```bash
npm test
```
*Expected output: `TEST RESULTS: 35 PASSED, 0 FAILED`.*

### Step 5: Start the Development Server
```bash
npm run dev
```

### Step 6: Open in Your Browser
Open [http://localhost:3000](http://localhost:3000) to view:
- **Guest Booking Website**: `http://localhost:3000/`
- **Room Details & Availability**: `http://localhost:3000/rooms/deluxe-room`
- **Wedding & Event Planner**: `http://localhost:3000/enquiry`
- **Staff Sign-in Page**: `http://localhost:3000/admin/login`
- **Staff Operations & Inbox**: `http://localhost:3000/admin` and `http://localhost:3000/admin/inbox`

---

## 2. Demo Reviewer Sign-In Credentials

The application includes role-based access control. Reviewers can log in at:
**URL:** [http://localhost:3000/admin/login](http://localhost:3000/admin/login)

> **Convenience Feature**: The `/admin/login` page includes **1-Click Quick Login** buttons for all four staff roles. Reviewers can click any role button to sign in instantly without typing.

| Role | Email | Password | Access & Responsibilities |
|---|---|---|---|
| **General Manager (GM)** | `gm@mistypeaks.in` | `admin123` | Full administrative oversight, Unsorted Inbox Lane review, high-priority complaint alerts, master allotment controls. |
| **Reservations Manager** | `reservations@mistypeaks.in` | `admin123` | Room rate calendar, website allotment quotas, room booking enquiries (`room_booking`), PMS booking exports. |
| **Sales Manager** | `sales@mistypeaks.in` | `admin123` | High-value event enquiries (`wedding`, `corporate_offsite`), banquet lawn and conference hall bookings. |
| **Front Office Manager** | `frontdesk@mistypeaks.in` | `admin123` | Guest check-ins, Form C verification at physical reception, complaint resolution (`complaint`). |

---

## 3. Required Environment Variables (Names Only)

As required by the assignment guidelines, only variable names are listed below (never values or secrets):

- `NODE_ENV`
- `DATABASE_URL`
- `GEMINI_API_KEY`
- `NEXT_PUBLIC_APP_URL`

*Note on AI Operation:* The application operates in dual mode. If `GEMINI_API_KEY` is omitted or left empty, the application automatically uses its built-in local NLP heuristic engine (<5ms, zero external dependencies, zero API costs).

---

## 4. Production Cloud Deployment Options

### Option 1: Vercel (Recommended & Fastest)
1. Push the repository to GitHub.
2. In [Vercel](https://vercel.com), click **Add New Project** and import the repository.
3. Configure Build Settings:
   - **Framework Preset**: Next.js
   - **Build Command**: `npx prisma generate && npx prisma db push && npx tsx prisma/seed.ts && next build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`
4. Set Environment Variables in Vercel project dashboard:
   - `DATABASE_URL` (SQLite file or hosted PostgreSQL connection string such as Neon / Supabase)
   - `NEXT_PUBLIC_APP_URL` (Your production domain)
   - `GEMINI_API_KEY` (Optional)
5. Click **Deploy**.

### Option 2: Docker Container (Render / Fly.io / AWS ECS / GCP Cloud Run)
Use the multi-stage Docker build provided in the repository:
```bash
# Build Docker image
docker build -t hill-resort .

# Run container mapping port 3000
docker run -p 3000:3000 -v $(pwd)/prisma:/app/prisma hill-resort
```

### Option 3: Self-Hosted Linux VPS (Ubuntu / Debian with PM2 + Nginx)
1. Provision Ubuntu 22.04 / 24.04 LTS instance with Node.js 20 LTS and Nginx:
   ```bash
   sudo apt update && sudo apt upgrade -y
   sudo apt install -y git curl nginx certbot python3-certbot-nginx
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt install -y nodejs
   sudo npm install -g pm2
   ```
2. Clone repository to `/var/www/hill-resort`, install dependencies, and build:
   ```bash
   cd /var/www
   git clone https://github.com/YOUR_GITHUB_USERNAME/hill-resort.git
   cd hill-resort
   npm install
   npx prisma generate && npx prisma db push && npx tsx prisma/seed.ts
   npm run build
   ```
3. Start application with PM2:
   ```bash
   pm2 start npm --name "hill-resort" -- start
   pm2 save
   pm2 startup
   ```
4. Configure Nginx reverse proxy pointing port 80/443 to `http://127.0.0.1:3000` and issue SSL certificates with Let's Encrypt:
   ```bash
   sudo certbot --nginx -d mistypeaks.yourdomain.com
   ```

---

## 5. Post-Deployment Verification & Smoke Test Checklist

After deployment or local setup, verify the following core flows:

1. **Homepage Check (`/`)**:
   Ensure all 6 room types load with photos, base tariffs, key specs, and statutory GST notices.
2. **Availability & Pricing Calculation (`/rooms/[slug]`)**:
   Select check-in and check-out dates; verify accurate rate calculation and proper GST tier (12% if tariff <= ₹7,500, else 18%).
3. **End-to-End Direct Booking Flow (`/booking`)**:
   Complete Step 1 (Dates), Step 2 (Guest Details), and Step 3 (Test Payment). Verify instant confirmation with booking ID `BK-XXXXXX`.
4. **Allotment Matrix & Overbooking Prevention (`/admin/rates`)**:
   Log in as Reservations Manager or GM. Inspect the 14-day allotment matrix and verify that rooms decrement upon booking.
5. **AI Enquiry Routing & Simulation (`/admin/inbox`)**:
   Open the inbox. Click **+ Simulate Incoming Enquiry**, select the pre-filled *Sister's Wedding (250 pax)* benchmark, and click **Submit Simulation**.
   Verify that:
   - Category is classified as **Wedding**.
   - Confidence score is calculated.
   - Assigned owner is **Sales Manager**.
   - Extracted guest count is **250**.
   - AI pre-drafted reply uses official rate tables without hallucinating prices.
   - Draft is marked as unsent pending human review.
6. **PMS Booking CSV Export (`/admin`)**:
   Click **Export PMS CSV** on the Admin dashboard and verify that the downloaded CSV contains the reservation data formatted for the property management system.
