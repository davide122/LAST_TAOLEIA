-- Schema per le traduzioni delle categorie

-- Tabella per le traduzioni delle categorie
CREATE TABLE IF NOT EXISTS category_translations (
  id SERIAL PRIMARY KEY,
  category_name VARCHAR(255) NOT NULL, -- Nome della categoria originale (in italiano)
  language_code VARCHAR(5) NOT NULL, -- Codice lingua (es. 'it', 'en', 'fr', ecc.)
  translated_name VARCHAR(255) NOT NULL, -- Nome tradotto della categoria
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Vincolo di unicità per evitare traduzioni duplicate per la stessa categoria e lingua
  UNIQUE(category_name, language_code)
);

-- Indice per migliorare le performance delle query per categoria
CREATE INDEX IF NOT EXISTS idx_category_translations_category_name ON category_translations(category_name);

-- Indice per migliorare le performance delle query per lingua
CREATE INDEX IF NOT EXISTS idx_category_translations_language_code ON category_translations(language_code);

-- Trigger per aggiornare automaticamente il campo updated_at
CREATE OR REPLACE FUNCTION update_category_translations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_category_translations_timestamp') THEN
        CREATE TRIGGER update_category_translations_timestamp
        BEFORE UPDATE ON category_translations
        FOR EACH ROW
        EXECUTE FUNCTION update_category_translations_updated_at();
    END IF;
END $$;