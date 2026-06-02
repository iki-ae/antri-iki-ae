ALTER TABLE config ADD COLUMN timezone TEXT NOT NULL DEFAULT 'Asia/Jakarta';
ALTER TABLE config ADD COLUMN contact_name TEXT;
ALTER TABLE config ADD COLUMN contact_org TEXT;
ALTER TABLE config ADD COLUMN contact_email TEXT;
ALTER TABLE config ADD COLUMN contact_whatsapp TEXT;
ALTER TABLE config ADD COLUMN contact_consent_list INTEGER NOT NULL DEFAULT 0;
ALTER TABLE config ADD COLUMN contact_consent_updates INTEGER NOT NULL DEFAULT 0;
ALTER TABLE config ADD COLUMN contact_consent_storage INTEGER NOT NULL DEFAULT 0;
ALTER TABLE config ADD COLUMN terms_accepted_at TEXT;
