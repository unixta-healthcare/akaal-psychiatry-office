-- ─────────────────────────────────────────────────────────────────────────────
-- Akaal Psychiatry — Admin Panel Setup
-- Database: unixta-production Supabase project
--
-- Tables:
--   akaal_psychiatry_admin_users   — Staff who can log in to /admin via Google OAuth
--   akaal_psychiatry_blog_posts    — CMS for the public website blog
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Admin Users ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS akaal_psychiatry_admin_users (
  id              BIGSERIAL PRIMARY KEY,
  email           TEXT    NOT NULL UNIQUE,
  name            TEXT    NOT NULL DEFAULT '',
  picture         TEXT,                         -- Google profile photo URL
  role            TEXT    NOT NULL DEFAULT 'staff'
                    CHECK (role IN ('super_admin', 'admin', 'staff', 'readonly')),
  is_active       BOOLEAN NOT NULL DEFAULT true,
  last_login_at   TIMESTAMPTZ,
  google_id       TEXT    UNIQUE,               -- Google sub ID
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION akaal_psychiatry_admin_users_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_admin_users_updated_at ON akaal_psychiatry_admin_users;
CREATE TRIGGER set_admin_users_updated_at
  BEFORE UPDATE ON akaal_psychiatry_admin_users
  FOR EACH ROW EXECUTE FUNCTION akaal_psychiatry_admin_users_set_updated_at();

-- RLS
ALTER TABLE akaal_psychiatry_admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role full access admin users" ON akaal_psychiatry_admin_users
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_akaal_admin_users_email
  ON akaal_psychiatry_admin_users (email);
CREATE INDEX IF NOT EXISTS idx_akaal_admin_users_active
  ON akaal_psychiatry_admin_users (is_active);


-- ─── Blog Posts ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS akaal_psychiatry_blog_posts (
  id              BIGSERIAL PRIMARY KEY,
  slug            TEXT    NOT NULL UNIQUE,
  title           TEXT    NOT NULL,
  excerpt         TEXT    NOT NULL DEFAULT '',
  content         TEXT    NOT NULL DEFAULT '',
  author          TEXT    NOT NULL DEFAULT 'Akaal Psychiatry',
  category        TEXT    NOT NULL DEFAULT 'Mental Health',
  tags            JSONB   NOT NULL DEFAULT '[]'::jsonb,
  image           TEXT,
  meta_description TEXT   NOT NULL DEFAULT '',
  read_time       TEXT    NOT NULL DEFAULT '5 min read',
  featured        BOOLEAN NOT NULL DEFAULT false,
  published       BOOLEAN NOT NULL DEFAULT false,
  publish_date    DATE,
  created_by      TEXT,                         -- admin email
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION akaal_psychiatry_blog_posts_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_blog_posts_updated_at ON akaal_psychiatry_blog_posts;
CREATE TRIGGER set_blog_posts_updated_at
  BEFORE UPDATE ON akaal_psychiatry_blog_posts
  FOR EACH ROW EXECUTE FUNCTION akaal_psychiatry_blog_posts_set_updated_at();

ALTER TABLE akaal_psychiatry_blog_posts ENABLE ROW LEVEL SECURITY;

-- Service role full access (admin panel)
CREATE POLICY "service role full access blog" ON akaal_psychiatry_blog_posts
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Anon can read published posts (public website)
CREATE POLICY "anon read published posts" ON akaal_psychiatry_blog_posts
  FOR SELECT
  USING (auth.role() = 'anon' AND published = true);

CREATE INDEX IF NOT EXISTS idx_akaal_blog_slug       ON akaal_psychiatry_blog_posts (slug);
CREATE INDEX IF NOT EXISTS idx_akaal_blog_published  ON akaal_psychiatry_blog_posts (published, publish_date DESC);
CREATE INDEX IF NOT EXISTS idx_akaal_blog_category   ON akaal_psychiatry_blog_posts (category);
CREATE INDEX IF NOT EXISTS idx_akaal_blog_featured   ON akaal_psychiatry_blog_posts (featured) WHERE featured = true;
