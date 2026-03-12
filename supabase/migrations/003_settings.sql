-- ─────────────────────────────────────────────────────────────────────────────
-- Akaal Psychiatry — Practice Settings
-- Key-value store for configurable portal settings (practice info,
-- notification preferences, etc.)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS akaal_psychiatry_settings (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by  TEXT
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION akaal_psychiatry_settings_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_settings_updated_at ON akaal_psychiatry_settings;
CREATE TRIGGER set_settings_updated_at
  BEFORE UPDATE ON akaal_psychiatry_settings
  FOR EACH ROW EXECUTE FUNCTION akaal_psychiatry_settings_set_updated_at();

ALTER TABLE akaal_psychiatry_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role full access settings" ON akaal_psychiatry_settings
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Seed default settings
INSERT INTO akaal_psychiatry_settings (key, value) VALUES
  ('practice', '{
    "name": "Akaal Psychiatry",
    "tagline": "Compassionate Mental Health Care",
    "phone": "(214) 603-3091",
    "email": "info@akaalpsychiatry.com",
    "address": "",
    "city": "",
    "state": "TX",
    "zip": "",
    "hours": "Mon–Fri 9am–5pm",
    "about": ""
  }'::jsonb),
  ('notifications', '{
    "new_inquiry_emails": [],
    "new_appointment_emails": [],
    "notify_on_inquiry": true,
    "notify_on_appointment": true
  }'::jsonb)
ON CONFLICT (key) DO NOTHING;
