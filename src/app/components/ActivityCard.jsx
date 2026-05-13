'use client';

import { useState } from 'react';
import { FiPlay, FiPause, FiLoader } from 'react-icons/fi';
import ClickableCategory from './ClickableCategory';
import { useAudioManager } from '../hooks/useAudioManager';

export default function ActivityCard({
  name,
  description,
  address,
  phone_number,
  email,
  website,
  google_maps_url,
  menu,
  prices,
  audio_guide_text,
  language_code = 'it',
  images = [],   // array di {url, alt, main}
  onCategoryClick
}) {
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [showFullAudioText, setShowFullAudioText] = useState(false);
  const [current, setCurrent] = useState(0);
  const total = images.length;
  
  // Hook per gestire l'audio
  const { playAudio, isAudioEnabled, isPlaying, togglePlayPause, stopCurrentAudio, audioElementRef } = useAudioManager();

  const prev = () => setCurrent((current - 1 + total) % total);
  const next = () => setCurrent((current + 1) % total);
  
  // Funzione per gestire play/pause dell'audio guida
  const handlePlayAudioGuide = async () => {
    if (!audio_guide_text || !isAudioEnabled) return;
    
    // Se c'è già un audio caricato (in pausa o in riproduzione), usa solo toggle
    if (audioElementRef.current) {
      togglePlayPause();
      return;
    }
    
    // Solo se non c'è nessun audio caricato, fai una nuova chiamata API
    if (!isAudioLoading) {
      setIsAudioLoading(true);
      try {
        await playAudio(audio_guide_text);
      } catch (error) {
        console.error('Errore durante la riproduzione audio:', error);
      } finally {
        setIsAudioLoading(false);
      }
    }
  };

  // Funzione per limitare il testo dell'audio guida
  const getDisplayedAudioText = (text) => {
    if (!text) return '';
    const maxLength = 150;
    if (text.length <= maxLength || showFullAudioText) {
      return text;
    }
    return text.substring(0, maxLength) + '...';
  };

  // Traduzioni per le etichette dell'interfaccia
  const translations = {
    address: {
      it: 'Indirizzo',
      en: 'Address',
      fr: 'Adresse',
      es: 'Dirección',
      de: 'Adresse'
    },
    phone: {
      it: 'Telefono',
      en: 'Phone',
      fr: 'Téléphone',
      es: 'Teléfono',
      de: 'Telefon'
    },
    email: {
      it: 'Email',
      en: 'Email',
      fr: 'Email',
      es: 'Email',
      de: 'E-Mail'
    },
    website: {
      it: 'Sito',
      en: 'Website',
      fr: 'Site web',
      es: 'Sitio web',
      de: 'Webseite'
    },
    map: {
      it: 'Vedi su Google Maps',
      en: 'View on Google Maps',
      fr: 'Voir sur Google Maps',
      es: 'Ver en Google Maps',
      de: 'Auf Google Maps ansehen'
    },
    menu: {
      it: 'Menu',
      en: 'Menu',
      fr: 'Menu',
      es: 'Menú',
      de: 'Speisekarte'
    },
    prices: {
      it: 'Prezzi',
      en: 'Prices',
      fr: 'Prix',
      es: 'Precios',
      de: 'Preise'
    },
    audioGuide: {
      it: 'Audio Guida',
      en: 'Audio Guide',
      fr: 'Guide Audio',
      es: 'Guía de Audio',
      de: 'Audio-Führung'
    },
    listenMore: {
      it: 'Ascolta l\'audio guida per saperne di più',
      en: 'Listen to the audio guide to learn more',
      fr: 'Écoutez le guide audio pour en savoir plus',
      es: 'Escucha la guía de audio para saber más',
      de: 'Hören Sie den Audio-Guide, um mehr zu erfahren'
    },
    showMore: {
      it: 'Mostra altro',
      en: 'Show more',
      fr: 'Afficher plus',
      es: 'Mostrar más',
      de: 'Mehr anzeigen'
    },
    showLess: {
      it: 'Mostra meno',
      en: 'Show less',
      fr: 'Afficher moins',
      es: 'Mostrar menos',
      de: 'Weniger anzeigen'
    },
    pause: {
      it: 'Pausa',
      en: 'Pause',
      fr: 'Pause',
      es: 'Pausa',
      de: 'Pause'
    },
    listen: {
      it: 'Ascolta',
      en: 'Listen',
      fr: 'Écouter',
      es: 'Escuchar',
      de: 'Anhören'
    }
  };

  // Usa la lingua corrente o fallback a italiano
  const currentLang = language_code && translations.address[language_code] ? language_code : 'it';

  return (
    <div 
      className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-black/5 flex flex-col overflow-hidden"
      role="article"
      aria-label={name}
    >
      
      {/* Carousel immagini */}
      {total > 0 && (
        <div 
          className="relative overflow-hidden h-[200px] sm:h-[250px]"
          role="region"
          aria-roledescription="carousel"
          aria-label="Galleria immagini"
        >
          {images.map((img, i) => (
            <img
              key={i}
              src={img.url}
              alt={img.alt || `Immagine ${i+1} di ${name}`}
              className={`
                absolute inset-0 w-full h-full object-cover transition-opacity duration-500 
                ${i === current ? 'opacity-100' : 'opacity-0'}
              `}
              aria-hidden={i !== current}
            />
          ))}

          {/* Frecce */}
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 hover:bg-gray-200 p-1 rounded-full freccia"
            aria-label="Immagine precedente"
          >
            ‹
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 hover:bg-gray-200 p-1 rounded-full freccia"
            aria-label="Immagine successiva"
          >
            ›
          </button>

          {/* Indicatori */}
          <div 
            className="absolute bottom-2 w-full flex justify-center space-x-2"
            role="tablist"
            aria-label="Selettore immagini"
          >
            {images.map((_, i) => (
              <span
                key={i}
                className={`
                  w-2 h-2 rounded-full
                  ${i === current ? 'bg-gray-800' : 'bg-gray-400'}
                `}
                role="tab"
                aria-selected={i === current}
                aria-label={`Immagine ${i+1} di ${total}`}
                tabIndex={i === current ? 0 : -1}
                onClick={() => setCurrent(i)}
              />
            ))}
          </div>
        </div>
      )}

      <div className="p-4 flex-1 overflow-y-auto">
        <h2 className="text-xl font-semibold mb-1 text-gray-900">{name}</h2>
        <p className="text-gray-600 text-sm mb-4 leading-relaxed">
          {onCategoryClick ? (
            <ClickableCategory onCategoryClick={onCategoryClick}>
              {description}
            </ClickableCategory>
          ) : (
            description
          )}
        </p>

        {/* Menu */}
        {menu && (
          <div className="my-4 border-t border-black/5 pt-4">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{translations.menu[currentLang]}</div>
            <div className="text-gray-700 text-sm bg-gray-50 p-3 rounded-xl border border-black/5">{menu}</div>
          </div>
        )}

        {/* Prezzi */}
        {prices && (
          <div className="my-4 border-t border-black/5 pt-4">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{translations.prices[currentLang]}</div>
            <div className="text-[#E3742E] font-semibold text-lg">{prices}</div>
          </div>
        )}

        {/* Audio guida */}
        {audio_guide_text && (
          <div className="my-4 border-t border-black/5 pt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {translations.audioGuide[currentLang]}
              </div>
              <button
                onClick={handlePlayAudioGuide}
                disabled={!isAudioEnabled || isAudioLoading}
                className={`flex items-center gap-2 px-4 py-2 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 ${isPlaying ? 'bg-[#E3742E]' : 'bg-[#0a3b3b]'}`}
                aria-label={isPlaying ? `${translations.pause[currentLang]} audio guida` : translations.listenMore[currentLang]}
              >
                {isAudioLoading ? (
                  <FiLoader className="w-4 h-4 animate-spin" />
                ) : isPlaying ? (
                  <FiPause className="w-4 h-4" />
                ) : (
                  <FiPlay className="w-4 h-4" />
                )}
                <span className="text-sm font-medium">
                  {isAudioLoading ? 'Caricamento...' : isPlaying ? translations.pause[currentLang] : translations.listen[currentLang]}
                </span>
              </button>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 border border-black/5">
              <p className="text-gray-600 text-sm leading-relaxed italic">
                {getDisplayedAudioText(audio_guide_text)}
              </p>
              {audio_guide_text && audio_guide_text.length > 150 && (
                <button
                  onClick={() => setShowFullAudioText(!showFullAudioText)}
                  className="mt-3 text-[#E3742E] hover:text-[#c45e1f] text-sm font-medium underline transition-colors"
                >
                  {showFullAudioText 
                    ? translations.showLess[currentLang] 
                    : translations.showMore[currentLang]
                  }
                </button>
              )}
            </div>
          </div>
        )}

        {/* Info contatto */}
        <div className="mt-4 pt-4 border-t border-black/5 space-y-3">
          {address && (
            <div className="flex items-start">
              <div className="w-5 h-5 text-gray-400 mr-3 mt-0.5">📍</div>
              <div className="flex-1">
                <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-tight">{translations.address[currentLang]}</div>
                <div className="text-sm text-gray-700">{address}</div>
                {google_maps_url && (
                  <a 
                    href={google_maps_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-[#0a3b3b] font-medium hover:underline mt-1 inline-block"
                  >
                    {translations.map[currentLang]}
                  </a>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {phone_number && (
              <div className="flex items-start">
                <div className="w-5 h-5 text-gray-400 mr-2">📞</div>
                <div className="flex-1 overflow-hidden">
                  <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-tight">{translations.phone[currentLang]}</div>
                  <a href={`tel:${phone_number}`} className="text-xs text-gray-700 hover:text-[#0a3b3b] block truncate">{phone_number}</a>
                </div>
              </div>
            )}

            {email && (
              <div className="flex items-start">
                <div className="w-5 h-5 text-gray-400 mr-2">✉️</div>
                <div className="flex-1 overflow-hidden">
                  <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-tight">{translations.email[currentLang]}</div>
                  <a href={`mailto:${email}`} className="text-xs text-gray-700 hover:text-[#0a3b3b] block truncate">{email}</a>
                </div>
              </div>
            )}
          </div>

          {website && (
            <div className="flex items-start pt-1">
              <div className="w-5 h-5 text-gray-400 mr-3">🌐</div>
              <div className="flex-1">
                <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-tight">{translations.website[currentLang]}</div>
                <a 
                  href={website.startsWith('http') ? website : `https://${website}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-[#0a3b3b] font-medium hover:underline truncate block"
                >
                  {website.replace(/^https?:\/\//, '')}
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
