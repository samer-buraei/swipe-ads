# MVP_BACKLOG.md - SwipeList Development Backlog

> 6-week sprint to MVP. Tasks ordered by dependency and priority.

## Sprint Overview

| Week | Focus | Key Deliverables |
|------|-------|------------------|
| 1 | Foundation | Auth, DB, basic UI shell |
| 2 | Core Listings | Create, view, browse listings |
| 3 | Search & Swipe | Meilisearch, swipe UI, favorites |
| 4 | Messaging | Conversations, notifications |
| 5 | Moderation & Polish | Auto-mod, reports, UX polish |
| 6 | Deploy & Test | Production deploy, bug fixes |

---

## Week 1: Foundation

### W1.1 - Project Setup [Architect]
- [ ] Initialize Next.js 15 with App Router
- [ ] Configure TypeScript strict mode
- [ ] Set up Tailwind + shadcn/ui
- [ ] Initialize Prisma with Supabase
- [ ] Set up tRPC v11
- [ ] Create folder structure per CLAUDE.md
- [ ] Configure ESLint + Prettier

**Acceptance:** `pnpm dev` runs, TypeScript compiles, basic page renders

### W1.2 - Database Schema [Architect]
- [ ] Finalize schema.prisma (all models)
- [ ] Create seed script with test data
- [ ] Run initial migration
- [ ] Verify indexes are optimal

**Acceptance:** `pnpm db:push` works, `pnpm db:seed` creates test data

### W1.3 - Authentication [Backend]
- [ ] Configure Supabase Auth
- [ ] Create auth middleware for tRPC
- [ ] Implement `user.me` endpoint (current user)
- [ ] Implement `user.update` endpoint
- [ ] Handle auth state in frontend

**Acceptance:** User can sign up, log in, see their profile

### W1.4 - Auth UI [Frontend]
- [ ] Login page (`/login`)
- [ ] Register page (`/register`)
- [ ] Auth provider wrapper
- [ ] Protected route wrapper
- [ ] User menu component (avatar, dropdown)

**Acceptance:** Full auth flow works end-to-end

### W1.5 - Layout Shell [Frontend]
- [ ] Root layout with navigation
- [ ] Mobile bottom navigation
- [ ] Desktop sidebar navigation
- [ ] Header component
- [ ] Loading states (skeletons)

**Acceptance:** App has consistent navigation, mobile-responsive

---

## Week 2: Core Listings

### W2.1 - Listing CRUD Backend [Backend]
- [ ] `listing.create` - create new listing
- [ ] `listing.update` - edit own listing
- [ ] `listing.delete` - soft delete (set status)
- [ ] `listing.get` - get by ID or slug
- [ ] `listing.list` - paginated list with filters
- [ ] `listing.myListings` - current user's listings

**Acceptance:** All CRUD operations work via tRPC

### W2.2 - Image Upload [Backend]
- [ ] Supabase Storage bucket setup
- [ ] `image.getUploadUrl` - presigned URL
- [ ] `image.confirmUpload` - process after upload
- [ ] Image resizing (thumb, medium, full)
- [ ] Image validation (type, size)

**Acceptance:** Images upload, resize, and link to listings

### W2.3 - Listing Form [Frontend]
- [ ] Multi-step form component
- [ ] Step 1: Category selection
- [ ] Step 2: Title, description, price
- [ ] Step 3: Condition, location
- [ ] Step 4: Image upload (drag & drop)
- [ ] Step 5: Review & submit
- [ ] Form validation with Zod

**Acceptance:** User can create listing through guided flow

### W2.4 - Listing Detail Page [Frontend]
- [ ] Image gallery/carousel
- [ ] Listing info display
- [ ] Seller card with contact
- [ ] Share button
- [ ] Report button
- [ ] Similar listings section (later)

**Acceptance:** `/listing/[slug]` shows full listing details

### W2.5 - Browse Grid [Frontend]
- [ ] ListingCard component
- [ ] ListingGrid component
- [ ] Infinite scroll pagination
- [ ] Loading skeletons
- [ ] Empty state

**Acceptance:** Home page shows listing grid with pagination

### W2.6 - Categories [Backend + Frontend]
- [ ] Seed 8 main categories
- [ ] `category.list` endpoint
- [ ] Category filter chips
- [ ] Category page (`/category/[id]`)

**Acceptance:** Can browse by category

---

## Week 3: Search & Swipe

### W3.1 - Meilisearch Setup [DevOps]
- [ ] Docker config for Meilisearch
- [ ] Index configuration
- [ ] Sync script (Prisma → Meilisearch)
- [ ] Real-time sync on listing changes

**Acceptance:** Listings sync to Meilisearch automatically

### W3.2 - Search Backend [Backend]
- [ ] `listing.search` endpoint using Meilisearch
- [ ] Typo tolerance config
- [ ] Faceted search (category, price, city)
- [ ] Geo search (within radius)
- [ ] Highlighting in results

**Acceptance:** Search returns relevant results with facets

### W3.3 - Search UI [Frontend]
- [ ] Search bar component
- [ ] Search results page
- [ ] Filter sidebar/drawer
- [ ] Active filters display
- [ ] No results state

**Acceptance:** User can search and filter listings

### W3.4 - Favorites Backend [Backend]
- [ ] `favorite.toggle` - add/remove favorite
- [ ] `favorite.list` - user's favorites
- [ ] `favorite.check` - is listing favorited
- [ ] Include `isFavorited` in listing responses

**Acceptance:** Favorite operations work

### W3.5 - Favorites UI [Frontend]
- [ ] Heart button on ListingCard
- [ ] Favorites page (`/favorites`)
- [ ] Empty favorites state
- [ ] Optimistic updates

**Acceptance:** User can favorite and view favorites

### W3.6 - Swipe Backend [Backend]
- [ ] `swipe.record` - record swipe event
- [ ] `swipe.getDeck` - get cards for swiping
- [ ] Exclude already-swiped listings
- [ ] Right swipe = auto-favorite

**Acceptance:** Swipe events recorded, deck respects filters

### W3.7 - Swipe UI [Frontend]
- [ ] SwipeDeck component (card stack)
- [ ] Swipe gestures (left/right)
- [ ] Swipe animations
- [ ] Like/Pass overlay indicators
- [ ] Card tap → detail modal
- [ ] Quick Browse page (`/quick-browse`)
- [ ] "No more items" state

**Acceptance:** Tinder-style swipe works smoothly

---

## Week 4: Messaging

### W4.1 - Messaging Backend [Backend]
- [ ] `message.send` - send message
- [ ] `message.listConversations` - user's conversations
- [ ] `message.getConversation` - messages in thread
- [ ] `message.markRead` - mark as read
- [ ] Auto-create conversation on first message

**Acceptance:** Messages send and retrieve correctly

### W4.2 - Messaging UI [Frontend]
- [ ] Conversations list page (`/messages`)
- [ ] Conversation detail page
- [ ] Message input component
- [ ] Message bubbles (sent/received)
- [ ] Unread indicator
- [ ] "Contact seller" button on listing

**Acceptance:** Full messaging flow works

### W4.3 - Real-time Updates [Backend + Frontend]
- [ ] Supabase Realtime subscription
- [ ] New message notifications
- [ ] Online status (optional)
- [ ] Typing indicator (optional)

**Acceptance:** Messages appear without page refresh

### W4.4 - User Profile [Frontend]
- [ ] Profile page (`/profile`)
- [ ] Edit profile form
- [ ] My listings tab
- [ ] Public profile page (`/user/[id]`)

**Acceptance:** Users can view and edit profiles

---

## Week 5: Moderation & Polish

### W5.1 - Text Moderation [Backend]
- [ ] OpenAI Moderation API integration
- [ ] Moderate listing title + description
- [ ] Moderate messages
- [ ] Flag content, don't auto-reject
- [ ] Moderation logging

**Acceptance:** Problematic text gets flagged

### W5.2 - Image Moderation [Backend]
- [ ] Sightengine integration
- [ ] Check for nudity, weapons, drugs
- [ ] Block obvious violations
- [ ] Flag borderline for review

**Acceptance:** Inappropriate images blocked

### W5.3 - Reporting System [Backend + Frontend]
- [ ] `report.create` endpoint
- [ ] Report modal component
- [ ] Report reason selection
- [ ] Rate limit reports per user

**Acceptance:** Users can report listings

### W5.4 - Admin Basics [Backend + Frontend]
- [ ] Admin role check middleware
- [ ] `admin.pendingListings` - review queue
- [ ] `admin.approveReject` - approve/reject listing
- [ ] `admin.reports` - view reports
- [ ] Basic admin dashboard (`/admin`)

**Acceptance:** Admin can review and moderate

### W5.5 - Rate Limiting [Backend]
- [ ] Limit listings per day (5)
- [ ] Limit messages per hour (50)
- [ ] Limit reports per day (10)
- [ ] Implement cooldowns
- [ ] Return appropriate errors

**Acceptance:** Abuse prevented via rate limits

### W5.6 - UX Polish [Frontend]
- [ ] Loading states everywhere
- [ ] Error boundaries
- [ ] Toast notifications
- [ ] Empty states with CTAs
- [ ] Pull-to-refresh (mobile)
- [ ] Haptic feedback (swipe)

**Acceptance:** App feels polished and responsive

---

## Week 6: Deploy & Test

### W6.1 - Production Infrastructure [DevOps]
- [ ] Hetzner VPS provisioning
- [ ] Coolify setup
- [ ] Docker production config
- [ ] SSL certificates
- [ ] Domain setup

**Acceptance:** Production server running

### W6.2 - CI/CD Pipeline [DevOps]
- [ ] GitHub Actions workflow
- [ ] Build and type check
- [ ] Run tests
- [ ] Deploy on main merge
- [ ] Database migration automation

**Acceptance:** Commits to main auto-deploy

### W6.3 - Monitoring [DevOps]
- [ ] Error tracking (GlitchTip)
- [ ] Uptime monitoring (Uptime Kuma)
- [ ] Basic analytics
- [ ] Database backups
- [ ] Alert notifications

**Acceptance:** Issues detected and alerted

### W6.4 - E2E Testing [QA]
- [ ] User registration flow
- [ ] Create listing flow
- [ ] Browse and search flow
- [ ] Swipe and favorite flow
- [ ] Messaging flow
- [ ] Report flow

**Acceptance:** Critical paths covered by E2E tests

### W6.5 - Bug Bash [All]
- [ ] Internal testing
- [ ] Fix critical bugs
- [ ] Performance check
- [ ] Mobile testing
- [ ] Final polish

**Acceptance:** No P0/P1 bugs remaining

### W6.6 - Soft Launch
- [ ] Beta user invites
- [ ] Feedback collection
- [ ] Quick fixes
- [ ] Documentation

**Acceptance:** Real users can use the app

---

## Out of Scope (Post-MVP)

These are explicitly **NOT** in MVP:

- [ ] Shipping/payments integration
- [ ] Video uploads
- [ ] AI-powered recommendations
- [ ] Multi-language support
- [ ] Auction format
- [ ] Business/shop accounts
- [ ] Push notifications (native)
- [ ] Advanced analytics dashboard
- [ ] Saved search alerts
- [ ] Verified badges (paid)

---

## Task Format for Agents

When assigning tasks to agents, use this format:

```markdown
## Task: [ID] - [Title]

**Agent:** [Architect | Backend | Frontend | QA | DevOps]

**Priority:** [P0 Critical | P1 High | P2 Medium | P3 Low]

**Dependencies:** [Task IDs that must be done first]

**Description:**
What needs to be done.

**Files to modify:**
- path/to/file1.ts
- path/to/file2.ts

**Acceptance criteria:**
- [ ] Criterion 1
- [ ] Criterion 2

**Notes:**
Any additional context.
```
