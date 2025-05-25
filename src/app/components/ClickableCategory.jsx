'use client';

import { useState, useEffect } from 'react';

export default function ClickableCategory({ children, onCategoryClick }) {
  const [items, setItems]     = useState([]); // [{ category, names: [...] }, …]
  const [loading, setLoading] = useState(true);

  // 1) fetch + cache
  useEffect(() => {
    const cache = localStorage.getItem('categoriesCache');
    if (cache) {
      setItems(JSON.parse(cache));
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const res = await fetch('/api/get-categories');
        if (!res.ok) throw new Error('Fetch fallita');
        const { categories } = await res.json();
        setItems(categories || []);
        localStorage.setItem('categoriesCache', JSON.stringify(categories || []));
      } catch (e) {
        console.error('Errore recupero categorie:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading || !items.length) {
    return <>{children}</>;
  }

  // 2) normalizzazione
  const normalizeText = text =>
    text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  // 3) unisco categorie + names
  const terms = items.flatMap(c => [c.category, ...c.names]);
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
