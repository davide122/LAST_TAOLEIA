import React, { useState, useEffect, useRef } from 'react';
import { languages } from '../config/languages';

export default function LanguageDropdown({ onLanguageChange }) {
  const [selectedLanguage, setSelectedLanguage] = useState('it');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Mappa delle bandiere per ogni lingua
  const flags = {
    it: '🇮🇹',
    en: '🇬🇧',
    fr: '🇫🇷',
    es: '🇪🇸',
    de: '🇩🇪',
    pt: '🇵🇹',
    ru: '🇷🇺',
    zh: '🇨🇳',
    ja: '🇯🇵',
    ar: '🇸🇦'
  };

  useEffect(() => {
    // Recupera la lingua salvata dal localStorage all'avvio
    const savedLanguage = localStorage.getItem('preferredLanguage') || 'it';
    setSelectedLanguage(savedLanguage);
    onLanguageChange(savedLanguage);

    // Chiudi il dropdown quando si clicca fuori
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onLanguageChange]);

  const handleLanguageChange = (langCode) => {
    setSelectedLanguage(langCode);
    localStorage.setItem('preferredLanguage', langCode);
    onLanguageChange(langCode);
    setIsOpen(false);
  };

  return (
    <div className="language-dropdown" ref={dropdownRef}>
      <button 
        className="language-dropdown-button" 
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="flag">{flags[selectedLanguage] || '🌐'}</span>
        <span className="lang-name">{languages.find(l => l.code === selectedLanguage)?.name || 'Lingua'}</span>
        <span className="dropdown-arrow">▼</span>
      </button>
      
      {isOpen && (
        <div className="language-dropdown-menu">
          {languages.map((lang) => (
            <button
              key={lang.code}
              className={`language-option ${selectedLanguage === lang.code ? 'selected' : ''}`}
              onClick={() => handleLanguageChange(lang.code)}
            >
              <span className="flag">{flags[lang.code] || '🌐'}</span>
              <span>{lang.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}