import { useState, useEffect } from 'react';
import { LightBulbIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function FeatureIntroduction({ currentLanguage }) {
  const [currentTip, setCurrentTip] = useState(0);
  const [showTip, setShowTip] = useState(false);
  const [tipsShown, setTipsShown] = useState([]);

  // Traduzioni per i suggerimenti in base alla lingua
  const tipsByLanguage = {
    it: [
      {
        id: 'voice-input',
        title: 'Prova l\'input vocale',
        content: 'Puoi parlare con Taoleia! Premi il pulsante del microfono e fai la tua domanda.',
        element: '.speech-button',
        position: 'top'
      },
      {
        id: 'clickable-categories',
        title: 'Parole evidenziate',
        content: 'Le parole evidenziate sono cliccabili. Prova a cliccarci sopra per ottenere più informazioni!',
        element: '.category-highlight',
        position: 'bottom'
      },
      {
        id: 'language-selection',
        title: 'Cambia lingua',
        content: 'Puoi cambiare la lingua dell\'app in qualsiasi momento dal menu in alto a destra.',
        element: '.language-selector',
        position: 'bottom'
      }
    ],
    en: [
      {
        id: 'voice-input',
        title: 'Try voice input',
        content: 'You can talk to Taoleia! Press the microphone button and ask your question.',
        element: '.speech-button',
        position: 'top'
      },
      {
        id: 'clickable-categories',
        title: 'Highlighted words',
        content: 'Highlighted words are clickable. Try clicking on them to get more information!',
        element: '.category-highlight',
        position: 'bottom'
      },
      {
        id: 'language-selection',
        title: 'Change language',
        content: 'You can change the app language at any time from the menu in the top right.',
        element: '.language-selector',
        position: 'bottom'
      }
    ],
    fr: [
      {
        id: 'voice-input',
        title: 'Essayez l\'entrée vocale',
        content: 'Vous pouvez parler à Taoleia ! Appuyez sur le bouton du microphone et posez votre question.',
        element: '.speech-button',
        position: 'top'
      },
      {
        id: 'clickable-categories',
        title: 'Mots surlignés',
        content: 'Les mots surlignés sont cliquables. Essayez de cliquer dessus pour obtenir plus d\'informations !',
        element: '.category-highlight',
        position: 'bottom'
      },
      {
        id: 'language-selection',
        title: 'Changer de langue',
        content: 'Vous pouvez changer la langue de l\'application à tout moment depuis le menu en haut à droite.',
        element: '.language-selector',
        position: 'bottom'
      }
    ],
    es: [
      {
        id: 'voice-input',
        title: 'Prueba la entrada de voz',
        content: '¡Puedes hablar con Taoleia! Presiona el botón del micrófono y haz tu pregunta.',
        element: '.speech-button',
        position: 'top'
      },
      {
        id: 'clickable-categories',
        title: 'Palabras resaltadas',
        content: 'Las palabras resaltadas son clicables. ¡Intenta hacer clic en ellas para obtener más información!',
        element: '.category-highlight',
        position: 'bottom'
      },
      {
        id: 'language-selection',
        title: 'Cambiar idioma',
        content: 'Puedes cambiar el idioma de la aplicación en cualquier momento desde el menú en la parte superior derecha.',
        element: '.language-selector',
        position: 'bottom'
      }
    ],
    de: [
      {
        id: 'voice-input',
        title: 'Sprachsteuerung ausprobieren',
        content: 'Sie können mit Taoleia sprechen! Drücken Sie die Mikrofontaste und stellen Sie Ihre Frage.',
        element: '.speech-button',
        position: 'top'
      },
      {
        id: 'clickable-categories',
        title: 'Hervorgehobene Wörter',
        content: 'Hervorgehobene Wörter sind anklickbar. Klicken Sie darauf, um weitere Informationen zu erhalten!',
        element: '.category-highlight',
        position: 'bottom'
      },
      {
        id: 'language-selection',
        title: 'Sprache ändern',
        content: 'Sie können die Sprache der App jederzeit über das Menü oben rechts ändern.',
        element: '.language-selector',
        position: 'bottom'
      }
    ]
  };

  // Usa i suggerimenti nella lingua corrente o in italiano come fallback
  const tips = tipsByLanguage[currentLanguage] || tipsByLanguage.it;

  // Verifica quali suggerimenti sono già stati mostrati
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const shown = JSON.parse(localStorage.getItem('tipsShown') || '[]');
      setTipsShown(shown);
    }
  }, []);

  // Mostra un suggerimento quando l'elemento corrispondente è presente nella pagina
  useEffect(() => {
    const checkForElements = () => {
      for (let i = 0; i < tips.length; i++) {
        const tip = tips[i];
        
        // Salta i suggerimenti già mostrati
        if (tipsShown.includes(tip.id)) continue;
        
        // Verifica se l'elemento è presente nella pagina
        const element = document.querySelector(tip.element);
        if (element) {
          setCurrentTip(i);
          setShowTip(true);
          
          // Salva che questo suggerimento è stato mostrato
          const newTipsShown = [...tipsShown, tip.id];
          setTipsShown(newTipsShown);
          localStorage.setItem('tipsShown', JSON.stringify(newTipsShown));
          
          break;
        }
      }
    };

    // Controlla dopo un breve ritardo per dare tempo agli elementi di renderizzarsi
    const timer = setTimeout(checkForElements, 2000);
    return () => clearTimeout(timer);
  }, [tips, tipsShown]);

  // Se non c'è nessun suggerimento da mostrare, non renderizzare nulla
  if (!showTip) return null;

  const tip = tips[currentTip];

  // Posiziona il suggerimento in base all'elemento di riferimento
  const positionTip = () => {
    const element = document.querySelector(tip.element);
    if (!element) return {};

    const rect = element.getBoundingClientRect();
    const tipStyle = {};

    if (tip.position === 'top') {
      tipStyle.bottom = `${window.innerHeight - rect.top + 10}px`;
      tipStyle.left = `${rect.left + rect.width / 2}px`;
      tipStyle.transform = 'translateX(-50%)';
    } else if (tip.position === 'bottom') {
      tipStyle.top = `${rect.bottom + 10}px`;
      tipStyle.left = `${rect.left + rect.width / 2}px`;
      tipStyle.transform = 'translateX(-50%)';
    } else if (tip.position === 'left') {
      tipStyle.top = `${rect.top + rect.height / 2}px`;
      tipStyle.right = `${window.innerWidth - rect.left + 10}px`;
      tipStyle.transform = 'translateY(-50%)';
    } else if (tip.position === 'right') {
      tipStyle.top = `${rect.top + rect.height / 2}px`;
      tipStyle.left = `${rect.right + 10}px`;
      tipStyle.transform = 'translateY(-50%)';
    }

    return tipStyle;
  };

  const handleClose = () => {
    setShowTip(false);
  };

  return (
    <div 
      className="fixed z-50 bg-white rounded-lg shadow-md p-3 max-w-xs animate-fade-in" 
      style={positionTip()}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center">
          <LightBulbIcon className="h-4 w-4 text-yellow-500 mr-1" />
          <h3 className="font-medium text-gray-900 text-sm">{tip.title}</h3>
        </div>
        <button 
          onClick={() => setShowTip(false)}
          className="text-gray-400 hover:text-gray-500"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
      <p className="text-xs text-gray-600">{tip.content}</p>
    </div>
  );
}