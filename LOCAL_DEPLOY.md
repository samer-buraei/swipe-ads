# SwipeList - Local Deployment Guide

> **Goal:** Run SwipeList locally with a real database before paying for hosting

---

## Overview

This guide covers:
1. Local PostgreSQL setup (3 options)
2. Database initialization
3. Running in production mode locally
4. Optional: Local SSL for mobile testing
5. Preparing for future cloud deployment

---

## Prerequisites

- Node.js 18+ installed
- pnpm installed (`npm install -g pnpm`)
- Git (optional, for version control)

---

## Step 1: Choose Your Local Database

### Option A: Docker PostgreSQL (Recommended)

**Best for:** Developers who already have Docker

```bash
# Pull and run PostgreSQL
docker run --name swipelist-db \
  -e POSTGRES_USER=swipelist \
  -e POSTGRES_PASSWORD=swipelist123 \
  -e POSTGRES_DB=swipelist \
  -p 5432:5432 \
  -d postgres:16

# Verify it's running
docker ps
```

**Connection string:**
```
DATABASE_URL="postgresql://swipelist:swipelist123@localhost:5432/swipelist"
DIRECT_URL="postgresql://swipelist:swipelist123@localhost:5432/swipelist"
```

### Option B: Native PostgreSQL Installation

**Best for:** Those who prefer direct installation

**Windows:**
1. Download from https://www.postgresql.org/download/windows/
2. Run installer, remember the password you set
3. Open pgAdmin or psql, create database:
```sql
CREATE DATABASE swipelist;
```

**macOS:**
```bash
brew install postgresql@16
brew services start postgresql@16
createdb swipelist
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo -u postgres createdb swipelist
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'swipelist123';"
```

**Connection string:**
```
DATABASE_URL="postgresql://postgres:swipelist123@localhost:5432/swipelist"
```

### Option C: SQLite (Simplest, Limited)

**Best for:** Quick testing only (some features won't work)

Change `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}
```

Then regenerate:
```bash
pnpm db:generate
```

⚠️ **Note:** SQLite doesn't support all PostgreSQL features. Use only for basic testing.

---

## Step 2: Configure Environment

Create `.env.local` in project root:

```bash
# Database
DATABASE_URL="postgresql://swipelist:swipelist123@localhost:5432/swipelist"
DIRECT_URL="postgresql://swipelist:swipelist123@localhost:5432/swipelist"

# App settings
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Optional: Skip auth for local testing
NEXT_PUBLIC_SKIP_AUTH="true"
```

---

## Step 3: Initialize Database

```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm db:generate

# Push schema to database (creates tables)
pnpm db:push

# Seed with test data
pnpm db:seed

# Verify with Prisma Studio (opens in browser)
pnpm db:studio
```

---

## Step 4: Update Routers for Real Database

Currently, routers use the demo store. To use real database:

**Quick approach - Copy this pattern:**

```typescript
// server/api/routers/listing.ts
import { db } from '@/server/db';

// Replace demo store calls with Prisma
export const listingRouter = createTRPCRouter({
  list: publicProcedure
    .input(listListingsSchema)
    .query(async ({ input }) => {
      const listings = await db.listing.findMany({
        where: {
          status: 'ACTIVE',
          ...(input.categoryId && { categoryId: input.categoryId }),
          ...(input.city && { city: input.city }),
        },
        include: {
          images: true,
          user: {
            select: { id: true, name: true, avatarUrl: true, isVerified: true }
          },
        },
        orderBy: { createdAt: 'desc' },
        take: input.limit ?? 20,
      });

      return {
        items: listings.map(transformToListingCard),
        nextCursor: null,
        hasMore: false,
      };
    }),
});
```

**For MVP, you can keep demo store** and just test that the database works:

```typescript
// Add a test endpoint
test: publicProcedure.query(async () => {
  const count = await db.listing.count();
  return { dbConnected: true, listingCount: count };
}),
```

---

## Step 5: Run Production Build Locally

```bash
# Build for production
pnpm build

# Start production server
pnpm start

# App runs at http://localhost:3000
```

---

## Step 6: Access from Mobile (Local Network)

To test on your phone:

### Find Your Local IP

**Windows:**
```bash
ipconfig
# Look for IPv4 Address (e.g., 192.168.1.100)
```

**macOS/Linux:**
```bash
ifconfig | grep "inet "
# Look for 192.168.x.x
```

### Update Next.js to Listen on Network

```bash
# Development
pnpm dev -H 0.0.0.0

# Production
pnpm start -H 0.0.0.0
```

### Access from Phone

1. Connect phone to same WiFi
2. Open browser: `http://192.168.1.100:3000`
3. Test swipe gestures!

---

## Step 7: Optional - Local HTTPS

Some features (like geolocation) require HTTPS. For local testing:

### Using mkcert

```bash
# Install mkcert
# macOS
brew install mkcert
mkcert -install

# Windows (chocolatey)
choco install mkcert
mkcert -install

# Generate certificates
mkcert localhost 192.168.1.100

# Creates localhost+1.pem and localhost+1-key.pem
```

### Configure Next.js for HTTPS

Create `server.js`:
```javascript
const { createServer } = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const httpsOptions = {
  key: fs.readFileSync('./localhost+1-key.pem'),
  cert: fs.readFileSync('./localhost+1.pem'),
};

app.prepare().then(() => {
  createServer(httpsOptions, (req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(3000, '0.0.0.0', () => {
    console.log('> Ready on https://localhost:3000');
  });
});
```

Run with:
```bash
node server.js
```

---

## Step 8: Performance Optimization

For a smooth local experience:

### Database Indexes
Already defined in `schema.prisma` - they'll be created on `db:push`

### Image Optimization
Next.js handles this automatically, but for local:
```javascript
// next.config.js
module.exports = {
  images: {
    remotePatterns: [
      { hostname: 'images.unsplash.com' },
      // Add your image hosts here
    ],
  },
};
```

### Caching
For production, add Redis:
```bash
# Docker
docker run -d --name redis -p 6379:6379 redis:alpine
```

---

## Troubleshooting

### "Cannot connect to database"
- Check PostgreSQL is running: `docker ps` or `pg_isready`
- Verify connection string in `.env.local`
- Try connecting with `psql` or pgAdmin directly

### "Prisma schema out of sync"
```bash
pnpm db:push --force-reset  # WARNING: Deletes all data!
pnpm db:seed
```

### "Port 3000 already in use"
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :3000
kill -9 <PID>
```

### "Module not found"
```bash
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install
```

---

## Preparing for Cloud Deployment

When you're ready to pay for hosting:

### Recommended Stack

| Service | Purpose | Free Tier |
|---------|---------|-----------|
| Vercel | Next.js hosting | Yes |
| Supabase | PostgreSQL + Auth | Yes (500MB) |
| Cloudinary | Image hosting | Yes (25GB) |

### Vercel Deployment

1. Push code to GitHub
2. Connect to Vercel
3. Add environment variables:
   - `DATABASE_URL` (from Supabase)
   - `DIRECT_URL` (from Supabase)
4. Deploy!

### Environment Variables for Production

```bash
# Database (from Supabase)
DATABASE_URL="postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres?pgbouncer=true"

# Auth
NEXT_PUBLIC_SUPABASE_URL="https://[ref].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[key]"
SUPABASE_SERVICE_ROLE_KEY="[key]"

# Image uploads
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="[name]"
CLOUDINARY_API_KEY="[key]"
CLOUDINARY_API_SECRET="[secret]"
```

---

## Local Development Workflow

```bash
# Daily workflow
docker start swipelist-db    # Start database
pnpm dev                     # Start dev server

# After schema changes
pnpm db:push                 # Update database
pnpm db:generate             # Regenerate client

# Before committing
pnpm lint                    # Check for issues
pnpm build                   # Verify build works

# Database management
pnpm db:studio               # Visual editor
pnpm db:seed                 # Reset test data
```

---

## Summary

| Step | Command | Purpose |
|------|---------|---------|
| 1 | `docker run postgres...` | Start database |
| 2 | Create `.env.local` | Configure connection |
| 3 | `pnpm db:push && pnpm db:seed` | Initialize data |
| 4 | `pnpm dev` | Start development |
| 5 | `pnpm build && pnpm start` | Test production |

You now have SwipeList running locally with a real database! 🎉

---

*When ready for cloud deployment, see Vercel + Supabase documentation.*
