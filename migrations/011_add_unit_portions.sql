-- Add named unit portion support to nutrition_records
-- Allows foods to have a "count" unit (e.g., "egg" at 50.3g each)
ALTER TABLE nutrition_records
  ADD COLUMN unit_name VARCHAR(50),
  ADD COLUMN unit_weight_grams DECIMAL(10, 2);
