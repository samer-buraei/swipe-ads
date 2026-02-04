# EXECUTE: PHASE 2 - TYPES & ZOD SCHEMAS (Claude) - UPDATED v2

## Changes from v1
- ✅ Added Zod schema generation per category
- ✅ Added validation helper functions
- ✅ Improved RLS policies

## Instructions

1. Open Claude (claude.ai)
2. **Paste APP-CONTRACT.md first**
3. Paste `schema.sql` from Phase 1
4. Execute Prompt 2A → Save as `types.ts` AND `schemas.ts`
5. Execute Prompt 2B → Save as `rls-policies.sql`

---

## PROMPT 2A: TypeScript Types + Zod Schemas (UPDATED)

```
# Task: Generate TypeScript Types AND Zod Validation Schemas

## App Contract
[PASTE APP-CONTRACT.md HERE]

## Schema Reference
[PASTE schema.sql HERE]

## Requirements

Generate TWO files:

### File 1: types.ts

Standard TypeScript interfaces for all database tables. Follow these rules:
- Use `string` for UUID and timestamps
- Use camelCase for property names (convert from snake_case)
- Mark nullable columns as optional with `?`
- Export all types

Include:
1. All enum types (matching PostgreSQL enums)
2. All table interfaces
3. API request/response types
4. Utility types (BilingualText, GeoLocation, Price, etc.)

### File 2: schemas.ts (NEW - Critical)

Zod validation schemas that ENFORCE data integrity before database operations.

```typescript
// schemas.ts

import { z } from 'zod';
import type { AttributeType, CategoryAttribute } from './types';

// ============================================================================
// BASE SCHEMAS
// ============================================================================

export const emailSchema = z.string().email('Nevažeća email adresa');
export const phoneSchema = z.string().regex(/^(\+381|0)[0-9]{8,9}$/, 'Nevažeći broj telefona');
export const priceSchema = z.number().positive('Cena mora biti pozitivna');
export const yearSchema = z.number().int().min(1900).max(new Date().getFullYear() + 1);
export const mileageSchema = z.number().int().min(0).max(10000000);

// ============================================================================
// LISTING BASE SCHEMA
// ============================================================================

export const listingBaseSchema = z.object({
  title: z.string()
    .min(5, 'Naslov mora imati najmanje 5 karaktera')
    .max(100, 'Naslov može imati najviše 100 karaktera'),
  description: z.string()
    .max(5000, 'Opis može imati najviše 5000 karaktera')
    .optional(),
  price: priceSchema.optional(),
  priceCurrency: z.enum(['RSD', 'EUR']).default('RSD'),
  isNegotiable: z.boolean().default(false),
  city: z.string().min(1, 'Grad je obavezan'),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }).optional(),
});

// ============================================================================
// CATEGORY-SPECIFIC ATTRIBUTE SCHEMAS
// ============================================================================

// Cars (Automobili)
export const carAttributesSchema = z.object({
  make: z.string().min(1, 'Marka je obavezna'),
  model: z.string().min(1, 'Model je obavezan'),
  year: yearSchema,
  mileage: mileageSchema,
  fuel: z.enum(['petrol', 'diesel', 'lpg', 'hybrid', 'electric', 'methane']),
  transmission: z.enum(['manual', 'automatic', 'semi-automatic']),
  engineCapacity: z.number().int().min(50).max(10000).optional(),
  power: z.number().int().min(1).max(2000).optional(),
  bodyType: z.enum([
    'sedan', 'hatchback', 'wagon', 'suv', 'coupe', 
    'convertible', 'minivan', 'pickup', 'van'
  ]).optional(),
  drivetrain: z.enum(['fwd', 'rwd', 'awd']).optional(),
  color: z.string().optional(),
  doors: z.enum(['2', '3', '4', '5']).optional(),
  seats: z.number().int().min(1).max(9).optional(),
  registeredUntil: z.string().optional(),
  damaged: z.boolean().default(false),
  exchangePossible: z.boolean().default(false),
  features: z.array(z.string()).default([]),
});

// Apartments Sale (Stanovi Prodaja)
export const apartmentSaleAttributesSchema = z.object({
  rooms: z.enum(['0.5', '1', '1.5', '2', '2.5', '3', '3.5', '4', '4.5', '5+']),
  areaM2: z.number().min(10).max(1000),
  floor: z.number().int().min(-2).max(50),
  totalFloors: z.number().int().min(1).max(50),
  heating: z.enum(['central', 'gas', 'electric', 'solid-fuel', 'heat-pump']).optional(),
  furnished: z.enum(['unfurnished', 'semi-furnished', 'furnished']).optional(),
  registered: z.boolean().optional(),
  constructionType: z.enum(['old', 'new', 'under-construction']).optional(),
  parking: z.enum(['none', 'street', 'garage']).optional(),
  elevator: z.boolean().optional(),
  terrace: z.boolean().optional(),
  balcony: z.boolean().optional(),
  basement: z.boolean().optional(),
  amenities: z.array(z.string()).default([]),
});

// Apartments Rent (Stanovi Izdavanje)
export const apartmentRentAttributesSchema = apartmentSaleAttributesSchema.extend({
  depositMonths: z.number().int().min(0).max(12).optional(),
  minLeasemonths: z.number().int().min(1).max(36).optional(),
  utilitiesIncluded: z.boolean().optional(),
});

// Mobile Phones
export const phoneAttributesSchema = z.object({
  brand: z.string().min(1, 'Marka je obavezna'),
  model: z.string().optional(),
  condition: z.enum(['new', 'like-new', 'used', 'damaged']),
  storage: z.enum(['32', '64', '128', '256', '512', '1024']).optional(),
  ram: z.enum(['2', '3', '4', '6', '8', '12', '16']).optional(),
  color: z.string().optional(),
  warranty: z.boolean().optional(),
});

// Fashion (Moda)
export const fashionAttributesSchema = z.object({
  category: z.enum(['mens', 'womens', 'kids', 'unisex']),
  type: z.string().optional(),
  size: z.string().optional(),
  brand: z.string().optional(),
  condition: z.enum(['new-with-tags', 'new', 'like-new', 'used', 'worn']),
  color: z.string().optional(),
  material: z.string().optional(),
});

// Generic/Other
export const genericAttributesSchema = z.object({
  condition: z.enum(['new', 'like-new', 'used', 'for-parts']).optional(),
  brand: z.string().optional(),
}).passthrough(); // Allow additional fields

// ============================================================================
// SCHEMA REGISTRY
// ============================================================================

export const attributeSchemas: Record<string, z.ZodSchema> = {
  'cars': carAttributesSchema,
  'cars-sale': carAttributesSchema,
  'cars-rent': carAttributesSchema,
  'apartments-sale': apartmentSaleAttributesSchema,
  'apartments-rent': apartmentRentAttributesSchema,
  'mobile-phones': phoneAttributesSchema,
  'fashion': fashionAttributesSchema,
  'fashion-mens': fashionAttributesSchema,
  'fashion-womens': fashionAttributesSchema,
  // Add more category mappings...
  'default': genericAttributesSchema,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get the Zod schema for a specific category
 */
export function getAttributeSchema(categorySlug: string): z.ZodSchema {
  return attributeSchemas[categorySlug] || attributeSchemas['default'];
}

/**
 * Validate listing attributes for a category
 */
export function validateAttributes(
  categorySlug: string, 
  attributes: Record<string, unknown>
): { success: boolean; data?: Record<string, unknown>; errors?: z.ZodError } {
  const schema = getAttributeSchema(categorySlug);
  const result = schema.safeParse(attributes);
  
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, errors: result.error };
  }
}

/**
 * Create full listing schema with category-specific attributes
 */
export function createListingSchema(categorySlug: string) {
  const attributeSchema = getAttributeSchema(categorySlug);
  
  return listingBaseSchema.extend({
    categoryId: z.string().uuid(),
    attributes: attributeSchema,
  });
}

/**
 * Generate Zod schema from CategoryAttribute[] (runtime generation)
 * This is for dynamic categories not predefined above
 */
export function generateSchemaFromAttributes(
  attributes: CategoryAttribute[]
): z.ZodObject<any> {
  const shape: Record<string, z.ZodTypeAny> = {};
  
  for (const attr of attributes) {
    let fieldSchema: z.ZodTypeAny;
    
    switch (attr.type) {
      case 'text':
        fieldSchema = z.string();
        if (attr.minValue) fieldSchema = (fieldSchema as z.ZodString).min(attr.minValue);
        if (attr.maxValue) fieldSchema = (fieldSchema as z.ZodString).max(attr.maxValue);
        break;
        
      case 'number':
        fieldSchema = z.number();
        if (attr.minValue) fieldSchema = (fieldSchema as z.ZodNumber).min(attr.minValue);
        if (attr.maxValue) fieldSchema = (fieldSchema as z.ZodNumber).max(attr.maxValue);
        break;
        
      case 'select':
      case 'dependent_select':
        if (attr.options && attr.options.length > 0) {
          const values = attr.options.map(o => o.value) as [string, ...string[]];
          fieldSchema = z.enum(values);
        } else {
          fieldSchema = z.string();
        }
        break;
        
      case 'multi_select':
        fieldSchema = z.array(z.string());
        break;
        
      case 'boolean':
        fieldSchema = z.boolean();
        break;
        
      case 'range':
        fieldSchema = z.number();
        if (attr.minValue) fieldSchema = (fieldSchema as z.ZodNumber).min(attr.minValue);
        if (attr.maxValue) fieldSchema = (fieldSchema as z.ZodNumber).max(attr.maxValue);
        break;
        
      case 'date':
        fieldSchema = z.string().datetime();
        break;
        
      default:
        fieldSchema = z.unknown();
    }
    
    // Make optional if not required
    if (!attr.isRequired) {
      fieldSchema = fieldSchema.optional();
    }
    
    shape[attr.key] = fieldSchema;
  }
  
  return z.object(shape);
}

// ============================================================================
// API REQUEST SCHEMAS
// ============================================================================

export const createListingRequestSchema = z.object({
  categoryId: z.string().uuid(),
  title: z.string().min(5).max(100),
  description: z.string().max(5000).optional(),
  price: z.number().positive().optional(),
  priceCurrency: z.enum(['RSD', 'EUR']).default('RSD'),
  isNegotiable: z.boolean().default(false),
  attributes: z.record(z.unknown()), // Validated separately per category
  city: z.string().min(1),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }).optional(),
});

export const searchListingsRequestSchema = z.object({
  categoryId: z.string().uuid().optional(),
  query: z.string().optional(),
  attributes: z.record(z.unknown()).optional(),
  priceMin: z.number().optional(),
  priceMax: z.number().optional(),
  city: z.string().optional(),
  radiusKm: z.number().min(1).max(500).optional(),
  cursor: z.string().optional(),
  limit: z.number().min(1).max(50).default(20),
});

export const recordSwipeRequestSchema = z.object({
  listingId: z.string().uuid(),
  action: z.enum(['like', 'nope', 'maybe', 'contact']),
  viewDurationMs: z.number().int().optional(),
  cardPosition: z.number().int().optional(),
});

export const sendMessageRequestSchema = z.object({
  conversationId: z.string().uuid().optional(),
  listingId: z.string().uuid(),
  content: z.string().min(1).max(2000),
});

// ============================================================================
// EXPORT TYPES FROM SCHEMAS
// ============================================================================

export type CreateListingRequest = z.infer<typeof createListingRequestSchema>;
export type SearchListingsRequest = z.infer<typeof searchListingsRequestSchema>;
export type RecordSwipeRequest = z.infer<typeof recordSwipeRequestSchema>;
export type SendMessageRequest = z.infer<typeof sendMessageRequestSchema>;
export type CarAttributes = z.infer<typeof carAttributesSchema>;
export type ApartmentSaleAttributes = z.infer<typeof apartmentSaleAttributesSchema>;
export type PhoneAttributes = z.infer<typeof phoneAttributesSchema>;
```

## Output

Provide TWO complete TypeScript files:

1. **types.ts** (~500 lines)
   - All interfaces matching database tables
   - All enum types
   - API types
   - Utility types

2. **schemas.ts** (~400 lines)
   - Base validation schemas
   - Category-specific attribute schemas (at least: cars, apartments, phones, fashion)
   - Schema registry and helper functions
   - API request schemas
   - Type exports from schemas
```

---

## PROMPT 2B: Row Level Security (Same as v1, but include this reminder)

```
# Task: Create Supabase Row Level Security Policies

## App Contract
[PASTE APP-CONTRACT.md HERE]

## Schema Reference
[PASTE schema.sql HERE]

[REST OF PROMPT 2B FROM ORIGINAL FILE]

## Additional Requirement

Include policies for the new search optimization:
- Allow public access to get_swipe_feed() function
- Ensure swipe_actions can only be inserted/updated by the owner
```

---

## Validation Checklist (After Phase 2)

```bash
# Verify types compile
npx tsc types.ts schemas.ts --noEmit --strict

# Test Zod validation
node -e "
const { carAttributesSchema } = require('./schemas');
const result = carAttributesSchema.safeParse({ make: 'BMW', model: '320d', year: 2019, mileage: 85000, fuel: 'diesel', transmission: 'manual' });
console.log(result.success ? 'PASS' : 'FAIL', result.error?.issues);
"
```

---

## Next: Proceed to EXECUTE-04-PHASE3-CLAUDE.md
