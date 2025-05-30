'use client';

import { useState, useEffect } from 'react';

export default function ClickableCategory({ children, onCategoryClick }) {
  const [items, setItems]     = useState([]); // [{ category, names: [...] }, …]
  const [loading, setLoading] = useState(true);

  // 1) fetch + cache con aggiornamento all'apertura dell'app
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        console.log('Caricamento categorie...');
        const res = await fetch('/api/get-categories');
        if (!res.ok) throw new Error(`Errore HTTP: ${res.status}`);
        const data = await res.json();
        console.log('Categorie caricate:', data);
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
          console.log('Usando categorie dalla cache dopo errore');
          try {
            const cachedData = JSON.parse(cache);
            if (cachedData && cachedData.categories && Array.isArray(cachedData.categories)) {
              setItems(cachedData.categories);
            } else {
              console.error('Formato dati cache non valido:', cachedData);
              setItems([]);
            }
          } catch (e) {
            console.error('Errore nel parsing della cache:', e);
            setItems([]);
          }
        }
        setLoading(false);
      }
    };

    // Verifica se è necessario aggiornare i dati
    const shouldRefresh = () => {
      // Forza l'aggiornamento all'apertura dell'app
      const lastVisit = sessionStorage.getItem('lastVisit');
      if (!lastVisit) {
        sessionStorage.setItem('lastVisit', Date.now().toString());
        return true;
      }
      
      // Verifica anche se i dati sono vecchi (più di 1 ora)
      const cacheTimestamp = localStorage.getItem('categoriesCacheTimestamp');
      if (!cacheTimestamp) return true;
      
      const now = Date.now();
      const lastUpdate = parseInt(cacheTimestamp, 10);
      const oneHour = 60 * 60 * 1000;
      
      return (now - lastUpdate) > oneHour;
    };
    
    const cache = localStorage.getItem('categoriesCache');
    if (cache && !shouldRefresh()) {
      console.log('Usando categorie dalla cache');
      try {
        const cachedData = JSON.parse(cache);
        if (cachedData && cachedData.categories && Array.isArray(cachedData.categories)) {
          setItems(cachedData.categories);
          setLoading(false);
          return;
        } else {
          console.error('Formato dati cache non valido:', cachedData);
        }
      } catch (e) {
        console.error('Errore nel parsing della cache:', e);
      }
      // Se arriviamo qui, c'è stato un problema con la cache, quindi carichiamo i dati freschi
      fetchCategories();
      return;
    }

    fetchCategories();
  }, []);
  
  // Aggiorna i dati quando la finestra viene rimessa in primo piano
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const lastVisit = sessionStorage.getItem('lastVisit');
        const now = Date.now();
        
        // Se sono passati più di 5 minuti dall'ultima visita, aggiorna i dati
        if (lastVisit && (now - parseInt(lastVisit, 10)) > 5 * 60 * 1000) {
          sessionStorage.setItem('lastVisit', now.toString());
          
          // Aggiorna i dati
          (async () => {
            try {
              const res = await fetch('/api/get-categories');
              if (!res.ok) throw new Error('Fetch fallita');
              const data = await res.json();
              setItems(data);
              localStorage.setItem('categoriesCache', JSON.stringify(data));
              localStorage.setItem('categoriesCacheTimestamp', Date.now().toString());
            } catch (e) {
              console.error('Errore recupero categorie:', e);
            }
          })();
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  if (loading || !items.length) {
    return <>{children}</>;
  }

  // 2) normalizzazione
  const normalizeText = text =>
    text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  // 3) unisco categorie + names
  const terms = items.flatMap(c => {
    // Verifica che l'item abbia la struttura corretta
    if (!c || typeof c !== 'object') {
      console.warn('Item non valido nelle categorie:', c);
      return [];
    }
    
    // Estrai categoria e nomi
    const category = c.category || '';
    const names = Array.isArray(c.names) ? c.names : [];
    
    // Filtra valori vuoti o non validi
    return [category, ...names].filter(term => term && typeof term === 'string' && term.trim() !== '');
  });
  const sortedTerms = Array.from(new Set(terms))
    .sort((a, b) => b.length - a.length);

  // 4) trova tutte le occorrenze di ogni termine
  const findTerms = text => {
    const matches = [];
    const lower = normalizeText(text);

    sortedTerms.forEach(term => {
      const norm = normalizeText(term);
      let idx = lower.indexOf(norm);
      while (idx !== -1) {
        const start = idx;
        const end   = idx + term.length;
        const before = text[start - 1] || ' ';
        const after  = text[end]     || ' ';
        if (before.match(/[\s,.]/) && after.match(/[\s,.]|$/)) {
          matches.push({ term, start, end });
        }
        idx = lower.indexOf(norm, idx + 1);
      }
    });

    return matches.sort((a, b) => a.start - b.start);
  };

  // 5) split + highlight
  const highlight = text => {
    if (!text) return '';
    const parts = [];
    let last = 0;

    findTerms(text).forEach(({ term, start, end }) => {
      if (start > last) {
        parts.push({ type: 'text',     content: text.slice(last, start) });
      }
      parts.push({ type: 'category', content: text.slice(start, end), term });
      last = end;
    });

    if (last < text.length) {
      parts.push({ type: 'text', content: text.slice(last) });
    }

    return parts;
  };

  const parts = highlight(children);
  if (!Array.isArray(parts)) return <>{children}</>;

  return (
    <>
      {parts.map((p, i) =>
        p.type === 'category' ? (
          <span
            key={i}
            className="category-highlight"
            onClick={() => onCategoryClick(p.term)}
            title={p.term}
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
