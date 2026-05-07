'use client';

import { useState, useEffect, useMemo } from 'react';
import { useCategoriesCache } from '../hooks/useCategoriesCache';

export default function ClickableCategory({ children, onCategoryClick }) {
  const { categories: items, activities, loading } = useCategoriesCache();
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

  // Le categorie e attività vengono ora caricate tramite il hook useCategoriesCache

  // Funzione per normalizzare il testo (rimuove accenti, converte in minuscolo)
  const normalizeText = text => {
    if (!text || typeof text !== 'string') return '';
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  };
  
  // Lista di stopwords (parole comuni da ignorare)
  const stopwords = new Set([
    // Italiano
    'il', 'lo', 'la', 'i', 'gli', 'le', 'un', 'uno', 'una', 'di', 'a', 'da', 'in', 'con', 'su', 'per', 'tra', 'fra',
    'questo', 'questa', 'questi', 'queste', 'quello', 'quella', 'quelli', 'quelle', 'che', 'chi', 'cui', 'come',
    'dove', 'quando', 'perché', 'quale', 'quali', 'quanto', 'quanta', 'quanti', 'quante', 'è', 'sono', 'sei',
    'siamo', 'siete', 'ed', 'e', 'ma', 'se', 'o', 'oppure', 'nel', 'nella', 'nei', 'nelle', 'del', 'della', 'dei',
    'delle', 'al', 'allo', 'alla', 'ai', 'agli', 'alle', 'dal', 'dallo', 'dalla', 'dai', 'dagli', 'dalle',
    // Inglese
    'the', 'a', 'an', 'and', 'or', 'but', 'if', 'because', 'as', 'what', 'which', 'this', 'that', 'these', 'those',
    'then', 'just', 'so', 'than', 'such', 'both', 'through', 'about', 'for', 'is', 'are', 'was', 'were', 'be',
    'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'at', 'by', 'with', 'from',
    'to', 'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when',
    'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no',
    'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'can', 'will', 'just', 'should', 'now',
    'offers', 'located', 'serves', 'these', 'places'
  ]);
  
  // Funzione per verificare se una parola è una stopword
  const isStopword = word => {
    return stopwords.has(normalizeText(word));
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
        
        // Verifica se il termine è una singola parola e se è una stopword
        const isSingleWord = !part.includes(' ');
        const isCommonWord = isSingleWord && isStopword(part);
        
        // Aggiungi solo se non è una stopword o se è un termine composto (più parole)
        if (normalizedTerm && (!isCommonWord || !isSingleWord)) {
          termMap[normalizedTerm] = category;
          terms.add(part);
          
          // Se è un'attività o un nome completo (contiene spazi), aggiungi anche le singole parole significative
          if (category.isActivity || part.includes(' ')) {
            // Aggiungi il nome completo come termine prioritario
            const words = part.split(/\s+/);
            if (words.length > 1) {
              // Aggiungi anche le singole parole significative (più di 3 caratteri) che non sono stopwords
              words.forEach(word => {
                if (word.length >= MIN_TERM_LENGTH && !isStopword(word)) {
                  const normalizedWord = normalizeText(word);
                  // Associa la parola alla stessa categoria del nome completo
                  termMap[normalizedWord] = category;
                  terms.add(word);
                }
              });
            }
          }
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
    
    // Processa tutte le attività
    activities.forEach(activity => {
      if (activity.name) {
        // Crea un oggetto speciale per le attività
        const activityItem = {
          isActivity: true,
          id: activity.id,
          category: activity.category || 'activity',
          translated_name: activity.name,
          description: activity.description,
          address: activity.address,
          position: activity.position
        };
        
        // Aggiungi il nome dell'attività come termine da evidenziare
        mapCommaTerms(activity.name, activityItem);
        
        // Se il nome contiene "Ristorante" o altre parole chiave, aggiungi anche varianti
        if (activity.name.includes('Ristorante') || activity.name.includes('Restaurant')) {
          // Estrai il nome senza la parola "Ristorante" o "Restaurant"
          let nameWithoutPrefix = activity.name
            .replace(/^Ristorante\s+/i, '')
            .replace(/^Restaurant\s+/i, '')
            .trim();
          
          if (nameWithoutPrefix && nameWithoutPrefix.length >= 3) {
            mapCommaTerms(nameWithoutPrefix, activityItem);
          }
        }
      }
    });
    
    // Ordina i termini per lunghezza decrescente per dare priorità ai termini più lunghi
    const sortedTermsList = Array.from(terms).sort((a, b) => b.length - a.length);
    
    // Limita il numero di termini per migliorare le prestazioni
    const MAX_TERMS = 1000; // Aumentato da 500 a 1000 per migliorare la copertura
    const limitedTerms = sortedTermsList.slice(0, MAX_TERMS);
    
    return { termToCategory: termMap, sortedTerms: limitedTerms };
  }, [items, activities]);

  // Funzione per trovare i termini nel testo
  const findTerms = (text) => {
    if (!text || typeof text !== 'string' || sortedTerms.length === 0) return [];
    
    const matches = [];
    const markedRanges = [];
    
    // Normalizza il testo una sola volta
    const lower = normalizeText(text);
    
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
    
    // Cerca tutti i termini nel testo
    for (const term of sortedTerms) {
      const norm = normalizeText(term);
      
      // Salta termini troppo corti
      if (norm.length < 3) continue;
      
      // Salta le stopwords (parole comuni) a meno che non facciano parte di un termine composto
      if (!term.includes(' ') && isStopword(term)) continue;
      
      // Verifica se il termine è un'attività o un ristorante (in genere nomi più lunghi)
      const isFullNameTerm = term.includes(' ') && term.length > 10;
      
      if (isFullNameTerm) {
        // Per nomi completi (es. "Ristorante Le Naumachie"), cerca la corrispondenza esatta
        let startIdx = 0;
        let foundIdx = -1;
        
        // Cerca tutte le occorrenze del termine completo
        while ((foundIdx = lower.indexOf(norm, startIdx)) !== -1) {
          const matchEnd = foundIdx + norm.length;
          startIdx = matchEnd;
          
          // Verifica se questa parte di testo è già stata evidenziata
          const isOverlapping = markedRanges.some(
            range => (foundIdx >= range.start && foundIdx < range.end) || 
                    (matchEnd > range.start && matchEnd <= range.end) ||
                    (foundIdx <= range.start && matchEnd >= range.end)
          );
          
          // Aggiungi il match solo se non si sovrappone
          if (!isOverlapping) {
            // Trova la categoria associata a questo termine
            const category = termToCategory[norm];
            
            // Usa il testo originale per l'evidenziazione
            const originalText = text.substring(foundIdx, matchEnd);
            matches.push({ term: originalText, start: foundIdx, end: matchEnd, category });
            markedRanges.push({ start: foundIdx, end: matchEnd });
          }
        }
      } else {
        // Per termini singoli, usa l'approccio parola per parola
        let idx = 0;
        const words = lower.split(/[\s,.]+/);
        
        for (let i = 0; i < words.length; i++) {
          const word = words[i];
          if (word.length < 3) continue;
          
          // Salta le stopwords (parole comuni)
          if (isStopword(word)) continue;
          
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
