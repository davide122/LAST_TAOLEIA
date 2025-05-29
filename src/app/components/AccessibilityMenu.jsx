'use client';

import { useState, useEffect } from 'react';

export default function AccessibilityMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [fontSize, setFontSize] = useState('medium');
  const [contrast, setContrast] = useState('normal');
  
  // Carica le preferenze salvate quando il componente viene montato
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedFontSize = localStorage.getItem('taoleia-font-size') || 'medium';
      const savedContrast = localStorage.getItem('taoleia-contrast') || 'normal';
      
      setFontSize(savedFontSize);
      setContrast(savedContrast);
      
      // Applica le preferenze salvate
      applyFontSize(savedFontSize);
      applyContrast(savedContrast);
    }
  }, []);
  
  // Funzione per cambiare la dimensione del testo
  const changeFontSize = (size) => {
    setFontSize(size);
    localStorage.setItem('taoleia-font-size', size);
    applyFontSize(size);
  };
  
  // Funzione per cambiare il contrasto
  const changeContrast = (level) => {
    setContrast(level);
    localStorage.setItem('taoleia-contrast', level);
    applyContrast(level);
  };
  
  // Applica la dimensione del testo
  const applyFontSize = (size) => {
    const html = document.documentElement;
    
    // Rimuovi tutte le classi di dimensione del testo
    html.classList.remove('font-size-small', 'font-size-medium', 'font-size-large', 'font-size-xlarge');
    
    // Aggiungi la classe appropriata
    html.classList.add(`font-size-${size}`);
  };
  
  // Applica il livello di contrasto
  const applyContrast = (level) => {
    const html = document.documentElement;
    
    // Rimuovi tutte le classi di contrasto
    html.classList.remove('contrast-normal', 'contrast-high');
    
    // Aggiungi la classe appropriata
    html.classList.add(`contrast-${level}`);
  };
  
  return (
    <div className="accessibility-menu-container">
      <button 
        className="accessibility-toggle-button" 
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label="Menu accessibilità"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 8v8"></path>
          <path d="M8 12h8"></path>
        </svg>
      </button>
      
      {isOpen && (
        <div className="accessibility-panel" role="dialog" aria-label="Impostazioni di accessibilità">
          <h3>Accessibilità</h3>
          
          <div className="accessibility-section">
            <h4 id="font-size-label">Dimensione testo</h4>
            <div className="accessibility-controls" role="radiogroup" aria-labelledby="font-size-label">
              <button 
                className={`accessibility-button ${fontSize === 'small' ? 'active' : ''}`}
                onClick={() => changeFontSize('small')}
                aria-checked={fontSize === 'small'}
                role="radio"
              >
                Piccolo
              </button>
              <button 
                className={`accessibility-button ${fontSize === 'medium' ? 'active' : ''}`}
                onClick={() => changeFontSize('medium')}
                aria-checked={fontSize === 'medium'}
                role="radio"
              >
                Medio
              </button>
              <button 
                className={`accessibility-button ${fontSize === 'large' ? 'active' : ''}`}
                onClick={() => changeFontSize('large')}
                aria-checked={fontSize === 'large'}
                role="radio"
              >
                Grande
              </button>
              <button 
                className={`accessibility-button ${fontSize === 'xlarge' ? 'active' : ''}`}
                onClick={() => changeFontSize('xlarge')}
                aria-checked={fontSize === 'xlarge'}
                role="radio"
              >
                Molto grande
              </button>
            </div>
          </div>
          
          <div className="accessibility-section">
            <h4 id="contrast-label">Contrasto</h4>
            <div className="accessibility-controls" role="radiogroup" aria-labelledby="contrast-label">
              <button 
                className={`accessibility-button ${contrast === 'normal' ? 'active' : ''}`}
                onClick={() => changeContrast('normal')}
                aria-checked={contrast === 'normal'}
                role="radio"
              >
                Normale
              </button>
              <button 
                className={`accessibility-button ${contrast === 'high' ? 'active' : ''}`}
                onClick={() => changeContrast('high')}
                aria-checked={contrast === 'high'}
                role="radio"
              >
                Alto contrasto
              </button>
            </div>
          </div>
          
          <button 
            className="accessibility-close-button"
            onClick={() => setIsOpen(false)}
            aria-label="Chiudi menu accessibilità"
          >
            Chiudi
          </button>
        </div>
      )}
    </div>
  );
}