ALTER TABLE config ADD COLUMN timezone TEXT NOT NULL DEFAULT 'Asia/Jakarta';
--> statement-breakpoint
ALTER TABLE config ADD COLUMN contact_name TEXT;
--> statement-breakpoint
ALTER TABLE config ADD COLUMN contact_org TEXT;
--> statement-breakpoint
ALTER TABLE config ADD COLUMN contact_email TEXT;
--> statement-breakpoint
ALTER TABLE config ADD COLUMN contact_whatsapp TEXT;
--> statement-breakpoint
ALTER TABLE config ADD COLUMN contact_consent_list INTEGER NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE config ADD COLUMN contact_consent_updates INTEGER NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE config ADD COLUMN contact_consent_storage INTEGER NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE config ADD COLUMN terms_accepted_at TEXT;
