# Deployment Guide
## Misty Peaks Estate — Direct-Booking Website & AI Enquiry Routing Engine

This guide provides step-by-step instructions for deploying the **Misty Peaks Estate** web application to production across three common environments:
1. **Option 1: Vercel (Recommended & Fastest)**
2. **Option 2: Docker Container (Render / Fly.io / AWS ECS / GCP Cloud Run)**
3. **Option 3: Self-Hosted Linux VPS (Ubuntu / Debian with PM2 + Nginx)**

---

## 1. Environment Variables Configuration

Create a `.env.production` (or configure in your cloud host's Environment Variables dashboard):

```env
# Node Environment
NODE_ENV="production"

# Database Connection (Default: local SQLite database file)
DATABASE_URL="file:./dev.db"

# Optional: Set this if you wish to enable live Gemini 1.5 Flash LLM routing.
# If omitted or left empty, the application automatically runs the built-in local NLP engine.
GEMINI_API_KEY=""

# Public Application URL (Used for canonical links & redirects)
NEXT_PUBLIC_APP_URL="https://mistypeaks.yourdomain.com"
```

---

## 2. Option 1: Deploying to Vercel (Recommended)

Vercel is the native hosting platform for Next.js and provides instant deployment with global edge CDN caching.

### Step 1: Push Code to GitHub
Ensure all code is committed and pushed to your GitHub repository:
```bash
git add .
git commit -m "feat: production-ready hill resort booking platform"
git push origin main
```

### Step 2: Database Strategy on Vercel
Because Vercel Serverless Functions have an ephemeral filesystem, if you use Vercel Serverless, choose one of these two database approaches:

#### Approach A: Managed PostgreSQL (Recommended for Serverless)
1. Provision a free PostgreSQL database on [Supabase](https://supabase.com) or [Neon](https://neon.tech).
2. In [`prisma/schema.prisma`](prisma/schema.prisma), change the datasource provider:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
3. Set `DATABASE_URL` in your Vercel project environment settings to your Supabase/Neon connection string (e.g. `postgresql://user:pass@ep-xyz.neon.tech/neondb?sslmode=require`).

#### Approach B: SQLite on Vercel
For evaluation demos, Prisma SQLite works out of the box when packaged with the build. Run the seed script as part of your build command.

### Step 3: Configure Vercel Project
1. Log in to [Vercel](https://vercel.com) and click **Add New Project**.
2. Import your GitHub repository (`hill-resort`).
3. Set the build settings:
   - **Framework Preset**: Next.js
   - **Build Command**: `npx prisma generate && npx prisma db push && npx tsx prisma/seed.ts && next build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`
4. Click **Deploy**.

---

## 3. Option 2: Docker / Container Deployment

Deploying via Docker is ideal for platforms with persistent storage (e.g. **Fly.io**, **Render**, **Railway**, **AWS ECS**, or **GCP Cloud Run**).

### Step 1: Create `Dockerfile` in Project Root

```dockerfile
# Multi-stage production Dockerfile
FROM node:20-alpine AS base

# Step 1: Install dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Step 2: Build application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client and build Next.js
RUN npx prisma generate
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Step 3: Production runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node_modules/.bin/next", "start"]
```

### Step 2: Build & Run Docker Locally
```bash
# Build the Docker image
docker build -t hill-resort .

# Run the container mapping port 3000
docker run -p 3000:3000 -v $(pwd)/prisma:/app/prisma hill-resort
```

---

## 4. Option 3: Self-Hosted Linux VPS (Ubuntu / Debian)

This setup uses Node 20, PM2 process manager, SQLite on persistent SSD, and Nginx with Let's Encrypt SSL.

### Step 1: Server Provisioning
On your Ubuntu 22.04 / 24.04 LTS instance:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl nginx certbot python3-certbot-nginx

# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

### Step 2: Clone and Build Project
```bash
# Clone to /var/www
cd /var/www
git clone https://github.com/YOUR_GITHUB_USERNAME/hill-resort.git
cd hill-resort

# Install dependencies and build
npm install
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
npm run build
```

### Step 3: Start with PM2
```bash
# Start background process
pm2 start npm --name "hill-resort" -- start

# Save PM2 process list to restart automatically on reboot
pm2 save
pm2 startup
```

### Step 4: Configure Nginx Reverse Proxy
Create `/etc/nginx/sites-available/mistypeaks.conf`:
```nginx
server {
    listen 80;
    server_name mistypeaks.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/mistypeaks.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 5: Enable SSL with Let's Encrypt
```bash
sudo certbot --nginx -d mistypeaks.yourdomain.com
```

---

## 5. Post-Deployment Verification & Smoke Tests

After deployment, perform these 5 verification checks:

1. **Homepage Check**:
   - Visit `https://your-domain.com/` and ensure all 6 room types render with pictures, starting rates, and proper GST labels (+12% or +18%).
2. **Booking Concurrency Test**:
   - Navigate to `/rooms/deluxe-room`, select dates, and proceed through checkout to confirmation.
   - Verify that booking ID `BK-XXXXXX` is created.
3. **Admin Dashboard & CSV Export**:
   - Navigate to `/admin`.
   - Click **Export CSV** and verify that the downloaded file contains the new reservation record.
4. **Allotment Management**:
   - Navigate to `/admin/rates` and confirm the 14-day calendar grid loads with room allotments and rates.
5. **AI Enquiry Pipeline**:
   - Navigate to `/admin/inbox`.
   - Click **Simulate Incoming Enquiry** $\rightarrow$ Click *Sister's Wedding (250 pax)* $\rightarrow$ Submit.
   - Verify it appears in the inbox categorized under **Wedding** and assigned to the **Sales Manager**.

---

## 6. Backup & Recovery

- **SQLite Database**: The database is stored at `prisma/dev.db`. Set up a daily cron job to back up this file:
  ```bash
  sqlite3 /var/www/hill-resort/prisma/dev.db ".backup '/var/backups/hill-resort-$(date +\%F).db'"
  ```
- **Prisma Migrations**: For production schema updates:
  ```bash
  npx prisma db push
  ```

