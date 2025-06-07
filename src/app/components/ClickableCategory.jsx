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
    const savedLang = localStorage.getItem('preferredLanguage');
    
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
          console.error('Formato dati categorie non valido:', data);
          setItems([]);
        }
        localStorage.setItem('categoriesCache', JSON.stringify(data));
        localStorage.setItem('categoriesCacheTimestamp', Date.now().toString());
        setLoading(false);
      } catch (error) {
        console.error('Errore nel caricamento delle categorie:', error);
        // Prova a usare i dati dalla cache se disponibili
        const cache = localStorage.getItem('categoriesCache');
        if (cache) {
          try {
            const data = JSON.parse(cache);
            if (data && data.categories) {
              setItems(data.categories);
            }
          } catch (e) {
            console.error('Errore nel parsing della cache:', e);
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
          console.error('Errore nel parsing della cache:', e);
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

  // Memoizzazione della mappatura termini-categorie e dei termini ordinati
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
    const MAX_TERMS = 500; // Aumentato da 200 a 500 per migliorare la copertura
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
      
      // Cerca tutte le occorrenze del termine normalizzato
      let idx = lower.indexOf(norm);
      
      while (idx !== -1) {
        const start = idx;
        const end = idx + norm.length; // Usa la lunghezza del termine normalizzato
        
        // Ottieni i caratteri prima e dopo per verificare che sia una parola intera
        const before = lower[start - 1] || ' ';
        const after = lower[end] || ' ';
        
        // Verifica se questa parte di testo è già stata evidenziata
        const isOverlapping = markedRanges.some(
          range => (start >= range.start && start < range.end) || 
                  (end > range.start && end <= range.end) ||
                  (start <= range.start && end >= range.end)
        );
        
        // Aggiungi il match solo se non si sovrappone e rispetta i criteri di parola intera
        if (!isOverlapping && before.match(/[\s,.]/) && after.match(/[\s,.]|$/)) {
          // Trova la categoria associata a questo termine
          const category = termToCategory[norm];
          // Usa il testo originale per l'evidenziazione
          const originalText = text.substring(start, end);
          matches.push({ term: originalText, start, end, category });
          markedRanges.push({ start, end });
        }
        
        // Cerca la prossima occorrenza
        idx = lower.indexOf(norm, idx + 1);
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
            onClick={() => onCategoryClick(p.content)}
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
