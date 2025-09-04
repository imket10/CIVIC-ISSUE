/*
  # Civic Platform Initial Schema

  1. New Tables
    - `departments` - City departments (Sanitation, Public Works, etc.)
    - `users` - All system users with role-based access
    - `categories` - Issue categories with department routing
    - `reports` - Core issue reports with geospatial data
    - `media` - File attachments for reports
    - `comments` - Public and internal comments
    - `activity_log` - Audit trail for all actions
    - `fcm_tokens` - Push notification tokens

  2. Security
    - Enable RLS on all tables
    - Create policies for role-based access
    - Add appropriate indexes for performance

  3. Geospatial
    - PostGIS extension for location data
    - Spatial indexes for efficient querying
*/

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Departments table
CREATE TABLE IF NOT EXISTS departments (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  email TEXT,
  sla_hours INT NOT NULL DEFAULT 72,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users table with role-based access
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL CHECK (role IN ('citizen','admin','supervisor','worker','auditor')),
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  password_hash TEXT,
  display_name TEXT,
  avatar_url TEXT,
  department_id INT REFERENCES departments(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  active BOOLEAN DEFAULT TRUE
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  department_id INT REFERENCES departments(id),
  priority_base INT NOT NULL DEFAULT 3,
  sla_hours INT,
  icon TEXT,
  color TEXT DEFAULT '#3B82F6',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reports table with geospatial support
CREATE TABLE IF NOT EXISTS reports (
  id BIGSERIAL PRIMARY KEY,
  citizen_id UUID REFERENCES users(id),
  source TEXT NOT NULL DEFAULT 'web',
  category_id INT REFERENCES categories(id),
  subcategory TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('new','acknowledged','in_progress','on_hold','resolved','rejected','duplicate')),
  location GEOGRAPHY(POINT, 4326),
  address TEXT,
  ward TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  priority_score INT DEFAULT 0,
  department_id INT REFERENCES departments(id),
  assignee_id UUID REFERENCES users(id),
  sla_due_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  tags TEXT[] DEFAULT '{}',
  duplicate_of BIGINT REFERENCES reports(id),
  device_info JSONB,
  meta JSONB DEFAULT '{}',
  urgent BOOLEAN DEFAULT FALSE
);

-- Media table for file attachments
CREATE TABLE IF NOT EXISTS media (
  id BIGSERIAL PRIMARY KEY,
  report_id BIGINT REFERENCES reports(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('image','video','audio')),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  width INT,
  height INT,
  duration_ms INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sha1 TEXT,
  thumb_path TEXT
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id BIGSERIAL PRIMARY KEY,
  report_id BIGINT REFERENCES reports(id) ON DELETE CASCADE,
  author_id UUID REFERENCES users(id),
  body TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'internal')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity log for audit trail
CREATE TABLE IF NOT EXISTS activity_log (
  id BIGSERIAL PRIMARY KEY,
  report_id BIGINT REFERENCES reports(id),
  actor_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  from_value TEXT,
  to_value TEXT,
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- FCM tokens for push notifications
CREATE TABLE IF NOT EXISTS fcm_tokens (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS reports_status_idx ON reports(status);
CREATE INDEX IF NOT EXISTS reports_geo_idx ON reports USING GIST (location);
CREATE INDEX IF NOT EXISTS reports_priority_idx ON reports(priority_score DESC);
CREATE INDEX IF NOT EXISTS reports_created_at_idx ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS reports_sla_due_idx ON reports(sla_due_at);
CREATE INDEX IF NOT EXISTS activity_log_report_idx ON activity_log(report_id);
CREATE INDEX IF NOT EXISTS comments_report_idx ON comments(report_id);
CREATE INDEX IF NOT EXISTS media_report_idx ON media(report_id);

-- Enable Row Level Security
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE fcm_tokens ENABLE ROW LEVEL SECURITY;

-- Departments policies
CREATE POLICY "Departments are viewable by everyone"
  ON departments FOR SELECT
  TO authenticated
  USING (active = true);

CREATE POLICY "Only supervisors can manage departments"
  ON departments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('supervisor', 'admin')
    )
  );

-- Users policies
CREATE POLICY "Users can read their own data"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all users"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'supervisor')
    )
  );

-- Categories policies
CREATE POLICY "Categories are viewable by everyone"
  ON categories FOR SELECT
  TO authenticated
  USING (active = true);

-- Reports policies
CREATE POLICY "Citizens can read their own reports"
  ON reports FOR SELECT
  TO authenticated
  USING (citizen_id = auth.uid());

CREATE POLICY "Citizens can create reports"
  ON reports FOR INSERT
  TO authenticated
  WITH CHECK (citizen_id = auth.uid());

CREATE POLICY "Staff can read assigned or all reports"
  ON reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND (
        users.role IN ('admin', 'supervisor', 'auditor') 
        OR (users.role = 'worker' AND (assignee_id = auth.uid() OR assignee_id IS NULL))
      )
    )
  );

CREATE POLICY "Staff can update reports"
  ON reports FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'supervisor', 'worker')
    )
  );

-- Media policies
CREATE POLICY "Media viewable with report access"
  ON media FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM reports 
      WHERE reports.id = media.report_id 
      AND (
        reports.citizen_id = auth.uid() 
        OR EXISTS (
          SELECT 1 FROM users 
          WHERE users.id = auth.uid() 
          AND users.role IN ('admin', 'supervisor', 'worker', 'auditor')
        )
      )
    )
  );

-- Comments policies
CREATE POLICY "Comments viewable with report access"
  ON comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM reports 
      WHERE reports.id = comments.report_id 
      AND (
        reports.citizen_id = auth.uid() 
        OR EXISTS (
          SELECT 1 FROM users 
          WHERE users.id = auth.uid() 
          AND users.role IN ('admin', 'supervisor', 'worker', 'auditor')
        )
      )
    )
    AND (visibility = 'public' OR EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'supervisor', 'worker', 'auditor')
    ))
  );

CREATE POLICY "Users can create comments on accessible reports"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM reports 
      WHERE reports.id = comments.report_id 
      AND (
        reports.citizen_id = auth.uid() 
        OR EXISTS (
          SELECT 1 FROM users 
          WHERE users.id = auth.uid() 
          AND users.role IN ('admin', 'supervisor', 'worker')
        )
      )
    )
    AND author_id = auth.uid()
  );

-- Activity log policies
CREATE POLICY "Activity log viewable by staff"
  ON activity_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'supervisor', 'auditor')
    )
  );

-- FCM tokens policies
CREATE POLICY "Users can manage their own FCM tokens"
  ON fcm_tokens FOR ALL
  TO authenticated
  USING (user_id = auth.uid());