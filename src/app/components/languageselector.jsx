'use client';

import { useState, useEffect } from 'react';

export default function LanguageSelector({ currentLanguage, onLanguageChange }) {
  const languages = [
    { code: 'it', name: 'Italiano' },
    { code: 'en', name: 'English' },
    { code: 'fr', name: 'Français' },
    { code: 'es', name: 'Español' },
    { code: 'de', name: 'Deutsch' },
    { code: 'pt', name: 'Português' },
    { code: 'ru', name: 'Русский' },
    { code: 'zh', name: '中文' },
    { code: 'ja', name: '日本語' },
    { code: 'ar', name: 'العربية' }
  ];

  return (
    <div className="language-selector">
      <select
        value={currentLanguage}
        onChange={e => onLanguageChange(e.target.value)}
        className="language-select"
        style={{
          backgroundColor: 'rgba(10, 59, 59, 0.8)',
          color: '#F5EFE0',
          border: '1px solid rgba(245, 239, 224, 0.3)',
          borderRadius: '1rem',
          padding: '0.5rem',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          transition: 'all 0.2s ease'
        }}
      >
        {languages.map(lang => (
          <option 
            key={lang.code} 
            value={lang.code}
            style={{
              backgroundColor: '#0A3B3B',
              color: '#F5EFE0'
            }}
          >
            {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
}