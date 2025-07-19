import { useState, useEffect } from 'react';
import { ArrowRightIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function ChatTutorial({ currentLanguage, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);

  // Verifica se l'utente ha già completato il tutorial e se ha selezionato una lingua
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const tutorialCompleted = localStorage.getItem('chatTutorialCompleted');
      const languageSelected = localStorage.getItem('selectedLanguage');
      
      // Mostra il tutorial solo se non è stato completato E se è stata selezionata una lingua
      setShowTutorial(!tutorialCompleted && languageSelected);
    }
  }, [currentLanguage]); // Aggiungi currentLanguage come dipendenza per aggiornare quando cambia la lingua

  // Traduzioni per il tutorial in base alla lingua
  const tutorialSteps = {
    it: [
      {
        title: "Benvenuto nella chat di Taoleia",
        content: "Questa breve guida ti mostrerà come utilizzare al meglio la chat per ottenere informazioni su Taormina.",
        image: "/images/tutorial-welcome.png"
      },
      {
        title: "Fai domande naturali",
        content: "Puoi chiedere qualsiasi cosa su Taormina, come 'Dove posso mangiare pesce?' o 'Raccontami la storia del Teatro Antico'.",
        image: "/images/tutorial-ask.png"
      },
      {
        title: "Usa l'input vocale",
        content: "Premi il pulsante del microfono per parlare direttamente con Taoleia. Funziona in tutte le lingue supportate!",
        image: "/images/tutorial-voice.png"
      },
      {
        title: "Esplora i contenuti",
        content: "Quando vedi parole evidenziate, puoi cliccarci sopra per ottenere informazioni specifiche su quel luogo o argomento.",
        image: "/images/tutorial-explore.png"
      },
      {
        title: "Sei pronto!",
        content: "Ora sei pronto per esplorare Taormina con Taoleia. Buon divertimento!",
        image: "/images/tutorial-ready.png"
      }
    ],
    en: [
      {
        title: "Welcome to Taoleia chat",
        content: "This short guide will show you how to best use the chat to get information about Taormina.",
        image: "/images/tutorial-welcome.png"
      },
      {
        title: "Ask natural questions",
        content: "You can ask anything about Taormina, like 'Where can I eat seafood?' or 'Tell me about the Ancient Theatre'.",
        image: "/images/tutorial-ask.png"
      },
      {
        title: "Use voice input",
        content: "Press the microphone button to speak directly to Taoleia. It works in all supported languages!",
        image: "/images/tutorial-voice.png"
      },
      {
        title: "Explore content",
        content: "When you see highlighted words, you can click on them to get specific information about that place or topic.",
        image: "/images/tutorial-explore.png"
      },
      {
        title: "You're ready!",
        content: "Now you're ready to explore Taormina with Taoleia. Have fun!",
        image: "/images/tutorial-ready.png"
      }
    ],
    fr: [
      {
        title: "Bienvenue dans le chat Taoleia",
        content: "Ce court guide vous montrera comment utiliser au mieux le chat pour obtenir des informations sur Taormina.",
        image: "/images/tutorial-welcome.png"
      },
      {
        title: "Posez des questions naturelles",
        content: "Vous pouvez demander n'importe quoi sur Taormina, comme 'Où puis-je manger des fruits de mer?' ou 'Parlez-moi du Théâtre Antique'.",
        image: "/images/tutorial-ask.png"
      },
      {
        title: "Utilisez l'entrée vocale",
        content: "Appuyez sur le bouton du microphone pour parler directement à Taoleia. Cela fonctionne dans toutes les langues prises en charge!",
        image: "/images/tutorial-voice.png"
      },
      {
        title: "Explorez le contenu",
        content: "Lorsque vous voyez des mots surlignés, vous pouvez cliquer dessus pour obtenir des informations spécifiques sur ce lieu ou ce sujet.",
        image: "/images/tutorial-explore.png"
      },
      {
        title: "Vous êtes prêt!",
        content: "Vous êtes maintenant prêt à explorer Taormina avec Taoleia. Amusez-vous bien!",
        image: "/images/tutorial-ready.png"
      }
    ],
    es: [
      {
        title: "Bienvenido al chat de Taoleia",
        content: "Esta breve guía te mostrará cómo utilizar mejor el chat para obtener información sobre Taormina.",
        image: "/images/tutorial-welcome.png"
      },
      {
        title: "Haz preguntas naturales",
        content: "Puedes preguntar cualquier cosa sobre Taormina, como '¿Dónde puedo comer mariscos?' o 'Cuéntame sobre el Teatro Antiguo'.",
        image: "/images/tutorial-ask.png"
      },
      {
        title: "Usa la entrada de voz",
        content: "Presiona el botón del micrófono para hablar directamente con Taoleia. ¡Funciona en todos los idiomas compatibles!",
        image: "/images/tutorial-voice.png"
      },
      {
        title: "Explora el contenido",
        content: "Cuando veas palabras resaltadas, puedes hacer clic en ellas para obtener información específica sobre ese lugar o tema.",
        image: "/images/tutorial-explore.png"
      },
      {
        title: "¡Estás listo!",
        content: "Ahora estás listo para explorar Taormina con Taoleia. ¡Diviértete!",
        image: "/images/tutorial-ready.png"
      }
    ],
    de: [
      {
        title: "Willkommen im Taoleia-Chat",
        content: "Diese kurze Anleitung zeigt Ihnen, wie Sie den Chat am besten nutzen können, um Informationen über Taormina zu erhalten.",
        image: "/images/tutorial-welcome.png"
      },
      {
        title: "Stellen Sie natürliche Fragen",
        content: "Sie können alles über Taormina fragen, wie 'Wo kann ich Meeresfrüchte essen?' oder 'Erzählen Sie mir vom Antiken Theater'.",
        image: "/images/tutorial-ask.png"
      },
      {
        title: "Verwenden Sie die Spracheingabe",
        content: "Drücken Sie die Mikrofontaste, um direkt mit Taoleia zu sprechen. Es funktioniert in allen unterstützten Sprachen!",
        image: "/images/tutorial-voice.png"
      },
      {
        title: "Erkunden Sie den Inhalt",
        content: "Wenn Sie hervorgehobene Wörter sehen, können Sie darauf klicken, um spezifische Informationen zu diesem Ort oder Thema zu erhalten.",
        image: "/images/tutorial-explore.png"
      },
      {
        title: "Sie sind bereit!",
        content: "Jetzt sind Sie bereit, Taormina mit Taoleia zu erkunden. Viel Spaß!",
        image: "/images/tutorial-ready.png"
      }
    ]
  };

  // Usa i passi del tutorial nella lingua corrente o in italiano come fallback
  const steps = tutorialSteps[currentLanguage] || tutorialSteps.it;

  // Traduzioni per i pulsanti
  const buttonTranslations = {
    it: { skip: "Salta tutorial", next: "Avanti", done: "Inizia a usare Taoleia" },
    en: { skip: "Skip tutorial", next: "Next", done: "Start using Taoleia" },
    fr: { skip: "Passer le tutoriel", next: "Suivant", done: "Commencer à utiliser Taoleia" },
    es: { skip: "Saltar tutorial", next: "Siguiente", done: "Empezar a usar Taoleia" },
    de: { skip: "Tutorial überspringen", next: "Weiter", done: "Taoleia verwenden" }
  };

  const buttons = buttonTranslations[currentLanguage] || buttonTranslations.it;
  const isLastStep = currentStep === steps.length - 1;

  const handleComplete = () => {
    // Salva che l'utente ha completato il tutorial
    if (typeof window !== 'undefined') {
      localStorage.setItem('chatTutorialCompleted', 'true');
    }
    setShowTutorial(false);
    // Assicurati che la chat sia visibile dopo il completamento del tutorial
    document.querySelector('.chat-tutorial')?.classList.add('hidden');
    if (onComplete) onComplete();
  };

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  if (!showTutorial) {
    // Assicurati che il tutorial sia completamente rimosso dal DOM
    return null;
  }

  return (
    <div className="chat-tutorial fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="tutorial-content bg-white rounded-xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
        {/* Immagine del tutorial */}
        <div className="h-56 bg-orange-100 flex items-center justify-center">
          <img 
            src={steps[currentStep].image || "/images/tutorial-default.png"} 
            alt="" 
            className="max-h-full max-w-full object-contain"
          />
        </div>
        
        {/* Contenuto del passo */}
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">{steps[currentStep].title}</h2>
          <p className="text-gray-600 mb-6">{steps[currentStep].content}</p>
          
          {/* Indicatori di passo */}
          <div className="flex justify-center mb-6">
            {steps.map((_, index) => (
              <div 
                key={index} 
                className={`h-2 w-${index === currentStep ? '6' : '2'} rounded-full mx-1 transition-all ${index === currentStep ? 'bg-orange-500' : 'bg-gray-300'}`}
              />
            ))}
          </div>
          
          {/* Pulsanti di navigazione */}
          <div className="flex justify-between items-center">
            <button 
              onClick={handleComplete}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              {buttons.skip}
            </button>
            
            <button 
              onClick={handleNext}
              className="flex items-center bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              {isLastStep ? buttons.done : buttons.next}
              {!isLastStep && <ArrowRightIcon className="h-4 w-4 ml-2" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}