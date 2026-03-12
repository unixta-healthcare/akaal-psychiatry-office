-- ─────────────────────────────────────────────────────────────────────────────
-- Akaal Psychiatry — Seed: Super Admin User
-- Seeds the initial super_admin so the admin portal is accessible.
-- Subsequent users can be added via the admin panel by any super_admin.
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO akaal_psychiatry_admin_users (email, name, role, is_active)
VALUES ('admin@unixta.com', 'Unixta Admin', 'super_admin', true)
ON CONFLICT (email) DO UPDATE
  SET role      = 'super_admin',
      is_active = true,
      name      = EXCLUDED.name;
