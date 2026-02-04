# EXECUTE: PHASE 1 - DATABASE SCHEMA (Claude) - UPDATED v2

## Changes from v1
- ✅ Added Serbian text normalization trigger
- ✅ Emphasized PostGIS geometry column
- ✅ Added cursor-based pagination support
- ✅ Added Zod schema generation requirement (for Phase 2)

## Instructions

1. Open Claude (claude.ai)
2. **Paste APP-CONTRACT.md first**
3. Paste BOTH `categories.json` AND `attributes.json` from Phase 0
4. Execute the prompt below
5. Save outputs as `schema.sql` and `seed.sql`

---

## PROMPT 1A: Complete Database Schema (UPDATED)

```
# Task: Design Complete PostgreSQL Schema for SwipeMarket

## App Contract
[PASTE APP-CONTRACT.md HERE]

## Reference Data
[PASTE categories.json HERE]
[PASTE attributes.json HERE]

## Context
SwipeMarket is a Serbian classifieds app. Design a production-ready PostgreSQL schema for Supabase.

## CRITICAL REQUIREMENTS (Updated)

### 1. Serbian Text Search Normalization

Serbian users mix Latin, Cyrillic, and "bald" Latin (no accents). Create:

```sql
-- Extension for unaccent
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Function to normalize Serbian text for search
CREATE OR REPLACE FUNCTION normalize_serbian(input TEXT) 
RETURNS TEXT AS $$
BEGIN
  RETURN lower(
    unaccent(
      translate(
        input,
        'čćžšđČĆŽŠĐљњертзу|опасдфгхјклѕцвбнмЉЊЕРТЗУИОПАСДФГХЈКЛЅЦВБНМ',
        'cczsdCCZSDljnjertzuiopasdfghjklscvbnmLJNJERTZUIOPASDFGHJKLSCVBNM'
      )
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to auto-generate normalized search text
CREATE OR REPLACE FUNCTION update_listing_search() 
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_text_normalized := normalize_serbian(
    COALESCE(NEW.title, '') || ' ' || 
    COALESCE(NEW.description, '') || ' ' ||
    COALESCE(NEW.city, '')
  );
  NEW.search_vector := to_tsvector('simple', NEW.search_text_normalized);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

This ensures that "cacak" finds "Čačak" and "Београд" finds "Beograd".

### 2. PostGIS Geography Column (REQUIRED)

```sql
-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- Listings MUST have a geography column for radius search
CREATE TABLE listings (
  -- ... other columns ...
  
  city TEXT NOT NULL,                          -- Display name
  city_normalized TEXT,                        -- For search: "cacak" not "Čačak"
  location GEOGRAPHY(POINT, 4326),             -- REQUIRED for radius queries
  
  -- Example: ST_MakePoint(longitude, latitude)
  -- Belgrade: ST_MakePoint(20.4489, 44.7866)
);

-- Spatial index for fast radius queries
CREATE INDEX idx_listings_location ON listings USING GIST (location);

-- Example query: Find within 50km of Belgrade
-- WHERE ST_DWithin(location, ST_MakePoint(20.4489, 44.7866)::geography, 50000)
```

### 3. Cursor-Based Pagination Support

All queries must support cursor-based pagination (no OFFSET):

```sql
-- BAD (OFFSET - gets slow at scale):
SELECT * FROM listings ORDER BY created_at DESC LIMIT 20 OFFSET 1000;

-- GOOD (Cursor/Keyset - constant speed):
SELECT * FROM listings 
WHERE created_at < $cursor_timestamp 
ORDER BY created_at DESC 
LIMIT 20;

-- Composite cursor for stable ordering
CREATE INDEX idx_listings_cursor ON listings (created_at DESC, id DESC);
```

### 4. Swipe Feed Query Optimization

The swipe feed must exclude already-swiped listings efficiently:

```sql
-- Create a function for the feed query
CREATE OR REPLACE FUNCTION get_swipe_feed(
  p_user_id UUID,
  p_category_id UUID DEFAULT NULL,
  p_cursor_created_at TIMESTAMPTZ DEFAULT NOW(),
  p_cursor_id UUID DEFAULT NULL,
  p_limit INT DEFAULT 20
) RETURNS TABLE (
  id UUID,
  title TEXT,
  -- ... other columns
) AS $$
BEGIN
  RETURN QUERY
  SELECT l.*
  FROM listings l
  WHERE l.status = 'active'
    AND (p_category_id IS NULL OR l.category_id = p_category_id)
    -- Exclude already swiped (using NOT EXISTS is faster than LEFT JOIN)
    AND NOT EXISTS (
      SELECT 1 FROM swipe_actions sa 
      WHERE sa.listing_id = l.id AND sa.user_id = p_user_id
    )
    -- Cursor pagination
    AND (l.created_at, l.id) < (p_cursor_created_at, COALESCE(p_cursor_id, '00000000-0000-0000-0000-000000000000'::UUID))
  ORDER BY l.created_at DESC, l.id DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;
```

### 5. Required Schema Structure

Provide complete SQL for these tables:

```sql
-- PART 1: Extensions
-- uuid-ossp, postgis, pg_trgm, unaccent

-- PART 2: Custom Types (Enums)
CREATE TYPE attribute_type AS ENUM ('text', 'number', 'select', 'multi_select', 'boolean', 'range', 'date', 'dependent_select');
CREATE TYPE listing_status AS ENUM ('draft', 'active', 'sold', 'expired', 'deleted', 'suspended');
CREATE TYPE swipe_action AS ENUM ('like', 'nope', 'maybe', 'contact');
CREATE TYPE currency AS ENUM ('RSD', 'EUR');
CREATE TYPE media_type AS ENUM ('image', 'video');

-- PART 3: Categories
CREATE TABLE categories (...);
CREATE TABLE category_attributes (...);

-- PART 4: Users
CREATE TABLE profiles (...);  -- Extends auth.users

-- PART 5: Listings
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  category_id UUID NOT NULL REFERENCES categories(id),
  
  title TEXT NOT NULL,
  description TEXT,
  
  price NUMERIC,
  price_currency currency DEFAULT 'RSD',
  price_eur NUMERIC,  -- Always store EUR equivalent for filtering
  is_negotiable BOOLEAN DEFAULT false,
  
  attributes JSONB DEFAULT '{}',  -- Dynamic category attributes
  
  city TEXT NOT NULL,
  city_normalized TEXT,  -- Auto-generated via trigger
  location GEOGRAPHY(POINT, 4326),  -- For radius search
  
  status listing_status DEFAULT 'draft',
  
  view_count INT DEFAULT 0,
  favorite_count INT DEFAULT 0,
  
  search_text_normalized TEXT,  -- Auto-generated
  search_vector TSVECTOR,       -- Auto-generated
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

-- PART 6: Media
CREATE TABLE listing_media (...);

-- PART 7: Interactions
CREATE TABLE swipe_actions (...);
CREATE TABLE saved_searches (...);

-- PART 8: Messaging
CREATE TABLE conversations (...);
CREATE TABLE messages (...);

-- PART 9: Indexes (Critical for Performance)
-- GIN index on JSONB attributes
-- GIN index on search_vector
-- GIST index on location
-- Composite indexes for cursor pagination

-- PART 10: Triggers
-- Auto-update search_text_normalized
-- Auto-update updated_at
-- Auto-normalize city name

-- PART 11: Functions
-- get_swipe_feed() for optimized feed queries
-- normalize_serbian() for text search
```

### 6. Example Queries (Include as Comments)

```sql
-- QUERY: Swipe feed with exclusions
SELECT * FROM get_swipe_feed('user-uuid', 'cars-uuid');

-- QUERY: Search with Serbian normalization
SELECT * FROM listings 
WHERE search_vector @@ plainto_tsquery('simple', normalize_serbian('bmw cacak'));

-- QUERY: Filter by dynamic attributes
SELECT * FROM listings 
WHERE category_id = 'cars-uuid'
  AND (attributes->>'make') = 'bmw'
  AND (attributes->>'year')::int >= 2018
  AND (attributes->>'mileage')::int < 100000;

-- QUERY: Radius search (within 30km of Belgrade)
SELECT *, ST_Distance(location, ST_MakePoint(20.4489, 44.7866)::geography) as distance_m
FROM listings
WHERE ST_DWithin(location, ST_MakePoint(20.4489, 44.7866)::geography, 30000)
ORDER BY distance_m;

-- QUERY: Combined search (text + filters + location)
SELECT * FROM listings
WHERE search_vector @@ plainto_tsquery('simple', normalize_serbian($search_text))
  AND (attributes->>'fuel') = 'diesel'
  AND ST_DWithin(location, ST_MakePoint($lng, $lat)::geography, $radius_m)
  AND price_eur BETWEEN $min AND $max
ORDER BY created_at DESC;
```

## Output

Provide TWO complete SQL files:

1. **schema.sql** (~500-800 lines)
   - All extensions, types, tables, indexes, triggers, functions
   - Comprehensive comments explaining each section
   - Example queries as comments

2. **seed.sql** (~300-500 lines)
   - All categories from categories.json (hierarchical insert)
   - All attributes from attributes.json
   - 10 test users (various Serbian cities with coordinates)
   - 50 sample listings (20 cars, 15 apartments, 10 phones, 5 other)
   - Sample swipe actions showing usage patterns
   - Include realistic Serbian city coordinates (Belgrade, Novi Sad, Niš, etc.)
```

---

## Validation Checklist (After Phase 1)

```bash
# Start local Supabase
supabase start

# Apply schema
supabase db reset

# Verify tables exist
supabase db dump --schema public

# Test normalization function
psql -c "SELECT normalize_serbian('Čačak') = 'cacak';"  # Should return TRUE

# Test PostGIS
psql -c "SELECT ST_Distance(
  ST_MakePoint(20.4489, 44.7866)::geography,
  ST_MakePoint(19.8335, 45.2671)::geography
) / 1000 as km;"  # Belgrade to Novi Sad ≈ 70km
```

---

## Next: Proceed to EXECUTE-03-PHASE2-CLAUDE.md
