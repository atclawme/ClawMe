-- ============================================================
-- ClawMe — Waitlist Referral Survey Table
-- Run this in your Supabase SQL Editor to store survey responses.
-- ============================================================

CREATE TABLE IF NOT EXISTS waitlist_referrals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT NOT NULL,
  referral_source TEXT NOT NULL,
  other_details   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Link to waitlist entry if it exists (optional but recommended)
  -- This assumes waitlist(email) is UNIQUE.
  CONSTRAINT fk_waitlist_email FOREIGN KEY (email) REFERENCES waitlist(email) ON DELETE CASCADE
);

-- Index for faster analysis
CREATE INDEX IF NOT EXISTS idx_waitlist_referrals_email ON waitlist_referrals(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_referrals_source ON waitlist_referrals(referral_source);

-- Enable RLS (Row Level Security)
ALTER TABLE waitlist_referrals ENABLE ROW LEVEL SECURITY;

-- Allow anyone to INSERT into this table (since waitlist is public)
CREATE POLICY "Allow public insert into waitlist_referrals" 
ON waitlist_referrals FOR INSERT 
WITH CHECK (true);

-- Only authenticated admins or service role should see responses (for now, we'll keep it simple)
CREATE POLICY "Allow authenticated full access to waitlist_referrals" 
ON waitlist_referrals TO authenticated 
USING (true);
