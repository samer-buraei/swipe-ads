-- supabase/migrations/20231025000000_search_profiles_arrays.sql

-- 1. Cast existing `keywords` from TEXT to TEXT[] using a comma delimiter split
ALTER TABLE search_profiles 
ALTER COLUMN keywords TYPE TEXT[] USING string_to_array(keywords, ',');

-- 2. Add the `conditions` textual array to match the ItemConditionSchema
ALTER TABLE search_profiles
ADD COLUMN conditions TEXT[];
