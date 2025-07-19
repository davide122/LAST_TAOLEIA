import { useState, useEffect } from 'react';
import { XMarkIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

export default function WelcomeGuide({ currentLanguage, onClose, languageSelected }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSeenGuide, setHasSeenGuide] = useState(false);

  // Verifica se l'utente ha già visto la guida
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const guideSeen = localStorage.getItem('welcomeGuideSeen');
      setHasSeenGuide(guideSeen === 'true');
    }
  }, []);

  // Se l'utente ha già visto la guida o non ha selezionato una lingua, non mostrare nulla
  if (hasSeenGuide || !languageSelected) {
    return null;
  }

  // Traduzioni per la guida in base alla lingua
  const guideContent = {
    it: [
      {
        title: "Benvenuto in Taoleia!",
        content: "La tua guida personale per Taormina. Scopri come utilizzare l'app in pochi semplici passi.",
        image: "/images/welcome-1.png"
      },
      {
        title: "Chiedi qualsiasi cosa",
        content: "Puoi chiedere informazioni su luoghi da visitare, ristoranti, eventi e molto altro. Basta digitare o parlare!",
        image: "/images/welcome-2.png"
      },
      {
        title: "Esplora le categorie",
        content: "Clicca sulle parole evidenziate per ottenere informazioni specifiche su luoghi e attività.",
        image: "/images/welcome-3.png"
      }
    ],
    en: [
      {
        title: "Welcome to Taoleia!",
        content: "Your personal guide for Taormina. Discover how to use the app in a few simple steps.",
        image: "/images/welcome-1.png"
      },
      {
        title: "Ask anything",
        content: "You can ask for information about places to visit, restaurants, events, and much more. Just type or speak!",
        image: "/images/welcome-2.png"
      },
      {
        title: "Explore categories",
        content: "Click on highlighted words to get specific information about places and activities.",
        image: "/images/welcome-3.png"
      }
    ],
    fr: [
      {
        title: "Bienvenue sur Taoleia!",
        content: "Votre guide personnel pour Taormina. Découvrez comment utiliser l'application en quelques étapes simples.",
        image: "/images/welcome-1.png"
      },
      {
        title: "Demandez n'importe quoi",
        content: "Vous pouvez demander des informations sur les lieux à visiter, les restaurants, les événements et bien plus encore. Il suffit de taper ou de parler!",
        image: "/images/welcome-2.png"
      },
      {
        title: "Explorez les catégories",
        content: "Cliquez sur les mots surlignés pour obtenir des informations spécifiques sur les lieux et les activités.",
        image: "/images/welcome-3.png"
      }
    ],
    es: [
      {
        title: "¡Bienvenido a Taoleia!",
        content: "Tu guía personal para Taormina. Descubre cómo usar la aplicación en unos sencillos pasos.",
        image: "/images/welcome-1.png"
      },
      {
        title: "Pregunta cualquier cosa",
        content: "Puedes pedir información sobre lugares para visitar, restaurantes, eventos y mucho más. ¡Solo escribe o habla!",
        image: "/images/welcome-2.png"
      },
      {
        title: "Explora las categorías",
        content: "Haz clic en las palabras resaltadas para obtener información específica sobre lugares y actividades.",
        image: "/images/welcome-3.png"
      }
    ],
    de: [
      {
        title: "Willkommen bei Taoleia!",
        content: "Ihr persönlicher Reiseführer für Taormina. Entdecken Sie, wie Sie die App in wenigen einfachen Schritten nutzen können.",
        image: "/images/welcome-1.png"
      },
      {
        title: "Fragen Sie alles",
        content: "Sie können Informationen über Sehenswürdigkeiten, Restaurants, Veranstaltungen und vieles mehr erfragen. Einfach tippen oder sprechen!",
        image: "/images/welcome-2.png"
      },
      {
        title: "Erkunden Sie die Kategorien",
        content: "Klicken Sie auf hervorgehobene Wörter, um spezifische Informationen über Orte und Aktivitäten zu erhalten.",
        image: "/images/welcome-3.png"
      }
    ]
  };

  // Usa il contenuto nella lingua corrente o in italiano come fallback
  const steps = guideContent[currentLanguage] || guideContent.it;

  // Traduzioni per i pulsanti
  const buttonTranslations = {
    it: { skip: "Salta", next: "Avanti", done: "Inizia" },
    en: { skip: "Skip", next: "Next", done: "Start" },
    fr: { skip: "Passer", next: "Suivant", done: "Commencer" },
    es: { skip: "Saltar", next: "Siguiente", done: "Comenzar" },
    de: { skip: "Überspringen", next: "Weiter", done: "Starten" }
  };

  const buttons = buttonTranslations[currentLanguage] || buttonTranslations.it;
  const isLastStep = currentStep === steps.length - 1;

  const handleClose = () => {
    // Salva che l'utente ha visto la guida
    if (typeof window !== 'undefined') {
      localStorage.setItem('welcomeGuideSeen', 'true');
    }
    // Aggiorna lo stato locale per nascondere immediatamente il componente
    setHasSeenGuide(true);
    onClose();
  };

  const handleNext = () => {
    if (isLastStep) {
      handleClose();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  return (
    <div className="welcome-guide fixed inset-0 z-[100000] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="guide-content bg-white rounded-lg shadow-lg max-w-sm w-full mx-4 overflow-hidden">
        <div className="relative">
          {/* Immagine di sfondo */}
          <div className="h-40 bg-orange-100 flex items-center justify-center">
            <img 
              src={steps[currentStep].image || "/images/welcome-default.png"} 
              alt="" 
              className="max-h-full max-w-full object-contain"
            />
          </div>
          
          {/* Pulsante per chiudere */}
          <button 
            onClick={handleClose}
            className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-sm"
            aria-label={buttons.skip}
          >
            <XMarkIcon className="h-4 w-4 text-gray-500" />
          </button>
        </div>
        
        {/* Contenuto del passo */}
        <div className="p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-1">{steps[currentStep].title}</h2>
          <p className="text-sm text-gray-600 mb-4">{steps[currentStep].content}</p>
          
          {/* Indicatori di passo */}
          <div className="flex justify-center mb-4">
            {steps.map((_, index) => (
              <div 
                key={index} 
                className={`h-1.5 w-1.5 rounded-full mx-1 ${index === currentStep ? 'bg-orange-500' : 'bg-gray-300'}`}
              />
            ))}
          </div>
          
          {/* Pulsanti di navigazione */}
          <div className="flex justify-between">
            <button 
              onClick={handleClose}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              {buttons.skip}
            </button>
            
            <button 
              onClick={handleNext}
              className="flex items-center bg-orange-500 hover:bg-orange-600 text-white text-sm px-3 py-1.5 rounded-md transition-colors"
            >
              {isLastStep ? buttons.done : buttons.next}
              {!isLastStep && <ArrowRightIcon className="h-3 w-3 ml-1" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}