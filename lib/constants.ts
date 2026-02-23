// lib/constants.ts
// Application constants
// Single source of truth for magic values

// ============================================================================
// CATEGORIES
// ============================================================================

export const CATEGORIES = [
  { id: 'vehicles', name: 'Vozila', icon: 'Car', order: 0 },
  { id: 'electronics', name: 'Elektronika', icon: 'Smartphone', order: 1 },
  { id: 'home', name: 'Kuća i bašta', icon: 'Home', order: 2 },
  { id: 'fashion', name: 'Moda', icon: 'Shirt', order: 3 },
  { id: 'sports', name: 'Sport i rekreacija', icon: 'Dumbbell', order: 4 },
  { id: 'kids', name: 'Deca i bebe', icon: 'Baby', order: 5 },
  { id: 'pets', name: 'Ljubimci', icon: 'PawPrint', order: 6 },
  { id: 'services', name: 'Usluge', icon: 'Wrench', order: 7 },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]['id'];

// ============================================================================
// ITEM CONDITIONS
// ============================================================================

export const CONDITIONS = [
  { id: 'NEW', name: 'Novo', description: 'Nikad korišćeno, originalno pakovanje' },
  { id: 'LIKE_NEW', name: 'Kao novo', description: 'Korišćeno minimalno, bez tragova' },
  { id: 'GOOD', name: 'Dobro', description: 'Normalni tragovi korišćenja' },
  { id: 'FAIR', name: 'Korišćeno', description: 'Vidljivi tragovi, potpuno funkcionalno' },
] as const;

export type ConditionId = (typeof CONDITIONS)[number]['id'];

// ============================================================================
// SERBIAN CITIES (Major cities for MVP)
// ============================================================================

export const CITIES = [
  { name: 'Beograd', lat: 44.8176, lng: 20.4633 },
  { name: 'Novi Sad', lat: 45.2671, lng: 19.8335 },
  { name: 'Niš', lat: 43.3209, lng: 21.8958 },
  { name: 'Kragujevac', lat: 44.0128, lng: 20.9114 },
  { name: 'Subotica', lat: 46.1, lng: 19.6667 },
  { name: 'Zrenjanin', lat: 45.3833, lng: 20.3833 },
  { name: 'Pančevo', lat: 44.8708, lng: 20.6403 },
  { name: 'Čačak', lat: 43.8914, lng: 20.3497 },
  { name: 'Kraljevo', lat: 43.7233, lng: 20.6894 },
  { name: 'Smederevo', lat: 44.6628, lng: 20.9275 },
  { name: 'Leskovac', lat: 42.9981, lng: 21.9461 },
  { name: 'Valjevo', lat: 44.2747, lng: 19.8903 },
  { name: 'Kruševac', lat: 43.5833, lng: 21.3333 },
  { name: 'Vranje', lat: 42.5514, lng: 21.9003 },
  { name: 'Šabac', lat: 44.7489, lng: 19.6908 },
] as const;

// ============================================================================
// LIMITS & RATE LIMITING
// ============================================================================

export const LIMITS = {
  // Listings
  MAX_LISTINGS_PER_DAY: 5,
  MAX_IMAGES_PER_LISTING: 5,
  LISTING_TITLE_MIN: 3,
  LISTING_TITLE_MAX: 100,
  LISTING_DESC_MIN: 10,
  LISTING_DESC_MAX: 2000,
  LISTING_EXPIRY_DAYS: 30,

  // Messages
  MAX_MESSAGES_PER_HOUR: 50,
  MESSAGE_MAX_LENGTH: 2000,

  // Reports
  MAX_REPORTS_PER_DAY: 10,
  REPORTS_TO_AUTO_HIDE: 3, // Hide listing after this many reports

  // Search
  MAX_SEARCH_RADIUS_KM: 500,
  DEFAULT_SEARCH_RADIUS_KM: 50,

  // Swipe
  SWIPE_DECK_SIZE: 20,

  // Images
  MAX_IMAGE_SIZE_MB: 10,
  IMAGE_THUMB_WIDTH: 200,
  IMAGE_MEDIUM_WIDTH: 600,
  IMAGE_FULL_WIDTH: 1200,

  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 50,
} as const;

// ============================================================================
// PRICING
// ============================================================================

export const CURRENCY = {
  code: 'RSD',
  symbol: 'RSD',
  locale: 'sr-RS',
} as const;

export function formatPrice(price: number, currency: string = CURRENCY.code): string {
  return new Intl.NumberFormat(CURRENCY.locale, {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price) + ' ' + currency;
}

// ============================================================================
// MODERATION
// ============================================================================

export const MODERATION = {
  // OpenAI moderation thresholds (0-1)
  TEXT_THRESHOLD: 0.7,
  // Sightengine thresholds
  NUDITY_THRESHOLD: 0.5,
  WEAPON_THRESHOLD: 0.5,
  DRUG_THRESHOLD: 0.5,
  // Auto-actions
  AUTO_REJECT_THRESHOLD: 0.9,
  FLAG_FOR_REVIEW_THRESHOLD: 0.5,
} as const;

// ============================================================================
// URLS & ROUTES
// ============================================================================

export const ROUTES = {
  home: '/',
  login: '/login',
  register: '/register',
  quickBrowse: '/quick-browse',
  favorites: '/favorites',
  messages: '/messages',
  search: '/search',
  profile: '/profile',
  newListing: '/new',
  listing: (slug: string) => `/listing/${slug}`,
  category: (id: string) => `/category/${id}`,
  user: (id: string) => `/user/${id}`,
  conversation: (id: string) => `/messages/${id}`,
  admin: '/admin',
} as const;

// ============================================================================
// UI CONSTANTS
// ============================================================================

export const UI = {
  // Swipe
  SWIPE_THRESHOLD: 100, // pixels to trigger swipe
  SWIPE_VELOCITY_THRESHOLD: 0.5,

  // Animation durations (ms)
  ANIMATION_FAST: 150,
  ANIMATION_NORMAL: 300,
  ANIMATION_SLOW: 500,

  // Breakpoints (match Tailwind)
  BREAKPOINT_SM: 640,
  BREAKPOINT_MD: 768,
  BREAKPOINT_LG: 1024,
  BREAKPOINT_XL: 1280,

  // Grid columns per breakpoint
  GRID_COLS_SM: 2,
  GRID_COLS_MD: 3,
  GRID_COLS_LG: 4,
} as const;

// ============================================================================
// ERROR MESSAGES (Serbian)
// ============================================================================

export const ERRORS = {
  // Auth
  UNAUTHORIZED: 'Morate biti prijavljeni.',
  FORBIDDEN: 'Nemate dozvolu za ovu akciju.',

  // Listings
  LISTING_NOT_FOUND: 'Oglas nije pronađen.',
  LISTING_EXPIRED: 'Ovaj oglas je istekao.',
  LISTING_SOLD: 'Ovaj artikal je prodat.',
  TOO_MANY_LISTINGS: 'Dostigli ste dnevni limit za postavljanje oglasa.',

  // Messages
  CANNOT_MESSAGE_SELF: 'Ne možete slati poruke sebi.',
  TOO_MANY_MESSAGES: 'Sačekajte malo pre slanja nove poruke.',

  // Generic
  GENERIC_ERROR: 'Došlo je do greške. Pokušajte ponovo.',
  RATE_LIMITED: 'Previše zahteva. Sačekajte malo.',
  VALIDATION_ERROR: 'Podaci nisu ispravni.',
} as const;

// ============================================================================
// SUCCESS MESSAGES (Serbian)
// ============================================================================

export const SUCCESS = {
  LISTING_CREATED: 'Oglas je uspešno postavljen!',
  LISTING_UPDATED: 'Oglas je ažuriran.',
  LISTING_DELETED: 'Oglas je obrisan.',
  LISTING_SOLD: 'Oglas je označen kao prodat.',
  MESSAGE_SENT: 'Poruka je poslata.',
  PROFILE_UPDATED: 'Profil je ažuriran.',
  REPORT_SUBMITTED: 'Prijava je poslata. Hvala!',
  FAVORITE_ADDED: 'Dodato u omiljene.',
  FAVORITE_REMOVED: 'Uklonjeno iz omiljenih.',
} as const;
