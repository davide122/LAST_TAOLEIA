-- Schema per le traduzioni delle parole chiave

-- Tabella per le traduzioni delle parole chiave
CREATE TABLE IF NOT EXISTS keyword_translations (
  id SERIAL PRIMARY KEY,
  keyword_id INTEGER NOT NULL,
  language_code VARCHAR(5) NOT NULL, -- Codice lingua (es. 'it', 'en', 'fr', ecc.)
  keyword VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Vincolo di unicità per evitare traduzioni duplicate per la stessa parola chiave e lingua
  UNIQUE(keyword_id, language_code)
);

-- Indice per migliorare le performance delle query per parola chiave
CREATE INDEX IF NOT EXISTS idx_keyword_translations_keyword_id ON keyword_translations(keyword_id);

-- Indice per migliorare le performance delle query per lingua
CREATE INDEX IF NOT EXISTS idx_keyword_translations_language_code ON keyword_translations(language_code);

-- Trigger per aggiornare automaticamente il campo updated_at
CREATE OR REPLACE FUNCTION update_keyword_translations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_keyword_translations_timestamp') THEN
        CREATE TRIGGER update_keyword_translations_timestamp
        BEFORE UPDATE ON keyword_translations
        FOR EACH ROW
        EXECUTE FUNCTION update_keyword_translations_updated_at();
    END IF;
END $$;