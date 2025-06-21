'use client';

import { useState, useEffect, useMemo } from 'react';

export default function ClickableCategory({ children, onCategoryClick }) {
  const [items, setItems]     = useState([]); // [{ category, translated_name, names: [...] }, …]
  const [loading, setLoading] = useState(true);
  const [currentLanguage, setCurrentLanguage] = useState('it'); // Lingua corrente

  // Rileva la lingua corrente dal localStorage o dall'URL
  useEffect(() => {
    // Controlla se c'è un parametro di lingua nell'URL
    const urlParams = new URLSearchParams(window.location.search);
    const langParam = urlParams.get('lang');
    
    // Controlla se c'è una lingua salvata nel localStorage
    const savedLang = localStorage.getItem('preferredLanguage') || localStorage.getItem('selectedLanguage');
    
    // Imposta la lingua corrente (priorità: URL > localStorage > default 'it')
    const detectedLang = langParam || savedLang || 'it';
    setCurrentLanguage(detectedLang);
  }, []);

  // 1) fetch + cache con aggiornamento all'apertura dell'app
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/get-categories');
        if (!res.ok) throw new Error(`Errore HTTP: ${res.status}`);
        const data = await res.json();
        // Verifica che i dati abbiano la struttura corretta
        if (data && data.categories && Array.isArray(data.categories)) {
          setItems(data.categories);
        } else {
          setItems([]);
        }
        localStorage.setItem('categoriesCache', JSON.stringify(data));
        localStorage.setItem('categoriesCacheTimestamp', Date.now().toString());
        setLoading(false);
      } catch (error) {
        // Prova a usare i dati dalla cache se disponibili
        const cache = localStorage.getItem('categoriesCache');
        if (cache) {
          try {
            const data = JSON.parse(cache);
            if (data && data.categories) {
              setItems(data.categories);
            }
          } catch (e) {
            // Errore silenzioso
          }
        }
        setLoading(false);
      }
    };

    // Controlla se è necessario aggiornare la cache
    const timestamp = localStorage.getItem('categoriesCacheTimestamp');
    const now = Date.now();
    const cacheAge = timestamp ? now - parseInt(timestamp) : Infinity;
    const cacheExpired = cacheAge > 3600000; // 1 ora

    if (cacheExpired) {
      fetchCategories();
    } else {
      // Usa la cache se disponibile e non scaduta
      const cache = localStorage.getItem('categoriesCache');
      if (cache) {
        try {
          const data = JSON.parse(cache);
          if (data && data.categories) {
            setItems(data.categories);
            setLoading(false);
          } else {
            fetchCategories();
          }
        } catch (e) {
          fetchCategories();
        }
      } else {
        fetchCategories();
      }
    }
  }, []);

  // Funzione per normalizzare il testo (rimuove accenti, converte in minuscolo)
  const normalizeText = text => {
    if (!text || typeof text !== 'string') return '';
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  };

  const { termToCategory, sortedTerms } = useMemo(() => {
    // Mappa per associare termini normalizzati alle loro categorie
    const termMap = {};
    const terms = new Set();
    
    // Funzione per mappare termini separati da virgola
    const mapCommaTerms = (text, category) => {
      if (!text || typeof text !== 'string') return;
      
      // Minimo 3 caratteri per i termini da cercare
      const MIN_TERM_LENGTH = 3;
      
      // Dividi per virgole e processa ogni parte
      const parts = text.split(',').map(part => part.trim()).filter(part => part.length >= MIN_TERM_LENGTH);
      
      parts.forEach(part => {
        const normalizedTerm = normalizeText(part);
        if (normalizedTerm) {
          termMap[normalizedTerm] = category;
          terms.add(part);
        }
      });
    };
    
    // Processa tutte le categorie
    items.forEach(item => {
      // Nome categoria principale
      if (item.category) {
        mapCommaTerms(item.category, item);
      }
      
      // Nome tradotto
      if (item.translated_name) {
        mapCommaTerms(item.translated_name, item);
      }
      
      // Traduzioni
      if (item.translations) {
        Object.values(item.translations).forEach(translation => {
          if (translation && translation !== item.translated_name && translation !== item.category) {
            mapCommaTerms(translation, item);
          }
        });
      }
      
      // Nomi associati
      if (item.names && Array.isArray(item.names)) {
        item.names.forEach(name => {
          if (name && typeof name === 'string') {
            mapCommaTerms(name, item);
          }
        });
      }
    });
    
    // Ordina i termini per lunghezza decrescente per dare priorità ai termini più lunghi
    const sortedTermsList = Array.from(terms).sort((a, b) => b.length - a.length);
    
    // Limita il numero di termini per migliorare le prestazioni
    const MAX_TERMS = 1000; // Aumentato da 500 a 1000 per migliorare la copertura
    const limitedTerms = sortedTermsList.slice(0, MAX_TERMS);
    
    return { termToCategory: termMap, sortedTerms: limitedTerms };
  }, [items]);

  // Funzione per trovare i termini nel testo
  const findTerms = (text) => {
    if (!text || typeof text !== 'string' || sortedTerms.length === 0) return [];
    
    const matches = [];
    const markedRanges = [];
    
    // Normalizza il testo una sola volta
    const lower = normalizeText(text);
    
    // Cerca tutti i termini nel testo
    for (const term of sortedTerms) {
      const norm = normalizeText(term);
      
      // Salta termini troppo corti
      if (norm.length < 3) continue;
      
      // Funzione per verificare se due parole sono simili (singolare/plurale)
      const areSimilarWords = (word1, word2) => {
        // Se le parole sono identiche, sono ovviamente simili
        if (word1 === word2) return true;
        
        // Se una parola è molto più corta dell'altra, probabilmente non sono variazioni
        if (Math.abs(word1.length - word2.length) > 3) return false;
        
        // Confronta le radici delle parole (ignora le ultime 1-3 lettere)
        const minLength = Math.min(word1.length, word2.length);
        const rootLength = Math.max(minLength - 3, 3); // Almeno 3 caratteri per la radice
        
        const root1 = word1.substring(0, rootLength);
        const root2 = word2.substring(0, rootLength);
        
        return root1 === root2;
      };
      
      // Cerca tutte le occorrenze del termine normalizzato o parole simili
      let idx = 0;
      const words = lower.split(/[\s,.]+/);
      
      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        if (word.length < 3) continue;
        
        // Verifica se la parola corrente è simile al termine cercato
        if (areSimilarWords(word, norm)) {
          // Trova la posizione della parola nel testo originale
          const wordStart = lower.indexOf(word, idx);
          if (wordStart === -1) continue;
          
          const wordEnd = wordStart + word.length;
          idx = wordEnd;
          
          // Verifica se questa parte di testo è già stata evidenziata
          const isOverlapping = markedRanges.some(
            range => (wordStart >= range.start && wordStart < range.end) || 
                    (wordEnd > range.start && wordEnd <= range.end) ||
                    (wordStart <= range.start && wordEnd >= range.end)
          );
          
          // Aggiungi il match solo se non si sovrappone
          if (!isOverlapping) {
            // Trova la categoria associata a questo termine
            const category = termToCategory[norm];
            
            // Usa il testo originale per l'evidenziazione
            const originalText = text.substring(wordStart, wordEnd);
            matches.push({ term: originalText, start: wordStart, end: wordEnd, category });
            markedRanges.push({ start: wordStart, end: wordEnd });
          }
        }
      }
    }

    return matches.sort((a, b) => a.start - b.start);
  };

  // Funzione per evidenziare il testo
  const highlight = (text) => {
    if (!text || typeof text !== 'string') return [];
    const parts = [];
    let last = 0;
    
    const matches = findTerms(text);
    
    matches.forEach(({ term, start, end, category }) => {
      if (start > last) {
        parts.push({ type: 'text', content: text.slice(last, start) });
      }
      
      parts.push({ 
        type: 'category', 
        content: text.slice(start, end), 
        term,
        category // Passa l'oggetto categoria completo
      });
      last = end;
    });

    if (last < text.length) {
      parts.push({ type: 'text', content: text.slice(last) });
    }

    return parts;
  };

  // Applica l'evidenziazione al testo
  const parts = highlight(children);
  
  if (!Array.isArray(parts)) return <>{children}</>;

  return (
    <>
      {parts.map((p, i) =>
        p.type === 'category' ? (
          <span
            key={i}
            className="category-highlight"
            onClick={() => onCategoryClick(`${p.content}`)}
            title={p.category ? (p.category.translations && p.category.translations[currentLanguage] || p.category.translated_name || p.category.category) : p.term}
          >
            {p.content}
          </span>
        ) : (
          <span key={i}>{p.content}</span>
        )
      )}
    </>
  );
}
