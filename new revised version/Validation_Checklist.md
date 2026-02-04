# SWIPEMARKET - VALIDATION CHECKLIST
## Run After Phase 0 and Phase 2 Outputs

This checklist validates `categories.json`, `attributes.json`, and Zod schemas to prevent runtime errors.

---

## After Phase 0: Validate categories.json

### Structure Checks

- [ ] Root has `"categories"` array
- [ ] Each category has required fields:
  - `id` (string, unique)
  - `slug` (string, URL-safe)
  - `name_sr` (string, Serbian)
  - `name_en` (string, English)
  - `icon` (string or null)
  - `sort_order` (number)

### Data Integrity

- [ ] All `id` values are unique across entire tree
- [ ] All `slug` values are URL-safe (lowercase, hyphens, no spaces)
- [ ] No circular parent references
- [ ] MVP has exactly 5 main categories: Vehicles, Real Estate, Electronics, Fashion, Other

### Quick Validation Script

```python
import json

def validate_categories(filepath):
    with open(filepath) as f:
        data = json.load(f)
    
    ids = set()
    slugs = set()
    errors = []
    
    def check_category(cat, path=""):
        # Check required fields
        required = ['id', 'slug', 'name_sr', 'name_en', 'sort_order']
        for field in required:
            if field not in cat:
                errors.append(f"Missing '{field}' in {path or 'root'}")
        
        # Check uniqueness
        if cat.get('id') in ids:
            errors.append(f"Duplicate id: {cat.get('id')}")
        ids.add(cat.get('id'))
        
        if cat.get('slug') in slugs:
            errors.append(f"Duplicate slug: {cat.get('slug')}")
        slugs.add(cat.get('slug'))
        
        # Check slug format
        slug = cat.get('slug', '')
        if ' ' in slug or slug != slug.lower():
            errors.append(f"Invalid slug format: {slug}")
        
        # Recurse into subcategories
        for sub in cat.get('subcategories', []):
            check_category(sub, f"{path}/{cat.get('id')}")
    
    for cat in data.get('categories', []):
        check_category(cat)
    
    if errors:
        print("VALIDATION FAILED:")
        for e in errors:
            print(f"  - {e}")
        return False
    else:
        print(f"VALID: {len(ids)} categories, {len(slugs)} slugs")
        return True

# Run: validate_categories('categories.json')
```

---

## After Phase 0: Validate attributes.json

### Structure Checks

- [ ] Root has `"attributes"` object keyed by category slug
- [ ] Each attribute has required fields:
  - `key` (string, unique per category)
  - `label_sr` (string)
  - `label_en` (string)
  - `type` (valid attribute type)
  - `sort_order` (number)

### Type-Specific Checks

- [ ] `select` type has `options` array
- [ ] `dependent_select` type has `depends_on` and `dependent_options`
- [ ] `number`/`range` types have `min_value` and `max_value` if constrained
- [ ] `options` items have `value`, `label_sr`, `label_en`

### MVP Coverage

- [ ] Complete attributes for: `cars`, `apartments-sale`, `mobile-phones`
- [ ] Basic attributes (condition, brand) for: `fashion`, `other`

### Quick Validation Script

```python
import json

VALID_TYPES = [
    'text', 'number', 'select', 'multi_select', 
    'boolean', 'range', 'date', 'dependent_select'
]

def validate_attributes(filepath):
    with open(filepath) as f:
        data = json.load(f)
    
    errors = []
    
    for category, attrs in data.get('attributes', {}).items():
        keys = set()
        
        for attr in attrs:
            # Check required fields
            required = ['key', 'label_sr', 'label_en', 'type', 'sort_order']
            for field in required:
                if field not in attr:
                    errors.append(f"[{category}] Missing '{field}' in attribute")
            
            # Check unique keys
            key = attr.get('key')
            if key in keys:
                errors.append(f"[{category}] Duplicate key: {key}")
            keys.add(key)
            
            # Check valid type
            attr_type = attr.get('type')
            if attr_type not in VALID_TYPES:
                errors.append(f"[{category}] Invalid type '{attr_type}' for {key}")
            
            # Check select has options
            if attr_type == 'select':
                if not attr.get('options'):
                    errors.append(f"[{category}] select '{key}' missing options")
            
            # Check dependent_select
            if attr_type == 'dependent_select':
                if not attr.get('depends_on'):
                    errors.append(f"[{category}] dependent_select '{key}' missing depends_on")
                if not attr.get('dependent_options'):
                    errors.append(f"[{category}] dependent_select '{key}' missing dependent_options")
            
            # Check options have bilingual labels
            for opt in attr.get('options', []):
                if 'value' not in opt or 'label_sr' not in opt or 'label_en' not in opt:
                    errors.append(f"[{category}] Option in '{key}' missing value/label_sr/label_en")
    
    if errors:
        print("VALIDATION FAILED:")
        for e in errors:
            print(f"  - {e}")
        return False
    else:
        print(f"VALID: {len(data.get('attributes', {}))} categories with attributes")
        return True

# Run: validate_attributes('attributes.json')
```

---

## After Phase 2: Validate Zod Schemas

### Schema Existence

- [ ] `schemas.ts` file exists
- [ ] Contains schemas for MVP categories:
  - `carAttributesSchema`
  - `apartmentSaleAttributesSchema`
  - `phoneAttributesSchema`
  - `fashionAttributesSchema`
  - `genericAttributesSchema`

### Schema Correctness

- [ ] All required fields from `attributes.json` are in Zod schema
- [ ] Field types match:
  - `text` → `z.string()`
  - `number` → `z.number()`
  - `select` → `z.enum([...])`
  - `multi_select` → `z.array(z.string())`
  - `boolean` → `z.boolean()`
  - `range` → `z.number().min().max()`
  - `date` → `z.string()` or `z.date()`

### TypeScript Validation

```bash
# Should compile without errors
npx tsc schemas.ts --noEmit --strict
```

---

## After Phase 2: Cross-Check Types

- [ ] `types.ts` interfaces match database schema columns
- [ ] Enum values in `types.ts` match PostgreSQL enums in `schema.sql`
- [ ] JSONB attribute shapes match Zod schemas

---

## Quick Full Validation

Run all checks:

```bash
# 1. Validate JSON files
python validate_categories.py
python validate_attributes.py

# 2. TypeScript compile check
npx tsc --noEmit

# 3. Run against test data
node -e "
const { carAttributesSchema } = require('./schemas');
const testCar = {
  make: 'BMW',
  model: '320d',
  year: 2019,
  mileage: 85000,
  fuel: 'diesel',
  transmission: 'manual'
};
const result = carAttributesSchema.safeParse(testCar);
console.log(result.success ? 'PASS' : 'FAIL', result.error?.issues);
"
```

---

## Common Issues and Fixes

### Issue: "Duplicate key" error
**Fix**: Ensure each attribute `key` is unique within its category.

### Issue: "Missing bilingual field"
**Fix**: Every user-facing text needs both `_sr` and `_en` versions.

### Issue: "Select has no options"
**Fix**: All `select` and `multi_select` types need `options` array.

### Issue: "Dependent select missing parent"
**Fix**: `dependent_select` needs `depends_on` field pointing to parent attribute key.

### Issue: "Zod schema doesn't match attributes"
**Fix**: Regenerate Zod schema from attributes.json or manually sync.

---

## Validation Summary Template

Copy this to track your validation:

```
## Phase 0 Validation - [DATE]

categories.json:
- [ ] Structure valid
- [ ] All IDs unique
- [ ] 5 MVP categories present
- [ ] Bilingual names present

attributes.json:
- [ ] Structure valid
- [ ] All keys unique per category
- [ ] Select types have options
- [ ] Dependent selects configured
- [ ] MVP categories complete

## Phase 2 Validation - [DATE]

types.ts:
- [ ] Compiles without errors
- [ ] Matches schema.sql tables
- [ ] Enums match database

schemas.ts:
- [ ] Compiles without errors
- [ ] All MVP category schemas present
- [ ] Test data validates correctly
```
