/*
  # Seed Data for Civic Platform

  1. Departments
    - Public Works, Sanitation, Water & Sewerage, Street Lighting, Parks & Gardens
  
  2. Categories
    - Various issue types mapped to departments
  
  3. Sample users for testing
    - Admin, workers, citizens
*/

-- Insert departments
INSERT INTO departments (name, email, sla_hours, active) VALUES
  ('Public Works', 'publicworks@city.gov.in', 72, true),
  ('Sanitation', 'sanitation@city.gov.in', 48, true),
  ('Water & Sewerage', 'water@city.gov.in', 24, true),
  ('Street Lighting', 'lighting@city.gov.in', 48, true),
  ('Parks & Gardens', 'parks@city.gov.in', 96, true),
  ('Traffic & Roads', 'traffic@city.gov.in', 72, true)
ON CONFLICT (name) DO NOTHING;

-- Insert categories
INSERT INTO categories (name, department_id, priority_base, sla_hours, icon, color, active) VALUES
  ('Pothole', 1, 4, 72, '🕳️', '#EF4444', true),
  ('Streetlight Issue', 4, 3, 48, '💡', '#F59E0B', true),
  ('Garbage Collection', 2, 3, 48, '🗑️', '#10B981', true),
  ('Water Leak', 3, 5, 24, '💧', '#3B82F6', true),
  ('Broken Sidewalk', 1, 3, 72, '🛤️', '#8B5CF6', true),
  ('Tree/Garden Issue', 5, 2, 96, '🌳', '#059669', true),
  ('Drainage Problem', 3, 4, 48, '🌊', '#0EA5E9', true),
  ('Traffic Signal', 6, 4, 24, '🚦', '#DC2626', true),
  ('Noise Complaint', 2, 2, 72, '🔊', '#F97316', true),
  ('Illegal Dumping', 2, 4, 24, '🚯', '#991B1B', true)
ON CONFLICT (name) DO NOTHING;

-- Note: Sample users will be created through the auth system during app usage
-- This ensures proper password hashing and auth integration