# SwipeList - Complete Local Setup Guide

> **Goal:** Get SwipeList running locally with real database, authentication, and image uploads

---

## Prerequisites

Make sure you have installed:

- [Node.js 18+](https://nodejs.org/) (with npm)
- [Docker Desktop](https://www.docker.com/products/docker-desktop) (for PostgreSQL)
- [Git](https://git-scm.com/) (optional)

---

## Quick Setup (5 minutes)

### Step 1: Start Docker Desktop

Make sure Docker Desktop is running on your computer.

### Step 2: Open Terminal in Project Folder

```bash
cd "C:\Users\sam\Desktop\swipe ads"
```

### Step 3: Run Setup Commands

```bash
# 1. Start PostgreSQL database in Docker
docker run --name swipelist-db -e POSTGRES_USER=swipelist -e POSTGRES_PASSWORD=swipelist123 -e POSTGRES_DB=swipelist -p 5432:5432 -d postgres:16

# 2. Wait 5 seconds for database to start
timeout /t 5

# 3. Install dependencies (this will also generate Prisma client)
npm install

# 4. Push database schema
npx prisma db push

# 5. Seed with test data
npm run db:seed

# 6. Create uploads folder
mkdir public\uploads

# 7. Start development server
npm run dev
```

### Step 4: Open in Browser

Go to: **http://localhost:3000**

---

## What's Included

### Working Features
- Real PostgreSQL database
- User registration & login
- Create/edit/delete listings
- Dynamic category forms (vehicles, real estate, etc.)
- Swipe interface (Tinder-style)
- Favorites system
- Messaging between users
- Image upload to local storage
- Responsive design (mobile + desktop)

### Test Accounts (After Seeding)

| Email | Name | City |
|-------|------|------|
| ana@example.com | Ana Marković | Beograd |
| marko@example.com | Marko Petrović | Novi Sad |
| jovana@example.com | Jovana Nikolić | Niš |

*Note: Any password works for login (simplified for demo)*

---

## Detailed Setup

### Database Options

#### Option A: Docker (Recommended)

```bash
# Start PostgreSQL
docker run --name swipelist-db \
  -e POSTGRES_USER=swipelist \
  -e POSTGRES_PASSWORD=swipelist123 \
  -e POSTGRES_DB=swipelist \
  -p 5432:5432 \
  -d postgres:16

# Verify it's running
docker ps

# Stop database
docker stop swipelist-db

# Start database (next time)
docker start swipelist-db
```

#### Option B: Local PostgreSQL

1. Install PostgreSQL from https://www.postgresql.org/download/
2. Create database named `swipelist`
3. Update `.env.local` with your connection string

### Environment Configuration

The `.env.local` file is already configured for Docker:

```bash
# Database
DATABASE_URL="postgresql://swipelist:swipelist123@localhost:5432/swipelist"
DIRECT_URL="postgresql://swipelist:swipelist123@localhost:5432/swipelist"

# Set to "true" to skip login (auto-use demo user)
DEMO_MODE="false"
```

---

## Daily Workflow

### Starting Development

```bash
# 1. Start Docker Desktop (if not running)

# 2. Start database
docker start swipelist-db

# 3. Start dev server
npm run dev
```

### Stopping

```bash
# Stop dev server: Ctrl+C in terminal

# Stop database (optional)
docker stop swipelist-db
```

---

## Useful Commands

```bash
# Development
npm run dev              # Start dev server (http://localhost:3000)
npm run build            # Build for production
npm run start            # Run production build

# Database
npm run db:generate      # Regenerate Prisma client
npm run db:push          # Push schema changes to database
npm run db:seed          # Reset and seed test data
npm run db:studio        # Open visual database editor

# Docker
docker start swipelist-db   # Start database
docker stop swipelist-db    # Stop database
docker logs swipelist-db    # View database logs
docker stats swipelist-db   # View resource usage
```

---

## Testing Features

### 1. Browse Listings
- Go to homepage: http://localhost:3000
- Click categories to filter
- Use search bar

### 2. Swipe Mode
- Click "Swipe" in bottom nav (mobile) or header (desktop)
- Drag cards left (skip) or right (favorite)
- Or use the buttons below the cards

### 3. Create Listing
- Click "+" or "Postavi oglas"
- Fill in the form
- Note: Different categories show different fields

### 4. Login/Register
- Click profile icon → "Prijavi se"
- Register with any email, or use test accounts

### 5. Favorites
- Heart a listing or swipe right
- View favorites in "Omiljeni" tab

### 6. Messages
- On a listing, click "Pošalji poruku"
- View conversations in "Poruke"

---

## Troubleshooting

### "Cannot connect to database"

```bash
# Check if container is running
docker ps

# Start if stopped
docker start swipelist-db

# Check logs
docker logs swipelist-db
```

### "Port 3000 already in use"

```bash
# Find and kill process using port 3000
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F

# Or use different port:
npm run dev -- -p 3001
```

### "Module not found"

```bash
# Reinstall dependencies
rm -rf node_modules
rm package-lock.json
npm install
```

### "Prisma schema out of sync"

```bash
# Reset database (WARNING: deletes all data)
npx prisma db push --force-reset
npm run db:seed
```

---

## Resource Usage

| Component | Memory | Disk |
|-----------|--------|------|
| PostgreSQL (Docker) | ~100 MB | ~50 MB |
| Node.js (dev) | ~300 MB | - |
| node_modules | - | ~500 MB |
| **Total** | **~400 MB** | **~550 MB** |

---

## Production Build Test

```bash
# Build
npm run build

# Run production server
npm run start

# Open http://localhost:3000
```

Production build uses less memory (~150 MB) and is faster.

---

## Next Steps

1. **Test locally** - Make sure everything works
2. **Give to Gemini** - Share `GEMINI_DESIGN_PROMPT.md` for UI polish
3. **Deploy when ready** - See `LOCAL_DEPLOY.md` for cloud deployment

---

## Files Changed in This Update

| File | Purpose |
|------|---------|
| `server/db.ts` | Prisma client connection |
| `lib/auth.ts` | Cookie-based authentication |
| `server/api/trpc.ts` | tRPC context with real DB |
| `server/api/routers/*.ts` | All routers now use Prisma |
| `server/api/helpers.ts` | Shared helper functions |
| `app/api/auth/*` | Login/register/logout APIs |
| `app/api/upload/route.ts` | Image upload API |
| `app/(auth)/login/page.tsx` | Login page UI |
| `app/(auth)/register/page.tsx` | Register page UI |
| `.env.local` | Updated configuration |
| `package.json` | Pinned Prisma to v5.22 |

---

*Happy coding! 🚀*
