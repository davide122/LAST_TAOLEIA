'use client';

import { useState } from 'react';
import AudioPlayer from './AudioPlayer';
import ClickableCategory from './ClickableCategory';

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
  const [current, setCurrent] = useState(0);
  const total = images.length;

  const prev = () => setCurrent((current - 1 + total) % total);
  const next = () => setCurrent((current + 1) % total);

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
    }
  };

  // Usa la lingua corrente o fallback a italiano
  const currentLang = language_code && translations.address[language_code] ? language_code : 'it';

  return (
    <div 
      className="max-w-md w-full bg-white border border-gray-200 rounded-lg shadow-md flex flex-col max-h-[100vh]"
      role="article"
      aria-label={name}
    >
      
      {/* Carousel immagini */}
      {total > 0 && (
        <div 
          className="relative overflow-hidden h-[250px]" /* Altezza fissa per tutte le immagini */
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
        <h2 className="text-xl font-bold mb-2 text-gray-900">{name}</h2>
        <p className="text-gray-700 mb-4">
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
          <div className="my-4 border-t pt-4">
            <div className="font-medium mb-2 text-gray-800">{translations.menu[currentLang]}</div>
            <div className="text-gray-700">{menu}</div>
          </div>
        )}

        {/* Prezzi */}
        {prices && (
          <div className="my-4 border-t pt-4">
            <div className="font-medium mb-2 text-gray-800">{translations.prices[currentLang]}</div>
            <div className="text-gray-700">{prices}</div>
          </div>
        )}

        {/* Audio guida */}
        {audio_guide_text && (
          <div className="my-4 border-t pt-4">
            <div className="font-medium mb-2 text-gray-800" id="audio-guide-label">{translations.audioGuide[currentLang]}</div>
            <AudioPlayer text={audio_guide_text} language={currentLang} aria-labelledby="audio-guide-label" />
          </div>
        )}
        <p className="text-gray-700 mb-4">{audio_guide_text?.slice(0,100)+"... "+translations.listenMore[currentLang]}</p>

        <div className="text-gray-800 mb-4 space-y-1 text-sm" role="list" aria-label="Informazioni di contatto">
          <div role="listitem"><span className="font-medium">{translations.address[currentLang]}:</span> {address}</div>
          {phone_number && (
            <div role="listitem">
              <span className="font-medium">{translations.phone[currentLang]}:</span>{' '}
              <a href={`tel:${phone_number}`} className="text-blue-600 hover:underline" aria-label={`${translations.phone[currentLang]}: ${phone_number}`}>
                {phone_number}
              </a>
            </div>
          )}
          {email && (
            <div role="listitem">
              <span className="font-medium">{translations.email[currentLang]}:</span>{' '}
              <a href={`mailto:${email}`} className="text-blue-600 hover:underline" aria-label={`${translations.email[currentLang]}: ${email}`}>
                {email}
              </a>
            </div>
          )}
          {website && (
            <div role="listitem">
              <span className="font-medium">{translations.website[currentLang]}:</span>{' '}
              <a 
                href={website.startsWith('http') ? website : `https://${website}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-600 hover:underline"
                aria-label={`${translations.website[currentLang]}: ${website}`}
              >
                {website}
              </a>
            </div>
          )}
        </div>

        {/* Link a Google Maps */}
        {google_maps_url && (
          <a 
            href={google_maps_url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="inline-flex items-center text-blue-600 hover:underline"
            aria-label={translations.map[currentLang]}
          >
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            {translations.map[currentLang]}
          </a>
        )}
      </div>
    </div>
  );
}
