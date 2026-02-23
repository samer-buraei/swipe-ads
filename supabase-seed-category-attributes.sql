-- supabase-seed-category-attributes.sql
-- Seeds the category_attributes table with all attribute fields from lib/category-attributes.ts
-- Run this in the Supabase SQL Editor AFTER running supabase-schema.sql

-- ============================================================================
-- VEHICLES (Vozila) — category_id = 'vehicles'
-- ============================================================================
INSERT INTO category_attributes (category_id, key, label, type, required, options, "order") VALUES
  ('vehicles', 'brand',        'Marka',       'SELECT',  true,  '[{"value":"audi","label":"Audi"},{"value":"bmw","label":"BMW"},{"value":"citroen","label":"Citroen"},{"value":"dacia","label":"Dacia"},{"value":"fiat","label":"Fiat"},{"value":"ford","label":"Ford"},{"value":"honda","label":"Honda"},{"value":"hyundai","label":"Hyundai"},{"value":"kia","label":"Kia"},{"value":"mazda","label":"Mazda"},{"value":"mercedes-benz","label":"Mercedes-Benz"},{"value":"nissan","label":"Nissan"},{"value":"opel","label":"Opel"},{"value":"peugeot","label":"Peugeot"},{"value":"renault","label":"Renault"},{"value":"seat","label":"Seat"},{"value":"škoda","label":"Škoda"},{"value":"toyota","label":"Toyota"},{"value":"volkswagen","label":"Volkswagen"},{"value":"volvo","label":"Volvo"},{"value":"ostalo","label":"Ostalo"}]', 1),
  ('vehicles', 'model',        'Model',       'TEXT',    true,  null, 2),
  ('vehicles', 'year',         'Godište',     'NUMBER',  true,  '{"min":1950,"max":2027}', 3),
  ('vehicles', 'mileage',      'Kilometraža', 'NUMBER',  false, '{"min":0,"max":999999,"suffix":"km"}', 4),
  ('vehicles', 'fuel',         'Gorivo',      'SELECT',  true,  '[{"value":"benzin","label":"Benzin"},{"value":"dizel","label":"Dizel"},{"value":"hibrid","label":"Hibrid"},{"value":"elektricni","label":"Električni"},{"value":"plin","label":"Plin (TNG/LPG)"}]', 5),
  ('vehicles', 'transmission', 'Menjač',      'SELECT',  false, '[{"value":"manuelni","label":"Manuelni"},{"value":"automatik","label":"Automatik"}]', 6),
  ('vehicles', 'bodyType',     'Karoserija',  'SELECT',  false, '[{"value":"limuzina","label":"Limuzina"},{"value":"hecbek","label":"Hečbek"},{"value":"karavan","label":"Karavan"},{"value":"suv","label":"SUV / Džip"},{"value":"kupe","label":"Kupe"},{"value":"kabriolet","label":"Kabriolet"},{"value":"kombi","label":"Kombi"},{"value":"pickup","label":"Pick-up"}]', 7),
  ('vehicles', 'engineCC',     'Kubikaža',    'NUMBER',  false, '{"min":50,"max":10000,"suffix":"cm³"}', 8),
  ('vehicles', 'horsePower',   'Snaga',       'NUMBER',  false, '{"min":1,"max":2000,"suffix":"KS"}', 9);

-- ============================================================================
-- HOME / REAL ESTATE (Kuća i bašta) — category_id = 'home'
-- ============================================================================
INSERT INTO category_attributes (category_id, key, label, type, required, options, "order") VALUES
  ('home', 'propertyType',    'Tip nekretnine',      'SELECT',  true,  '[{"value":"stan","label":"Stan"},{"value":"kuca","label":"Kuća"},{"value":"vikendica","label":"Vikendica"},{"value":"plac","label":"Plac / Zemljište"},{"value":"garaza","label":"Garaža"},{"value":"poslovni_prostor","label":"Poslovni prostor"}]', 1),
  ('home', 'transactionType', 'Tip oglasa',          'SELECT',  true,  '[{"value":"prodaja","label":"Prodaja"},{"value":"izdavanje","label":"Izdavanje"},{"value":"zamena","label":"Zamena"}]', 2),
  ('home', 'sqm',             'Kvadratura',          'NUMBER',  true,  '{"min":1,"max":10000,"suffix":"m²"}', 3),
  ('home', 'rooms',           'Broj soba',           'NUMBER',  false, '{"min":0,"max":20}', 4),
  ('home', 'floor',           'Sprat',               'NUMBER',  false, '{"min":-2,"max":100}', 5),
  ('home', 'totalFloors',     'Ukupno spratova',     'NUMBER',  false, '{"min":1,"max":100}', 6),
  ('home', 'heating',         'Grejanje',            'SELECT',  false, '[{"value":"centralno","label":"Centralno grejanje"},{"value":"etazno","label":"Etažno grejanje"},{"value":"ta_pec","label":"TA peć"},{"value":"klima","label":"Klima uređaj"},{"value":"gas","label":"Gas"},{"value":"struja","label":"Struja"},{"value":"cvrsto_gorivo","label":"Čvrsto gorivo"}]', 7),
  ('home', 'parking',         'Parking',             'BOOLEAN', false, null, 8),
  ('home', 'furnished',       'Namešten',            'BOOLEAN', false, null, 9),
  ('home', 'yearBuilt',       'Godina izgradnje',    'NUMBER',  false, '{"min":1800,"max":2031}', 10);

-- ============================================================================
-- ELECTRONICS (Elektronika) — category_id = 'electronics'
-- ============================================================================
INSERT INTO category_attributes (category_id, key, label, type, required, options, "order") VALUES
  ('electronics', 'deviceType', 'Tip uređaja',       'SELECT',  false, '[{"value":"telefon","label":"Mobilni telefon"},{"value":"laptop","label":"Laptop"},{"value":"desktop","label":"Desktop računar"},{"value":"tablet","label":"Tablet"},{"value":"tv","label":"Televizor"},{"value":"konzola","label":"Gaming konzola"},{"value":"foto","label":"Foto oprema"},{"value":"audio","label":"Audio oprema"},{"value":"komponente","label":"Komponente"},{"value":"ostalo","label":"Ostalo"}]', 1),
  ('electronics', 'brand',      'Marka',             'SELECT',  false, '[{"value":"apple","label":"Apple"},{"value":"samsung","label":"Samsung"},{"value":"xiaomi","label":"Xiaomi"},{"value":"huawei","label":"Huawei"},{"value":"sony","label":"Sony"},{"value":"lg","label":"LG"},{"value":"lenovo","label":"Lenovo"},{"value":"hp","label":"HP"},{"value":"dell","label":"Dell"},{"value":"asus","label":"Asus"},{"value":"acer","label":"Acer"},{"value":"msi","label":"MSI"},{"value":"razer","label":"Razer"},{"value":"canon","label":"Canon"},{"value":"nikon","label":"Nikon"},{"value":"jbl","label":"JBL"},{"value":"bose","label":"Bose"},{"value":"marshall","label":"Marshall"},{"value":"nintendo","label":"Nintendo"},{"value":"playstation","label":"PlayStation"},{"value":"xbox","label":"Xbox"},{"value":"ostalo","label":"Ostalo"}]', 2),
  ('electronics', 'model',      'Model',             'TEXT',    false, null, 3),
  ('electronics', 'storageGB',  'Memorija',           'NUMBER',  false, '{"min":1,"max":20000,"suffix":"GB"}', 4),
  ('electronics', 'ramGB',      'RAM',                'NUMBER',  false, '{"min":1,"max":256,"suffix":"GB"}', 5),
  ('electronics', 'screenSize', 'Dijagonala ekrana',  'NUMBER',  false, '{"min":1,"max":100,"suffix":"\""}', 6);

-- ============================================================================
-- FASHION (Moda) — category_id = 'fashion'
-- ============================================================================
INSERT INTO category_attributes (category_id, key, label, type, required, options, "order") VALUES
  ('fashion', 'fashionType', 'Tip',                'SELECT',  false, '[{"value":"odeca","label":"Odeća"},{"value":"obuca","label":"Obuća"},{"value":"torbe","label":"Torbe"},{"value":"nakit","label":"Nakit"},{"value":"satovi","label":"Satovi"},{"value":"accessories","label":"Dodaci"}]', 1),
  ('fashion', 'size',        'Veličina (odeća)',   'SELECT',  false, '[{"value":"xxs","label":"XXS"},{"value":"xs","label":"XS"},{"value":"s","label":"S"},{"value":"m","label":"M"},{"value":"l","label":"L"},{"value":"xl","label":"XL"},{"value":"xxl","label":"XXL"},{"value":"3xl","label":"3XL"}]', 2),
  ('fashion', 'shoeSize',    'Broj (obuća)',       'NUMBER',  false, '{"min":15,"max":55}', 3),
  ('fashion', 'gender',      'Pol',                'SELECT',  false, '[{"value":"musko","label":"Muško"},{"value":"zensko","label":"Žensko"},{"value":"unisex","label":"Unisex"}]', 4),
  ('fashion', 'brand',       'Brend',              'TEXT',    false, null, 5),
  ('fashion', 'material',    'Materijal',          'TEXT',    false, null, 6);

-- ============================================================================
-- SPORTS (Sport i rekreacija) — category_id = 'sports'
-- ============================================================================
INSERT INTO category_attributes (category_id, key, label, type, required, options, "order") VALUES
  ('sports', 'sportType', 'Vrsta sporta', 'SELECT',  false, '[{"value":"fitness","label":"Fitness oprema"},{"value":"bicikli","label":"Bicikli"},{"value":"fudbal","label":"Fudbal"},{"value":"kosarka","label":"Košarka"},{"value":"tenis","label":"Tenis"},{"value":"skijanje","label":"Skijanje / Snowboard"},{"value":"plivanje","label":"Plivanje"},{"value":"kampovanje","label":"Kampovanje"},{"value":"lov_ribolov","label":"Lov i ribolov"},{"value":"ostalo","label":"Ostalo"}]', 1),
  ('sports', 'brand',     'Marka',        'TEXT',    false, null, 2),
  ('sports', 'size',      'Veličina',     'TEXT',    false, null, 3),
  ('sports', 'forAge',    'Za uzrast',    'SELECT',  false, '[{"value":"deca","label":"Deca"},{"value":"odrasli","label":"Odrasli"},{"value":"svi","label":"Svi uzrasti"}]', 4);

-- ============================================================================
-- KIDS (Deca i bebe) — category_id = 'kids'
-- ============================================================================
INSERT INTO category_attributes (category_id, key, label, type, required, options, "order") VALUES
  ('kids', 'kidsType', 'Tip',     'SELECT',  false, '[{"value":"odeca","label":"Odeća"},{"value":"obuca","label":"Obuća"},{"value":"igracke","label":"Igračke"},{"value":"oprema","label":"Oprema za bebe"},{"value":"knjige","label":"Knjige"},{"value":"skola","label":"Školski pribor"},{"value":"ostalo","label":"Ostalo"}]', 1),
  ('kids', 'ageGroup', 'Uzrast',  'SELECT',  false, '[{"value":"0-6m","label":"0-6 meseci"},{"value":"6-12m","label":"6-12 meseci"},{"value":"1-2g","label":"1-2 godine"},{"value":"2-4g","label":"2-4 godine"},{"value":"4-6g","label":"4-6 godina"},{"value":"6-10g","label":"6-10 godina"},{"value":"10-14g","label":"10-14 godina"},{"value":"14+","label":"14+ godina"}]', 2),
  ('kids', 'gender',   'Pol',     'SELECT',  false, '[{"value":"decaci","label":"Dečaci"},{"value":"devojcice","label":"Devojčice"},{"value":"unisex","label":"Unisex"}]', 3),
  ('kids', 'brand',    'Marka',   'TEXT',    false, null, 4);

-- ============================================================================
-- PETS (Ljubimci) — category_id = 'pets'
-- ============================================================================
INSERT INTO category_attributes (category_id, key, label, type, required, options, "order") VALUES
  ('pets', 'listingType', 'Vrsta oglasa',     'SELECT',  false, '[{"value":"zivotinja","label":"Životinja na prodaju/poklon"},{"value":"oprema","label":"Oprema za ljubimce"},{"value":"hrana","label":"Hrana za ljubimce"},{"value":"usluge","label":"Usluge (šišanje, čuvanje...)"}]', 1),
  ('pets', 'petType',     'Vrsta životinje',  'SELECT',  false, '[{"value":"pas","label":"Pas"},{"value":"macka","label":"Mačka"},{"value":"ptica","label":"Ptica"},{"value":"riba","label":"Riba"},{"value":"gmizavac","label":"Gmizavac"},{"value":"glodari","label":"Glodari"},{"value":"ostalo","label":"Ostalo"}]', 2),
  ('pets', 'breed',       'Rasa',             'TEXT',    false, null, 3),
  ('pets', 'age',         'Starost',          'TEXT',    false, null, 4),
  ('pets', 'vaccinated',  'Vakcinisan',       'BOOLEAN', false, null, 5),
  ('pets', 'pedigree',    'Ima pedigre',      'BOOLEAN', false, null, 6);

-- ============================================================================
-- SERVICES (Usluge) — category_id = 'services'
-- ============================================================================
INSERT INTO category_attributes (category_id, key, label, type, required, options, "order") VALUES
  ('services', 'serviceType',  'Vrsta usluge', 'SELECT',  false, '[{"value":"it","label":"IT usluge"},{"value":"prevoz","label":"Prevoz i selidbe"},{"value":"gradevina","label":"Građevinske usluge"},{"value":"popravke","label":"Popravke i održavanje"},{"value":"edukacija","label":"Časovi i edukacija"},{"value":"lepota","label":"Lepota i nega"},{"value":"zdravlje","label":"Zdravlje"},{"value":"dogadjaji","label":"Organizacija događaja"},{"value":"ostalo","label":"Ostale usluge"}]', 1),
  ('services', 'priceType',    'Tip cene',     'SELECT',  false, '[{"value":"fiksna","label":"Fiksna cena"},{"value":"po_satu","label":"Po satu"},{"value":"po_dogovoru","label":"Po dogovoru"}]', 2),
  ('services', 'experience',   'Iskustvo',     'TEXT',    false, null, 3),
  ('services', 'availability', 'Dostupnost',   'TEXT',    false, null, 4);
