'use client';

import React from 'react';

export default function LanguageModal({ isOpen, onLanguageSelect }) {
  const languages = [
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  ];

  if (!isOpen) return null;

  return (
    <div className="language-modal-overlay">
      <div className="language-modal">
        <h2>Seleziona la tua lingua</h2>
        <p>Scegli la lingua per parlare con Taoleia</p>
        
        <div className="language-options">
          {languages.map((lang) => (
            <button
              key={lang.code}
              className="language-option-button"
              onClick={() => onLanguageSelect(lang.code)}
            >
              <span className="language-flag">{lang.flag}</span>
              <span className="language-name">{lang.name}</span>
            </button>
          ))}
        </div>
      </div>

      <style jsx>{`
        .language-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        
        .language-modal {
          background-color: #0A3B3B;
          border-radius: 1rem;
          padding: 2rem;
          width: 90%;
          max-width: 500px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          color: #F5EFE0;
          text-align: center;
        }
        
        .language-modal h2 {
          margin-top: 0;
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
        }
        
        .language-modal p {
          margin-bottom: 1.5rem;
          opacity: 0.8;
        }
        
        .language-options {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 1rem;
        }
        
        .language-option-button {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 1rem;
          background-color: rgba(245, 239, 224, 0.1);
          border: 1px solid rgba(245, 239, 224, 0.3);
          border-radius: 0.5rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .language-option-button:hover {
          background-color: rgba(245, 239, 224, 0.2);
          transform: translateY(-2px);
        }
        
        .language-flag {
          font-size: 2rem;
          margin-bottom: 0.5rem;
        }
        
        .language-name {
          font-size: 0.9rem;
        }
      `}</style>
    </div>
  );
}