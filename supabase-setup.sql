-- Supabase Setup for Regatta Scoring App
-- Run this in your Supabase SQL Editor

-- Create the events table
CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    eventName TEXT NOT NULL,
    eventDate TEXT,
    eventEndDate TEXT,
    venue TEXT,
    organizer TEXT DEFAULT 'International Sailing Academy',
    description TEXT,
    noticeOfRace TEXT,
    sailingInstructions TEXT,
    classes JSONB DEFAULT '["ILCA 7", "ILCA 6"]'::jsonb,
    sailors JSONB DEFAULT '[]'::jsonb,
    races JSONB DEFAULT '[]'::jsonb,
    mastersScoringEnabled BOOLEAN DEFAULT false,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    lastUpdated TEXT
);

-- Enable Row Level Security (RLS)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations (public access)
-- In production, you might want to restrict this
CREATE POLICY "Allow public access" ON events
    FOR ALL
    TO PUBLIC
    USING (true)
    WITH CHECK (true);

-- Enable realtime for the events table
BEGIN;
    DROP PUBLICATION IF EXISTS supabase_realtime;
    CREATE PUBLICATION supabase_realtime;
COMMIT;

ALTER PUBLICATION supabase_realtime ADD TABLE events;
