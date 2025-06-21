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
  
  // Funzione per chiudere il modale quando si tocca fuori da esso
  const handleOverlayClick = (e) => {
    if (e.target.className === 'language-modal-overlay') {
      // Chiudi il modale solo se il click è sull'overlay e non sul contenuto
      onLanguageSelect(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="language-modal-overlay" onClick={handleOverlayClick}>
      <div className="language-modal">
        <h2>Seleziona la tua lingua</h2>
        <p>Scegli la lingua per parlare con Taoleia</p>
        
        <div className="language-options">
          {languages.map((lang) => (
            <button
              key={lang.code}
              className="language-option-button"
              onClick={() => onLanguageSelect(lang.code)}
              aria-label={`Seleziona lingua ${lang.name}`}
            >
              <span className="language-flag">{lang.flag}</span>
              <span className="language-name">{lang.name}</span>
            </button>
          ))}
        </div>
        
        <button 
          className="close-modal-button" 
          onClick={() => onLanguageSelect(null)}
          aria-label="Chiudi selezione lingua"
        >
          Chiudi
        </button>
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
          padding: 1rem;
          touch-action: none; /* Previene lo scroll su dispositivi touch quando il modale è aperto */
        }
        
        .language-modal {
          background-color: #0A3B3B;
          border-radius: 1rem;
          padding: 1.5rem;
          width: 100%;
          max-width: 500px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          color: #F5EFE0;
          text-align: center;
          max-height: 90vh;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .language-modal h2 {
          margin-top: 0;
          font-size: 1.3rem;
          margin-bottom: 0.25rem;
        }
        
        .language-modal p {
          margin-bottom: 1rem;
          opacity: 0.8;
          font-size: 0.9rem;
        }
        
        .language-options {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
          gap: 0.75rem;
        }
        
        .language-option-button {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0.75rem;
          background-color: rgba(245, 239, 224, 0.1);
          border: 1px solid rgba(245, 239, 224, 0.3);
          border-radius: 0.5rem;
          cursor: pointer;
          transition: all 0.2s ease;
          -webkit-tap-highlight-color: transparent; /* Rimuove l'evidenziazione al tocco su dispositivi mobili */
        }
        
        .language-option-button:hover {
          background-color: rgba(245, 239, 224, 0.2);
        }
        
        .language-option-button:active {
          transform: scale(0.95);
        }
        
        .language-flag {
          font-size: 1.8rem;
          margin-bottom: 0.4rem;
        }
        
        .language-name {
          font-size: 0.85rem;
        }
        
        .close-modal-button {
          margin-top: 1rem;
          padding: 0.75rem;
          background-color: rgba(245, 239, 224, 0.15);
          border: 1px solid rgba(245, 239, 224, 0.3);
          border-radius: 0.5rem;
          color: #F5EFE0;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s ease;
          width: 100%;
        }
        
        .close-modal-button:hover {
          background-color: rgba(245, 239, 224, 0.25);
        }
        
        .close-modal-button:active {
          transform: scale(0.98);
        }
        
        /* Media queries per dispositivi mobili */
        @media (max-width: 480px) {
          .language-modal {
            padding: 1.25rem;
            border-radius: 0.75rem;
          }
          
          .language-options {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .language-flag {
            font-size: 1.5rem;
          }
          
          .language-name {
            font-size: 0.8rem;
          }
        }
        
        /* Per schermi molto piccoli */
        @media (max-width: 320px) {
          .language-modal {
            padding: 1rem;
          }
          
          .language-options {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}