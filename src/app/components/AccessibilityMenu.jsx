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
    <div className="fixed top-3 left-3 z-50">
      {/* Pulsante per aprire/chiudere il menu */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-1.5 rounded-full shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
        aria-label="Accessibility settings"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
        </svg>
      </button>

      {/* Menu di accessibilità */}
      {isOpen && (
        <div className="mt-2 bg-white rounded-lg shadow-md p-3 w-56 border border-gray-200">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-base font-semibold text-gray-800">Accessibility</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Close menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Controlli per il contrasto */}
          <div className="mb-3">
            <h3 className="text-xs font-medium text-gray-700 mb-1">Contrast</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => changeContrast('normal')}
                className={`px-2 py-0.5 rounded text-xs ${contrast === 'normal' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                Normal
              </button>
              <button
                onClick={() => changeContrast('high')}
                className={`px-2 py-0.5 rounded text-xs ${contrast === 'high' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                High contrast
              </button>
            </div>
          </div>

          {/* Controlli per la dimensione del testo */}
          <div>
            <h3 className="text-xs font-medium text-gray-700 mb-1">Text size</h3>
            <div className="flex items-center justify-between">
              <button
                onClick={() => changeFontSize('decrease')}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-0.5 rounded"
                aria-label="Decrease text size"
                disabled={fontSize === 'small'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                </svg>
              </button>
              
              <span className="text-xs text-gray-700 mx-2">
                {fontSize === 'small' ? 'Small' : fontSize === 'medium' ? 'Medium' : 'Large'}
              </span>
              
              <button
                onClick={() => changeFontSize('increase')}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-0.5 rounded"
                aria-label="Increase text size"
                disabled={fontSize === 'large'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}