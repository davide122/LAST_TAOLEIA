-- Schema per le tabelle degli itinerari

-- Tabella principale degli itinerari
CREATE TABLE IF NOT EXISTS itineraries (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  days INTEGER NOT NULL DEFAULT 1,
  cover_image VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabella per le attività degli itinerari
CREATE TABLE IF NOT EXISTS itinerary_activities (
  id SERIAL PRIMARY KEY,
  itinerary_id INTEGER NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  day_index INTEGER NOT NULL,
  start_time VARCHAR(5) NOT NULL, -- Formato HH:MM
  end_time VARCHAR(5) NOT NULL,   -- Formato HH:MM
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indici per migliorare le performance
CREATE INDEX IF NOT EXISTS idx_itinerary_activities_itinerary_id ON itinerary_activities(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_activities_day_index ON itinerary_activities(day_index);