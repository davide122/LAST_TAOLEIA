-- Schema per le traduzioni delle attività

-- Tabella per le traduzioni delle attività
CREATE TABLE IF NOT EXISTS activity_translations (
  id SERIAL PRIMARY KEY,
  activity_id INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  language_code VARCHAR(5) NOT NULL, -- Codice lingua (es. 'it', 'en', 'fr', ecc.)
  name VARCHAR(255),
  description TEXT,
  menu TEXT,
  prices TEXT,
  audio_guide_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Vincolo di unicità per evitare traduzioni duplicate per la stessa attività e lingua
  UNIQUE(activity_id, language_code)
);

-- Indice per migliorare le performance delle query per attività
CREATE INDEX IF NOT EXISTS idx_activity_translations_activity_id ON activity_translations(activity_id);

-- Indice per migliorare le performance delle query per lingua
CREATE INDEX IF NOT EXISTS idx_activity_translations_language_code ON activity_translations(language_code);

-- Trigger per aggiornare automaticamente il campo updated_at
CREATE OR REPLACE FUNCTION update_activity_translations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_activity_translations_timestamp') THEN
        CREATE TRIGGER update_activity_translations_timestamp
        BEFORE UPDATE ON activity_translations
        FOR EACH ROW
        EXECUTE FUNCTION update_activity_translations_updated_at();
    END IF;
END $$;