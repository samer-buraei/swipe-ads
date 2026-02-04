# EXECUTE: PHASE 0 - RESEARCH (Claude) - UPDATED v2

## MVP Scope Update
For MVP, we're limiting to **5 main categories** to reduce complexity:
1. Vehicles (Cars)
2. Real Estate (Apartments)
3. Electronics (Phones)
4. Fashion
5. Other

The prompts below have been updated to reflect MVP scope.

## Instructions

1. Open Claude (claude.ai)
2. **Paste APP-CONTRACT.md first**
3. Enable web search (if available)
4. Execute Prompt 0A first
5. Save output as `categories.json`
6. Execute Prompt 0B (paste categories.json as context)
7. Save output as `attributes.json`
8. **Validate outputs with Validation_Checklist.md**

---

## PROMPT 0A: Category Structure Extraction

Copy everything below and paste into Claude:

```
# Task: Extract Complete Category Structure for Serbian Classifieds App

## Context
I'm building SwipeMarket, a Serbian classifieds app (like KupujemProdajem and HaloOglasi). I need you to extract and compile the complete category and subcategory structure used by major Serbian classifieds sites.

## Instructions

### Step 1: Research These Sites
Use web search to examine:
1. KupujemProdajem.com - main categories
2. HaloOglasi.com - categories
3. PolovniAutomobili.com - vehicle categories

### Step 2: Extract Category Tree
For each main category, extract:
- Category name in Serbian (original)
- Category name in English (translate)
- Subcategories (up to 3 levels deep)
- Appropriate icon (lucide icon name)

### Step 3: Required Categories
Ensure you include AT MINIMUM:

**Vozila / Vehicles**
- Automobili / Cars (with body types as sub-sub)
- Motori / Motorcycles
- Kamioni i prikolice / Trucks & Trailers
- Delovi i oprema / Parts & Equipment

**Nekretnine / Real Estate**
- Stanovi prodaja / Apartments for Sale
- Stanovi izdavanje / Apartments for Rent
- Kuće prodaja / Houses for Sale
- Kuće izdavanje / Houses for Rent
- Zemljište / Land
- Poslovni prostor / Commercial

**Elektronika / Electronics**
- Mobilni telefoni / Mobile Phones
- Računari i laptopovi / Computers & Laptops
- TV, Audio, Video
- Foto i video oprema / Photo & Video
- Konzole i igrice / Gaming

**Moda / Fashion**
- Muška odeća / Men's Clothing
- Ženska odeća / Women's Clothing
- Dečija odeća / Kids' Clothing
- Obuća / Footwear
- Satovi i nakit / Watches & Jewelry
- Torbe i aksesoari / Bags & Accessories

**Kuća i bašta / Home & Garden**
- Nameštaj / Furniture
- Bela tehnika / Appliances
- Kućni aparati / Home Appliances
- Alati / Tools
- Bašta / Garden

**Posao / Jobs**
- Puno radno vreme / Full-time
- Honorarno / Part-time
- Sezonski / Seasonal
- Praksa / Internship

**Usluge / Services**
- Majstori / Craftsmen
- Prevoz / Transport
- Časovi / Lessons
- IT usluge / IT Services

**Plus**: Životinje/Pets, Sport, Muzika/Music, Knjige/Books, Dečiji svet/Kids, Lično/Personal, Biznis/Business, Kolekcionarstvo/Collectibles

## Output Format

Return a valid JSON file with this exact structure:

```json
{
  "version": "1.0",
  "generated": "2024-01-XX",
  "categories": [
    {
      "id": "vehicles",
      "slug": "vozila",
      "name_sr": "Vozila",
      "name_en": "Vehicles",
      "icon": "car",
      "sort_order": 1,
      "subcategories": [
        {
          "id": "cars",
          "slug": "automobili",
          "name_sr": "Automobili",
          "name_en": "Cars",
          "icon": "car-front",
          "sort_order": 1,
          "subcategories": [
            {
              "id": "cars-sale",
              "slug": "automobili-prodaja",
              "name_sr": "Prodaja",
              "name_en": "For Sale",
              "icon": null,
              "sort_order": 1
            },
            {
              "id": "cars-rent",
              "slug": "automobili-izdavanje",
              "name_sr": "Izdavanje",
              "name_en": "For Rent",
              "icon": null,
              "sort_order": 2
            }
          ]
        }
      ]
    }
  ]
}
```

## Requirements

**MVP SCOPE (V1):** Focus on 5 main categories:
1. Vozila / Vehicles (with Cars subcategory)
2. Nekretnine / Real Estate (with Apartments subcategories)
3. Elektronika / Electronics (with Mobile Phones subcategory)
4. Moda / Fashion (basic)
5. Ostalo / Other (catch-all)

For MVP:
- Include exactly 5 main categories
- Include 10-15 subcategories total
- All names must be bilingual (Serbian + English)
- Use lucide icon names (car, home, smartphone, shirt, etc.)
- Slugs should be URL-safe (lowercase, hyphens)
- IDs should be unique across all categories

**NOTE:** Keep the schema extensible. In V2, we'll expand to 15+ categories.

Return ONLY the JSON output, no other text.
```

---

## PROMPT 0B: Attribute Extraction

**IMPORTANT**: After getting categories.json from Prompt 0A, paste it as context along with this prompt.

Copy everything below and paste into Claude:

```
# Task: Extract Category-Specific Attributes for Serbian Classifieds

## Context
I have the category structure for SwipeMarket. Now I need to extract the exact attributes (form fields and filter options) for each category, based on what KupujemProdajem, HaloOglasi, and PolovniAutomobili use.

## Categories Reference
[PASTE YOUR categories.json HERE]

## Instructions

### Step 1: Research Attribute Fields
For each major category, examine the posting forms and search filters on Serbian classifieds sites:
- What fields are required when posting?
- What filters are available when searching?
- What are the exact options for dropdown fields?

### Step 2: Attribute Types
Each attribute should have a type:
- `text` - Free text input
- `number` - Numeric input
- `select` - Single selection dropdown
- `multi_select` - Multiple selection checkboxes
- `boolean` - Yes/No toggle
- `range` - Min-Max range (like year: 2015-2024)
- `date` - Date picker
- `dependent_select` - Options depend on another field (model depends on make)

### Step 3: Required Attributes by Category

#### AUTOMOBILI (Cars) - Most Important
Extract ALL of these:
- Marka / Make (select) - BMW, Audi, Mercedes, VW, Opel, Ford, etc.
- Model / Model (dependent_select) - depends on Make
- Godište / Year (range) - 1980-2026
- Kilometraža / Mileage (number) - in km
- Gorivo / Fuel (select) - Benzin, Dizel, TNG, Hibrid, Električni, Metan
- Menjač / Transmission (select) - Manuelni, Automatski, Poluautomatski
- Kubikaža / Engine Capacity (number) - in cm³
- Snaga / Power (number) - in kW or KS
- Karoserija / Body Type (select) - Limuzina, Hečbek, Karavan, SUV, Kupe, Kabrio, etc.
- Pogon / Drive (select) - Prednji, Zadnji, 4x4
- Boja / Color (select) - Bela, Crna, Siva, Srebrna, Plava, Crvena, etc.
- Broj vrata / Doors (select) - 2/3, 4/5
- Broj sedišta / Seats (select)
- Emisiona klasa / Emission (select) - Euro 1-6
- Klima / AC (select) - Nema, Manuelna, Automatska
- Registrovan do / Registered until (date)
- Poreklo / Origin (select) - Domaće, Uvoz
- Oštećen / Damaged (boolean)
- Zamena / Exchange (boolean)
- Oprema / Features (multi_select) - ABS, ESP, Airbag, Tempomat, Parking senzori, Navigacija, Kožna sedišta, Krovni otvor, Xenon, LED, etc.

#### STANOVI (Apartments) - Second Most Important
Extract ALL of these:
- Tip / Type (select) - Prodaja, Izdavanje
- Kvadratura / Area (number) - in m²
- Broj soba / Rooms (select) - Garsonjera, Jednosoban, Jednoiposoban, Dvosoban, Dvoiposoban, Trosoban, etc.
- Sprat / Floor (select) - Podrum, Prizemlje, 1, 2, 3, ..., Potkrovlje, Penthaus
- Ukupno spratova / Total Floors (number)
- Grejanje / Heating (select) - Centralno, Etažno, Gas, TA peć, Struja, etc.
- Namešteno / Furnished (select) - Prazno, Polunamešten, Namešten
- Uknjiženo / Registered (boolean)
- Tip gradnje / Construction (select) - Stara gradnja, Novogradnja, U izgradnji
- Parking / Parking (select) - Nema, Ulični, Garaža
- Lift / Elevator (boolean)
- Terasa / Terrace (boolean)
- Lodža / Balcony (boolean)
- Podrum / Basement (boolean)
- Oprema / Amenities (multi_select) - Klima, Interfon, Video nadzor, Alarm, Internet, Kablovska, etc.

#### MOBILNI TELEFONI (Mobile Phones)
- Marka / Brand (select) - Apple, Samsung, Xiaomi, Huawei, OnePlus, Google, etc.
- Model / Model (text)
- Stanje / Condition (select) - Nov, Kao nov, Korišćen, Oštećen
- Memorija / Storage (select) - 32GB, 64GB, 128GB, 256GB, 512GB, 1TB
- RAM (select) - 4GB, 6GB, 8GB, 12GB, 16GB
- Boja / Color (select)
- Garancija / Warranty (boolean)

#### RAČUNARI (Computers)
- Tip / Type (select) - Desktop, Laptop, All-in-one
- Marka / Brand (select)
- Procesor / Processor (select) - Intel i3, i5, i7, i9, AMD Ryzen 3, 5, 7, 9
- RAM (select)
- Storage tip / Storage type (select) - HDD, SSD, NVMe
- Storage kapacitet / Storage size (select)
- Grafička / GPU (select)
- Dijagonala ekrana / Screen size (number) - for laptops

#### Other categories
For remaining categories, include at least:
- Stanje / Condition (select) - Novo, Korišćeno, Oštećeno
- Brand/Marka where applicable
- Size/Veličina where applicable

## Output Format

Return valid JSON:

```json
{
  "version": "1.0",
  "attributes": {
    "cars": [
      {
        "key": "make",
        "label_sr": "Marka",
        "label_en": "Make",
        "type": "select",
        "required": true,
        "filterable": true,
        "searchable": false,
        "show_on_card": true,
        "sort_order": 1,
        "group": "basic",
        "group_sr": "Osnovni podaci",
        "group_en": "Basic Info",
        "options": [
          {"value": "audi", "label_sr": "Audi", "label_en": "Audi"},
          {"value": "bmw", "label_sr": "BMW", "label_en": "BMW"},
          {"value": "mercedes", "label_sr": "Mercedes-Benz", "label_en": "Mercedes-Benz"}
        ]
      },
      {
        "key": "model",
        "label_sr": "Model",
        "label_en": "Model",
        "type": "dependent_select",
        "depends_on": "make",
        "required": true,
        "filterable": true,
        "sort_order": 2,
        "group": "basic",
        "dependent_options": {
          "bmw": [
            {"value": "series1", "label_sr": "Serija 1", "label_en": "1 Series"},
            {"value": "series3", "label_sr": "Serija 3", "label_en": "3 Series"},
            {"value": "series5", "label_sr": "Serija 5", "label_en": "5 Series"}
          ],
          "audi": [
            {"value": "a3", "label_sr": "A3", "label_en": "A3"},
            {"value": "a4", "label_sr": "A4", "label_en": "A4"}
          ]
        }
      },
      {
        "key": "year",
        "label_sr": "Godište",
        "label_en": "Year",
        "type": "range",
        "required": true,
        "filterable": true,
        "min_value": 1980,
        "max_value": 2026,
        "sort_order": 3,
        "group": "basic"
      },
      {
        "key": "mileage",
        "label_sr": "Kilometraža",
        "label_en": "Mileage",
        "type": "number",
        "required": true,
        "filterable": true,
        "unit": "km",
        "min_value": 0,
        "max_value": 1000000,
        "sort_order": 4,
        "group": "basic"
      },
      {
        "key": "features",
        "label_sr": "Oprema",
        "label_en": "Features",
        "type": "multi_select",
        "required": false,
        "filterable": true,
        "sort_order": 20,
        "group": "features",
        "group_sr": "Oprema",
        "group_en": "Features",
        "options": [
          {"value": "abs", "label_sr": "ABS", "label_en": "ABS"},
          {"value": "esp", "label_sr": "ESP", "label_en": "ESP"}
        ]
      }
    ],
    "apartments-sale": [
      // ... apartment attributes
    ],
    "apartments-rent": [
      // ... apartment attributes (may share with sale)
    ],
    "mobile-phones": [
      // ... phone attributes
    ]
  }
}
```

## Requirements

**MVP SCOPE (V1):** Focus on attributes for 5 categories:

COMPLETE attributes for:
- `cars` - All fields (make, model, year, mileage, fuel, transmission, etc.)
- `apartments-sale` - All fields (rooms, area, floor, heating, etc.)
- `apartments-rent` - Same as sale + deposit, min lease

BASIC attributes for:
- `mobile-phones` - brand, condition, storage
- `fashion` - category, size, condition, brand
- `other` - condition only (generic catch-all)

All options must have Serbian AND English labels.
Include at least 15 car makes with 3+ models each for top makes (BMW, Audi, Mercedes, VW).
Include realistic option values based on actual Serbian market.

**NOTE:** Keep extensible for V2 when we add more categories.

Return ONLY the JSON output.
```

---

## After Phase 0

You should have:
- `categories.json` - MVP category tree (5 main, ~10-15 subcategories)
- `attributes.json` - Complete attributes for cars, apartments; basic for others

### IMPORTANT: Validate Your Outputs!

Run the validation checklist to catch issues early:

```bash
# Open Validation_Checklist.md and run the Python scripts
# OR manually check:
# - All IDs unique?
# - All slugs URL-safe?
# - Bilingual fields present?
# - Select types have options?
```

See `Validation_Checklist.md` for complete validation steps.

**Next**: Proceed to EXECUTE-02-PHASE1-CLAUDE.md
