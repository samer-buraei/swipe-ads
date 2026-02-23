-- ============================================================================
-- SwipeMarket — Supabase Database Schema
-- Run this ENTIRE file in the Supabase SQL Editor (Project → SQL Editor → New query)
-- ============================================================================

-- ============================================================================
-- 1. ENUMS
-- ============================================================================

CREATE TYPE listing_status AS ENUM (
  'DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'SOLD', 'EXPIRED', 'REJECTED', 'REMOVED'
);

CREATE TYPE item_condition AS ENUM (
  'NEW', 'LIKE_NEW', 'GOOD', 'FAIR'
);

CREATE TYPE swipe_direction AS ENUM (
  'LEFT', 'RIGHT', 'UP'
);

CREATE TYPE report_reason AS ENUM (
  'SPAM', 'SCAM', 'PROHIBITED_ITEM', 'WRONG_CATEGORY', 'DUPLICATE', 'OFFENSIVE', 'OTHER'
);

CREATE TYPE report_status AS ENUM (
  'PENDING', 'REVIEWED', 'ACTION_TAKEN', 'DISMISSED'
);

CREATE TYPE attribute_type AS ENUM (
  'TEXT', 'NUMBER', 'SELECT', 'MULTISELECT', 'BOOLEAN'
);

-- ============================================================================
-- 2. CATEGORIES
-- ============================================================================

CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO categories (id, name, icon, "order") VALUES
  ('nekretnine', 'Nekretnine', '🏠', 1),
  ('vozila', 'Vozila', '🚗', 2),
  ('elektronika', 'Elektronika', '📱', 3),
  ('namestaj', 'Nameštaj i pokućstvo', '🛋️', 4),
  ('odeca', 'Odeća, obuća, dodaci', '👗', 5),
  ('sport', 'Sport i rekreacija', '⚽', 6),
  ('knjige', 'Knjige', '📚', 7),
  ('kucni-ljubimci', 'Kućni ljubimci', '🐾', 8),
  ('masine', 'Mašine, alati i oprema', '🔧', 9),
  ('ostalo', 'Ostalo', '📦', 10);

-- ============================================================================
-- 3. CATEGORY ATTRIBUTES
-- ============================================================================

CREATE TABLE category_attributes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  label TEXT NOT NULL,
  type attribute_type NOT NULL DEFAULT 'TEXT',
  required BOOLEAN DEFAULT FALSE,
  options JSONB,
  "order" INTEGER DEFAULT 0
);

CREATE INDEX idx_category_attributes_category_id ON category_attributes(category_id);

-- ============================================================================
-- 4. USERS
-- ============================================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  phone_verified_at TIMESTAMPTZ,
  name TEXT,
  image TEXT,
  city TEXT,
  bio TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_banned BOOLEAN DEFAULT FALSE,
  push_subscription JSONB,
  avg_rating DECIMAL(3,2) DEFAULT 0,
  total_ratings INTEGER DEFAULT 0,
  listings_count INTEGER DEFAULT 0,
  listing_count_today INTEGER DEFAULT 0,
  listing_reset_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 5. LISTINGS
-- ============================================================================

CREATE TABLE listings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(12,2),
  currency TEXT DEFAULT 'RSD',
  condition item_condition,
  status listing_status DEFAULT 'DRAFT',
  category_id TEXT REFERENCES categories(id),
  city TEXT,
  attributes JSONB DEFAULT '{}',
  moderation_score DECIMAL(5,4),
  moderation_flags JSONB,
  is_premium BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  favorite_count INTEGER DEFAULT 0,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(city, '')), 'C')
  ) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '60 days')
);

CREATE INDEX idx_listings_user_id ON listings(user_id);
CREATE INDEX idx_listings_category_id ON listings(category_id);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_city ON listings(city);
CREATE INDEX idx_listings_status_category ON listings(status, category_id);
CREATE INDEX idx_listings_search_vector ON listings USING GIN(search_vector);
CREATE INDEX idx_listings_created_at ON listings(created_at DESC);

-- ============================================================================
-- 6. LISTING IMAGES
-- ============================================================================

CREATE TABLE listing_images (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  original_url TEXT NOT NULL,
  medium_url TEXT,
  thumb_url TEXT,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_listing_images_listing_id ON listing_images(listing_id);

-- ============================================================================
-- 7. FAVORITES, SWIPES, SEARCH PROFILES
-- ============================================================================

CREATE TABLE favorites (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);

CREATE INDEX idx_favorites_user_id ON favorites(user_id);

CREATE TABLE swipe_events (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  direction swipe_direction NOT NULL,
  time_spent_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_swipe_events_user_id ON swipe_events(user_id);
CREATE INDEX idx_swipe_events_listing_id ON swipe_events(listing_id);

CREATE TABLE search_profiles (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT,
  category_ids TEXT[] DEFAULT '{}',
  price_min DECIMAL(12,2),
  price_max DECIMAL(12,2),
  city TEXT,
  radius_km INTEGER,
  keywords TEXT,
  notify_on_new BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_search_profiles_user_id ON search_profiles(user_id);

-- ============================================================================
-- 8. MESSAGING
-- ============================================================================

CREATE TABLE conversations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  listing_id TEXT REFERENCES listings(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE conversation_participants (
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  unread_count INTEGER DEFAULT 0,
  PRIMARY KEY (conversation_id, user_id)
);

CREATE INDEX idx_conv_participants_user_id ON conversation_participants(user_id);

CREATE TABLE messages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- ============================================================================
-- 9. REPORTS
-- ============================================================================

CREATE TABLE reports (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id TEXT REFERENCES listings(id) ON DELETE CASCADE,
  reason report_reason NOT NULL,
  description TEXT,
  status report_status DEFAULT 'PENDING',
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 10. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE swipe_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_attributes ENABLE ROW LEVEL SECURITY;

-- Categories: public read
CREATE POLICY "categories_public_read" ON categories FOR SELECT USING (true);
CREATE POLICY "category_attributes_public_read" ON category_attributes FOR SELECT USING (true);

-- Users: public read, own write
CREATE POLICY "users_public_read" ON users FOR SELECT USING (true);
CREATE POLICY "users_own_update" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "users_own_insert" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- Listings: active are public, own full access
CREATE POLICY "listings_public_read" ON listings FOR SELECT USING (status = 'ACTIVE');
CREATE POLICY "listings_own_read" ON listings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "listings_own_insert" ON listings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "listings_own_update" ON listings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "listings_own_delete" ON listings FOR DELETE USING (auth.uid() = user_id);

-- Listing images: public read, owning user can write
CREATE POLICY "listing_images_public_read" ON listing_images FOR SELECT USING (true);
CREATE POLICY "listing_images_own_insert" ON listing_images FOR INSERT WITH CHECK (
  auth.uid() = (SELECT user_id FROM listings WHERE id = listing_id)
);
CREATE POLICY "listing_images_own_update" ON listing_images FOR UPDATE USING (
  auth.uid() = (SELECT user_id FROM listings WHERE id = listing_id)
);
CREATE POLICY "listing_images_own_delete" ON listing_images FOR DELETE USING (
  auth.uid() = (SELECT user_id FROM listings WHERE id = listing_id)
);

-- Favorites: own only
CREATE POLICY "favorites_own_select" ON favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "favorites_own_insert" ON favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "favorites_own_delete" ON favorites FOR DELETE USING (auth.uid() = user_id);

-- Swipe events: own only
CREATE POLICY "swipe_events_own_select" ON swipe_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "swipe_events_own_insert" ON swipe_events FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Conversations: participants only
CREATE POLICY "conversations_participant_read" ON conversations FOR SELECT USING (
  EXISTS (SELECT 1 FROM conversation_participants WHERE conversation_id = id AND user_id = auth.uid())
);

CREATE POLICY "conversation_participants_own" ON conversation_participants FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "conversation_participants_insert" ON conversation_participants FOR INSERT WITH CHECK (user_id = auth.uid());

-- Messages: conversation participants only
CREATE POLICY "messages_participant_read" ON messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
  )
);
CREATE POLICY "messages_own_insert" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Search profiles: own only
CREATE POLICY "search_profiles_own_select" ON search_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "search_profiles_own_insert" ON search_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "search_profiles_own_update" ON search_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "search_profiles_own_delete" ON search_profiles FOR DELETE USING (auth.uid() = user_id);

-- Reports: own insert, own read
CREATE POLICY "reports_own_select" ON reports FOR SELECT USING (auth.uid() = reporter_id);
CREATE POLICY "reports_own_insert" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- ============================================================================
-- 11. SEED DEMO DATA
-- ============================================================================

INSERT INTO users (id, email, name, city, is_verified) VALUES
  ('00000000-0000-0000-0000-000000000001', 'demo@swipemarket.rs', 'Demo Prodavac', 'Beograd', true);

INSERT INTO listings (title, description, price, currency, condition, status, category_id, city, user_id) VALUES
  ('MacBook Pro 14" M3 Pro 512GB Silver', 'Kupljen pre 8 meseci, odlično stanje. Dolazi sa originalnom kutijom i kablom.', 189000, 'RSD', 'LIKE_NEW', 'ACTIVE', 'elektronika', 'Beograd', '00000000-0000-0000-0000-000000000001'),
  ('Sony PlayStation 5 + 2 kontrolera', 'PS5 disk verzija, malo korišćena. Uključena 3 igrice.', 65000, 'RSD', 'GOOD', 'ACTIVE', 'elektronika', 'Novi Sad', '00000000-0000-0000-0000-000000000001'),
  ('iPhone 15 Pro Max 256GB Titanium', 'Odlično stanje, bez ogrebotina. Futrola gratis.', 145000, 'RSD', 'LIKE_NEW', 'ACTIVE', 'elektronika', 'Beograd', '00000000-0000-0000-0000-000000000001'),
  ('Kožni dvosed trosjed', 'Braon koža, kupljen 2022. Malo korišćen, bez oštećenja.', 45000, 'RSD', 'GOOD', 'ACTIVE', 'namestaj', 'Niš', '00000000-0000-0000-0000-000000000001'),
  ('Vintage akustična gitara', 'Yamaha F310, odličan ton. Uključen kofer.', 15000, 'RSD', 'GOOD', 'ACTIVE', 'ostalo', 'Beograd', '00000000-0000-0000-0000-000000000001'),
  ('Planinarska bicikla Trek Marlin 7', 'Veličina L, 2021. godište. Redovno servisirana.', 35000, 'RSD', 'GOOD', 'ACTIVE', 'sport', 'Beograd', '00000000-0000-0000-0000-000000000001');
