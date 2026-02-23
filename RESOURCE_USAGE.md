# SwipeList Resource Usage Guide

> **Purpose:** Track resource consumption for hosting planning

---

## Local Development Resource Usage

### PostgreSQL Container

```bash
# Check container stats
docker stats swipelist-db --no-stream
```

**Typical Usage:**
| Metric | Idle | Active (light) | Active (heavy) |
|--------|------|----------------|----------------|
| CPU | 0.1% | 1-5% | 10-20% |
| Memory | 50-80 MB | 100-150 MB | 200-300 MB |
| Disk | ~50 MB base | +10 MB / 1000 listings | +50 MB / 10000 listings |

### Next.js Development Server

```bash
# Check Node.js memory usage
# In Task Manager (Windows) or Activity Monitor (Mac), find "node" process
```

**Typical Usage:**
| Metric | Dev Server | Production Build |
|--------|------------|------------------|
| CPU (idle) | 1-3% | 0.5-1% |
| CPU (request) | 10-30% | 5-15% |
| Memory | 200-400 MB | 100-200 MB |
| Disk (node_modules) | ~500 MB | N/A |
| Disk (build output) | N/A | ~50-100 MB |

### Image Uploads

**Storage per listing:**
- Original image: 100-500 KB (avg 250 KB)
- Medium size: 50-200 KB (avg 100 KB)
- Thumbnail: 10-50 KB (avg 25 KB)
- **Total per image: ~375 KB**
- **Per listing (3 images avg): ~1.1 MB**

**Projected storage:**
| Listings | Image Storage |
|----------|---------------|
| 100 | ~110 MB |
| 1,000 | ~1.1 GB |
| 10,000 | ~11 GB |
| 100,000 | ~110 GB |

---

## Production Hosting Requirements

### Minimum Requirements (Small Scale: <1000 users)

| Component | Specification | Monthly Cost |
|-----------|---------------|--------------|
| **Web Server** | 1 vCPU, 1 GB RAM | $5-10 |
| **Database** | 1 GB storage, shared CPU | Free-$5 |
| **Image Storage** | 10 GB | $1-2 |
| **Total** | | **$6-17/month** |

**Recommended Services:**
- Vercel (Hobby): Free tier covers most needs
- Supabase (Free): 500 MB database, 1 GB storage
- Cloudinary (Free): 25 GB storage/bandwidth

### Medium Scale (1,000-10,000 users)

| Component | Specification | Monthly Cost |
|-----------|---------------|--------------|
| **Web Server** | 2 vCPU, 2 GB RAM | $20-40 |
| **Database** | 10 GB, dedicated | $15-25 |
| **Image Storage** | 100 GB | $10-20 |
| **CDN** | Basic | $0-10 |
| **Total** | | **$45-95/month** |

### Large Scale (10,000+ users)

| Component | Specification | Monthly Cost |
|-----------|---------------|--------------|
| **Web Server** | 4+ vCPU, 4+ GB RAM | $80-150 |
| **Database** | 50+ GB, dedicated | $50-100 |
| **Image Storage** | 500+ GB | $50-100 |
| **CDN** | Full | $20-50 |
| **Search** | Meilisearch/Algolia | $20-50 |
| **Total** | | **$220-450/month** |

---

## Bandwidth Estimates

### Per Page View
- Homepage: ~500 KB (HTML + JS + CSS)
- Listing page: ~800 KB (+ images)
- Swipe deck: ~2 MB (preloading 3 cards)

### Monthly Bandwidth
| Daily Users | Page Views/User | Monthly Bandwidth |
|-------------|-----------------|-------------------|
| 100 | 10 | ~15 GB |
| 1,000 | 10 | ~150 GB |
| 10,000 | 10 | ~1.5 TB |

---

## Performance Benchmarks

### API Response Times (Target)

| Endpoint | Target | Acceptable |
|----------|--------|------------|
| List listings | <100ms | <300ms |
| Get single listing | <50ms | <150ms |
| Create listing | <200ms | <500ms |
| Swipe deck | <150ms | <400ms |

### Database Query Performance

```sql
-- Check slow queries
EXPLAIN ANALYZE SELECT * FROM "Listing" WHERE status = 'ACTIVE' LIMIT 20;
```

**Index recommendations already in schema:**
- `(status, categoryId, city)` - Main listing queries
- `(createdAt DESC)` - Chronological sorting
- `(userId)` - User's listings
- `(price)` - Price filtering

---

## Scaling Checklist

### Before 1,000 Users
- [ ] Enable database connection pooling
- [ ] Set up image CDN (Cloudinary/Cloudflare)
- [ ] Enable Next.js caching

### Before 10,000 Users
- [ ] Move to dedicated database
- [ ] Implement Redis caching
- [ ] Add Meilisearch for full-text search
- [ ] Set up monitoring (Vercel Analytics, Sentry)

### Before 100,000 Users
- [ ] Database read replicas
- [ ] Horizontal scaling (multiple server instances)
- [ ] Advanced CDN configuration
- [ ] Consider microservices architecture

---

## Cost Optimization Tips

1. **Images:** Compress before upload, use WebP format
2. **Database:** Use connection pooling, optimize queries
3. **Caching:** Cache category counts, popular listings
4. **CDN:** Serve static assets from edge locations
5. **Serverless:** Use Vercel's edge functions for global performance

---

## Monitoring Commands

### Docker
```bash
# Container resource usage
docker stats swipelist-db

# Container logs
docker logs swipelist-db --tail 100

# Database size
docker exec swipelist-db psql -U swipelist -c "SELECT pg_size_pretty(pg_database_size('swipelist'));"
```

### Database
```bash
# Open Prisma Studio
pnpm db:studio

# Check table sizes
docker exec swipelist-db psql -U swipelist -c "
SELECT relname, pg_size_pretty(pg_total_relation_size(relid))
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC;
"
```

### Next.js Build
```bash
# Analyze bundle size
pnpm build
# Check .next/analyze for bundle analysis (if configured)
```

---

## Quick Reference

### Local Setup Footprint
- PostgreSQL: ~100 MB RAM, ~50 MB disk
- Node.js (dev): ~300 MB RAM
- node_modules: ~500 MB disk
- **Total: ~400 MB RAM, ~550 MB disk**

### Production Footprint (Minimal)
- Vercel: Serverless (pay per use)
- Supabase Free: 500 MB database
- Cloudinary Free: 25 GB
- **Monthly cost: $0-20**

---

*Update this document as you gather real usage data from testing.*
