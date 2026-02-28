// lib/category-attributes.ts
// Category-specific attribute schemas for dynamic form fields
// This defines what extra fields each category needs beyond the base listing fields

import { z } from 'zod';
import type { CategoryId } from './constants';

// ============================================================================
// FIELD TYPES
// ============================================================================

export type FieldType =
  | 'text'
  | 'number'
  | 'select'
  | 'multiselect'
  | 'boolean'
  | 'year';

export interface FieldOption {
  value: string;
  label: string;
}

export interface AttributeField {
  name: string;
  label: string;           // Serbian label for UI
  type: FieldType;
  required: boolean;
  placeholder?: string;
  options?: FieldOption[]; // For select/multiselect
  min?: number;            // For number fields
  max?: number;            // For number fields
  suffix?: string;         // e.g., "km", "m²"
}

// ============================================================================
// VEHICLES (Vozila)
// ============================================================================

export const vehicleBrands = [
  'Audi', 'BMW', 'Citroen', 'Dacia', 'Fiat', 'Ford', 'Honda', 'Hyundai',
  'Kia', 'Mazda', 'Mercedes-Benz', 'Nissan', 'Opel', 'Peugeot', 'Renault',
  'Seat', 'Škoda', 'Toyota', 'Volkswagen', 'Volvo', 'Ostalo'
] as const;

export const vehicleFuelTypes = [
  { value: 'benzin', label: 'Benzin' },
  { value: 'dizel', label: 'Dizel' },
  { value: 'hibrid', label: 'Hibrid' },
  { value: 'elektricni', label: 'Električni' },
  { value: 'plin', label: 'Plin (TNG/LPG)' },
] as const;

export const vehicleTransmissions = [
  { value: 'manuelni', label: 'Manuelni' },
  { value: 'automatik', label: 'Automatik' },
] as const;

export const vehicleBodyTypes = [
  { value: 'limuzina', label: 'Limuzina' },
  { value: 'hecbek', label: 'Hečbek' },
  { value: 'karavan', label: 'Karavan' },
  { value: 'suv', label: 'SUV / Džip' },
  { value: 'kupe', label: 'Kupe' },
  { value: 'kabriolet', label: 'Kabriolet' },
  { value: 'kombi', label: 'Kombi' },
  { value: 'pickup', label: 'Pick-up' },
] as const;

export const vehicleAttributesSchema = z.object({
  brand: z.string().min(1, 'Unesite marku vozila'),
  model: z.string().min(1, 'Unesite model vozila'),
  year: z.number().min(1950).max(new Date().getFullYear() + 1),
  mileage: z.number().min(0).max(999999).optional(),
  fuel: z.enum(['benzin', 'dizel', 'hibrid', 'elektricni', 'plin']),
  transmission: z.enum(['manuelni', 'automatik']).optional(),
  bodyType: z.enum(['limuzina', 'hecbek', 'karavan', 'suv', 'kupe', 'kabriolet', 'kombi', 'pickup']).optional(),
  engineCC: z.number().min(50).max(10000).optional(), // Cubic centimeters
  horsePower: z.number().min(1).max(2000).optional(),
});

export type VehicleAttributes = z.infer<typeof vehicleAttributesSchema>;

export const vehicleFields: AttributeField[] = [
  {
    name: 'brand',
    label: 'Marka',
    type: 'select',
    required: true,
    options: vehicleBrands.map(b => ({ value: b.toLowerCase(), label: b })),
  },
  { name: 'model', label: 'Model', type: 'text', required: true, placeholder: 'npr. Golf 7' },
  { name: 'year', label: 'Godište', type: 'year', required: true, min: 1950, max: new Date().getFullYear() + 1 },
  { name: 'mileage', label: 'Kilometraža', type: 'number', required: false, suffix: 'km', min: 0, max: 999999 },
  { name: 'fuel', label: 'Gorivo', type: 'select', required: true, options: [...vehicleFuelTypes] },
  { name: 'transmission', label: 'Menjač', type: 'select', required: false, options: [...vehicleTransmissions] },
  { name: 'bodyType', label: 'Karoserija', type: 'select', required: false, options: [...vehicleBodyTypes] },
  { name: 'engineCC', label: 'Kubikaža', type: 'number', required: false, suffix: 'cm³', min: 50, max: 10000 },
  { name: 'horsePower', label: 'Snaga', type: 'number', required: false, suffix: 'KS', min: 1, max: 2000 },
];

// ============================================================================
// REAL ESTATE / HOME (Kuća i bašta)
// ============================================================================

export const propertyTypes = [
  { value: 'stan', label: 'Stan' },
  { value: 'kuca', label: 'Kuća' },
  { value: 'vikendica', label: 'Vikendica' },
  { value: 'plac', label: 'Plac / Zemljište' },
  { value: 'garaza', label: 'Garaža' },
  { value: 'poslovni_prostor', label: 'Poslovni prostor' },
] as const;

export const transactionTypes = [
  { value: 'prodaja', label: 'Prodaja' },
  { value: 'izdavanje', label: 'Izdavanje' },
  { value: 'zamena', label: 'Zamena' },
] as const;

export const heatingTypes = [
  { value: 'centralno', label: 'Centralno grejanje' },
  { value: 'etazno', label: 'Etažno grejanje' },
  { value: 'ta_pec', label: 'TA peć' },
  { value: 'klima', label: 'Klima uređaj' },
  { value: 'gas', label: 'Gas' },
  { value: 'struja', label: 'Struja' },
  { value: 'cvrsto_gorivo', label: 'Čvrsto gorivo' },
] as const;

export const realEstateAttributesSchema = z.object({
  propertyType: z.enum(['stan', 'kuca', 'vikendica', 'plac', 'garaza', 'poslovni_prostor']),
  transactionType: z.enum(['prodaja', 'izdavanje', 'zamena']),
  sqm: z.number().min(1).max(10000),
  rooms: z.number().min(0).max(20).optional(),
  floor: z.number().min(-2).max(100).optional(),
  totalFloors: z.number().min(1).max(100).optional(),
  heating: z.enum(['centralno', 'etazno', 'ta_pec', 'klima', 'gas', 'struja', 'cvrsto_gorivo']).optional(),
  parking: z.boolean().optional(),
  furnished: z.boolean().optional(),
  yearBuilt: z.number().min(1800).max(new Date().getFullYear() + 5).optional(),
});

export type RealEstateAttributes = z.infer<typeof realEstateAttributesSchema>;

export const realEstateFields: AttributeField[] = [
  { name: 'propertyType', label: 'Tip nekretnine', type: 'select', required: true, options: [...propertyTypes] },
  { name: 'transactionType', label: 'Tip oglasa', type: 'select', required: true, options: [...transactionTypes] },
  { name: 'sqm', label: 'Kvadratura', type: 'number', required: true, suffix: 'm²', min: 1, max: 10000 },
  { name: 'rooms', label: 'Broj soba', type: 'number', required: false, min: 0, max: 20 },
  { name: 'floor', label: 'Sprat', type: 'number', required: false, min: -2, max: 100 },
  { name: 'totalFloors', label: 'Ukupno spratova', type: 'number', required: false, min: 1, max: 100 },
  { name: 'heating', label: 'Grejanje', type: 'select', required: false, options: [...heatingTypes] },
  { name: 'parking', label: 'Parking', type: 'boolean', required: false },
  { name: 'furnished', label: 'Namešten', type: 'boolean', required: false },
  { name: 'yearBuilt', label: 'Godina izgradnje', type: 'year', required: false, min: 1800 },
];

// ============================================================================
// ELECTRONICS (Elektronika)
// ============================================================================

export const electronicsTypes = [
  { value: 'telefon', label: 'Mobilni telefon' },
  { value: 'laptop', label: 'Laptop' },
  { value: 'desktop', label: 'Desktop računar' },
  { value: 'tablet', label: 'Tablet' },
  { value: 'tv', label: 'Televizor' },
  { value: 'konzola', label: 'Gaming konzola' },
  { value: 'foto', label: 'Foto oprema' },
  { value: 'audio', label: 'Audio oprema' },
  { value: 'komponente', label: 'Komponente' },
  { value: 'ostalo', label: 'Ostalo' },
] as const;

export const electronicsBrands = [
  'Apple', 'Samsung', 'Xiaomi', 'Huawei', 'Sony', 'LG', 'Lenovo', 'HP',
  'Dell', 'Asus', 'Acer', 'MSI', 'Razer', 'Canon', 'Nikon', 'JBL',
  'Bose', 'Marshall', 'Nintendo', 'PlayStation', 'Xbox', 'Ostalo'
] as const;

export const electronicsAttributesSchema = z.object({
  deviceType: z.enum(['telefon', 'laptop', 'desktop', 'tablet', 'tv', 'konzola', 'foto', 'audio', 'komponente', 'ostalo']).optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  storageGB: z.number().min(1).max(20000).optional(),
  ramGB: z.number().min(1).max(256).optional(),
  screenSize: z.number().min(1).max(100).optional(), // inches
});

export type ElectronicsAttributes = z.infer<typeof electronicsAttributesSchema>;

export const electronicsFields: AttributeField[] = [
  { name: 'deviceType', label: 'Tip uređaja', type: 'select', required: false, options: [...electronicsTypes] },
  { name: 'brand', label: 'Marka', type: 'select', required: false, options: electronicsBrands.map(b => ({ value: b.toLowerCase(), label: b })) },
  { name: 'model', label: 'Model', type: 'text', required: false, placeholder: 'npr. iPhone 15 Pro' },
  { name: 'storageGB', label: 'Memorija', type: 'number', required: false, suffix: 'GB', min: 1, max: 20000 },
  { name: 'ramGB', label: 'RAM', type: 'number', required: false, suffix: 'GB', min: 1, max: 256 },
  { name: 'screenSize', label: 'Dijagonala ekrana', type: 'number', required: false, suffix: '"', min: 1, max: 100 },
];

// ============================================================================
// FASHION (Moda)
// ============================================================================

export const clothingSizes = [
  { value: 'xxs', label: 'XXS' },
  { value: 'xs', label: 'XS' },
  { value: 's', label: 'S' },
  { value: 'm', label: 'M' },
  { value: 'l', label: 'L' },
  { value: 'xl', label: 'XL' },
  { value: 'xxl', label: 'XXL' },
  { value: '3xl', label: '3XL' },
] as const;

export const fashionGenders = [
  { value: 'musko', label: 'Muško' },
  { value: 'zensko', label: 'Žensko' },
  { value: 'unisex', label: 'Unisex' },
] as const;

export const fashionTypes = [
  { value: 'odeca', label: 'Odeća' },
  { value: 'obuca', label: 'Obuća' },
  { value: 'torbe', label: 'Torbe' },
  { value: 'nakit', label: 'Nakit' },
  { value: 'satovi', label: 'Satovi' },
  { value: 'accessories', label: 'Dodaci' },
] as const;

export const fashionAttributesSchema = z.object({
  fashionType: z.enum(['odeca', 'obuca', 'torbe', 'nakit', 'satovi', 'accessories']).optional(),
  size: z.string().optional(),
  shoeSize: z.number().min(15).max(55).optional(),
  gender: z.enum(['musko', 'zensko', 'unisex']).optional(),
  brand: z.string().optional(),
  material: z.string().optional(),
});

export type FashionAttributes = z.infer<typeof fashionAttributesSchema>;

export const fashionFields: AttributeField[] = [
  { name: 'fashionType', label: 'Tip', type: 'select', required: false, options: [...fashionTypes] },
  { name: 'size', label: 'Veličina (odeća)', type: 'select', required: false, options: [...clothingSizes] },
  { name: 'shoeSize', label: 'Broj (obuća)', type: 'number', required: false, min: 15, max: 55 },
  { name: 'gender', label: 'Pol', type: 'select', required: false, options: [...fashionGenders] },
  { name: 'brand', label: 'Brend', type: 'text', required: false, placeholder: 'npr. Nike, Zara' },
  { name: 'material', label: 'Materijal', type: 'text', required: false, placeholder: 'npr. Koža, Pamuk' },
];

// ============================================================================
// SPORTS (Sport i rekreacija)
// ============================================================================

export const sportTypes = [
  { value: 'fitness', label: 'Fitness oprema' },
  { value: 'bicikli', label: 'Bicikli' },
  { value: 'fudbal', label: 'Fudbal' },
  { value: 'kosarka', label: 'Košarka' },
  { value: 'tenis', label: 'Tenis' },
  { value: 'skijanje', label: 'Skijanje / Snowboard' },
  { value: 'plivanje', label: 'Plivanje' },
  { value: 'kampovanje', label: 'Kampovanje' },
  { value: 'lov_ribolov', label: 'Lov i ribolov' },
  { value: 'ostalo', label: 'Ostalo' },
] as const;

export const sportsAttributesSchema = z.object({
  sportType: z.enum(['fitness', 'bicikli', 'fudbal', 'kosarka', 'tenis', 'skijanje', 'plivanje', 'kampovanje', 'lov_ribolov', 'ostalo']).optional(),
  brand: z.string().optional(),
  size: z.string().optional(),
  forAge: z.enum(['deca', 'odrasli', 'svi']).optional(),
});

export type SportsAttributes = z.infer<typeof sportsAttributesSchema>;

export const sportsFields: AttributeField[] = [
  { name: 'sportType', label: 'Vrsta sporta', type: 'select', required: false, options: [...sportTypes] },
  { name: 'brand', label: 'Marka', type: 'text', required: false, placeholder: 'npr. Adidas, Nike' },
  { name: 'size', label: 'Veličina', type: 'text', required: false, placeholder: 'npr. L, 54cm' },
  {
    name: 'forAge', label: 'Za uzrast', type: 'select', required: false, options: [
      { value: 'deca', label: 'Deca' },
      { value: 'odrasli', label: 'Odrasli' },
      { value: 'svi', label: 'Svi uzrasti' },
    ]
  },
];

// ============================================================================
// KIDS (Deca i bebe)
// ============================================================================

export const kidsAgeGroups = [
  { value: '0-6m', label: '0-6 meseci' },
  { value: '6-12m', label: '6-12 meseci' },
  { value: '1-2g', label: '1-2 godine' },
  { value: '2-4g', label: '2-4 godine' },
  { value: '4-6g', label: '4-6 godina' },
  { value: '6-10g', label: '6-10 godina' },
  { value: '10-14g', label: '10-14 godina' },
  { value: '14+', label: '14+ godina' },
] as const;

export const kidsGenders = [
  { value: 'decaci', label: 'Dečaci' },
  { value: 'devojcice', label: 'Devojčice' },
  { value: 'unisex', label: 'Unisex' },
] as const;

export const kidsTypes = [
  { value: 'odeca', label: 'Odeća' },
  { value: 'obuca', label: 'Obuća' },
  { value: 'igracke', label: 'Igračke' },
  { value: 'oprema', label: 'Oprema za bebe' },
  { value: 'knjige', label: 'Knjige' },
  { value: 'skola', label: 'Školski pribor' },
  { value: 'ostalo', label: 'Ostalo' },
] as const;

export const kidsAttributesSchema = z.object({
  kidsType: z.enum(['odeca', 'obuca', 'igracke', 'oprema', 'knjige', 'skola', 'ostalo']).optional(),
  ageGroup: z.enum(['0-6m', '6-12m', '1-2g', '2-4g', '4-6g', '6-10g', '10-14g', '14+']).optional(),
  gender: z.enum(['decaci', 'devojcice', 'unisex']).optional(),
  brand: z.string().optional(),
});

export type KidsAttributes = z.infer<typeof kidsAttributesSchema>;

export const kidsFields: AttributeField[] = [
  { name: 'kidsType', label: 'Tip', type: 'select', required: false, options: [...kidsTypes] },
  { name: 'ageGroup', label: 'Uzrast', type: 'select', required: false, options: [...kidsAgeGroups] },
  { name: 'gender', label: 'Pol', type: 'select', required: false, options: [...kidsGenders] },
  { name: 'brand', label: 'Marka', type: 'text', required: false },
];

// ============================================================================
// PETS (Ljubimci)
// ============================================================================

export const petTypes = [
  { value: 'pas', label: 'Pas' },
  { value: 'macka', label: 'Mačka' },
  { value: 'ptica', label: 'Ptica' },
  { value: 'riba', label: 'Riba' },
  { value: 'gmizavac', label: 'Gmizavac' },
  { value: 'glodari', label: 'Glodari' },
  { value: 'ostalo', label: 'Ostalo' },
] as const;

export const petListingTypes = [
  { value: 'zivotinja', label: 'Životinja na prodaju/poklon' },
  { value: 'oprema', label: 'Oprema za ljubimce' },
  { value: 'hrana', label: 'Hrana za ljubimce' },
  { value: 'usluge', label: 'Usluge (šišanje, čuvanje...)' },
] as const;

export const petsAttributesSchema = z.object({
  listingType: z.enum(['zivotinja', 'oprema', 'hrana', 'usluge']).optional(),
  petType: z.enum(['pas', 'macka', 'ptica', 'riba', 'gmizavac', 'glodari', 'ostalo']).optional(),
  breed: z.string().optional(),
  age: z.string().optional(), // e.g., "3 meseca", "2 godine"
  vaccinated: z.boolean().optional(),
  pedigree: z.boolean().optional(),
});

export type PetsAttributes = z.infer<typeof petsAttributesSchema>;

export const petsFields: AttributeField[] = [
  { name: 'listingType', label: 'Vrsta oglasa', type: 'select', required: false, options: [...petListingTypes] },
  { name: 'petType', label: 'Vrsta životinje', type: 'select', required: false, options: [...petTypes] },
  { name: 'breed', label: 'Rasa', type: 'text', required: false, placeholder: 'npr. Labrador, Persijska' },
  { name: 'age', label: 'Starost', type: 'text', required: false, placeholder: 'npr. 3 meseca, 2 godine' },
  { name: 'vaccinated', label: 'Vakcinisan', type: 'boolean', required: false },
  { name: 'pedigree', label: 'Ima pedigre', type: 'boolean', required: false },
];

// ============================================================================
// SERVICES (Usluge)
// ============================================================================

export const serviceTypes = [
  { value: 'it', label: 'IT usluge' },
  { value: 'prevoz', label: 'Prevoz i selidbe' },
  { value: 'gradevina', label: 'Građevinske usluge' },
  { value: 'popravke', label: 'Popravke i održavanje' },
  { value: 'edukacija', label: 'Časovi i edukacija' },
  { value: 'lepota', label: 'Lepota i nega' },
  { value: 'zdravlje', label: 'Zdravlje' },
  { value: 'dogadjaji', label: 'Organizacija događaja' },
  { value: 'ostalo', label: 'Ostale usluge' },
] as const;

export const priceTypes = [
  { value: 'fiksna', label: 'Fiksna cena' },
  { value: 'po_satu', label: 'Po satu' },
  { value: 'po_dogovoru', label: 'Po dogovoru' },
] as const;

export const servicesAttributesSchema = z.object({
  serviceType: z.enum(['it', 'prevoz', 'gradevina', 'popravke', 'edukacija', 'lepota', 'zdravlje', 'dogadjaji', 'ostalo']).optional(),
  priceType: z.enum(['fiksna', 'po_satu', 'po_dogovoru']).optional(),
  experience: z.string().optional(), // e.g., "5+ godina iskustva"
  availability: z.string().optional(), // e.g., "Radnim danima 9-17h"
});

export type ServicesAttributes = z.infer<typeof servicesAttributesSchema>;

export const servicesFields: AttributeField[] = [
  { name: 'serviceType', label: 'Vrsta usluge', type: 'select', required: false, options: [...serviceTypes] },
  { name: 'priceType', label: 'Tip cene', type: 'select', required: false, options: [...priceTypes] },
  { name: 'experience', label: 'Iskustvo', type: 'text', required: false, placeholder: 'npr. 5+ godina' },
  { name: 'availability', label: 'Dostupnost', type: 'text', required: false, placeholder: 'npr. Radnim danima' },
];

// ============================================================================
// COMBINED SCHEMA & HELPERS
// ============================================================================

// Union of all attribute schemas (for validation)
export const categoryAttributesSchema = z.union([
  vehicleAttributesSchema,
  realEstateAttributesSchema,
  electronicsAttributesSchema,
  fashionAttributesSchema,
  sportsAttributesSchema,
  kidsAttributesSchema,
  petsAttributesSchema,
  servicesAttributesSchema,
]).optional();

// Map category ID to its fields
export const categoryFieldsMap: Partial<Record<CategoryId, AttributeField[]>> = {
  vozila: vehicleFields,
  nekretnine: realEstateFields,
  elektronika: electronicsFields,
  odeca: fashionFields,
  sport: sportsFields,
  'kucni-ljubimci': petsFields,
  ostalo: servicesFields,
};

// Map category ID to its Zod schema
export const categorySchemaMap: Partial<Record<CategoryId, z.ZodTypeAny>> = {
  vozila: vehicleAttributesSchema,
  nekretnine: realEstateAttributesSchema,
  elektronika: electronicsAttributesSchema,
  odeca: fashionAttributesSchema,
  sport: sportsAttributesSchema,
  'kucni-ljubimci': petsAttributesSchema,
  ostalo: servicesAttributesSchema,
};

// Get fields for a category
export function getCategoryFields(categoryId: CategoryId): AttributeField[] {
  return categoryFieldsMap[categoryId] || [];
}

// Get schema for a category
export function getCategorySchema(categoryId: CategoryId): z.ZodTypeAny {
  return categorySchemaMap[categoryId] || z.object({});
}

// Validate attributes for a category
export function validateCategoryAttributes(
  categoryId: CategoryId,
  attributes: unknown
): { success: true; data: Record<string, unknown> } | { success: false; errors: string[] } {
  const schema = getCategorySchema(categoryId);
  const result = schema.safeParse(attributes);

  if (result.success) {
    return { success: true, data: result.data as Record<string, unknown> };
  }

  const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
  return { success: false, errors };
}

// Type for all possible attributes
export type CategoryAttributes =
  | VehicleAttributes
  | RealEstateAttributes
  | ElectronicsAttributes
  | FashionAttributes
  | SportsAttributes
  | KidsAttributes
  | PetsAttributes
  | ServicesAttributes;
