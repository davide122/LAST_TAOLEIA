'use client';

import { useState } from 'react';
import AudioPlayer from './AudioPlayer';

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
  images = []   // array di {url, alt, main}
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
                onKeyDown={(e) => e.key === 'Enter' && setCurrent(i)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Contenuto scrollabile */}
      <div className="px-6 py-4 overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-900 mb-2" id="activity-title">{name}</h3>
         {audio_guide_text && (
          <div className="my-4 border-t pt-4">
            <div className="font-medium mb-2 text-gray-800" id="audio-guide-label">{translations.audioGuide[currentLang]}</div>
            <AudioPlayer text={audio_guide_text} language={currentLang} aria-labelledby="audio-guide-label" />
          </div>
        )}
        <p className="text-gray-700 mb-4">{description}</p>

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
              <a href={website} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline" aria-label={`${translations.website[currentLang]}: ${website}`}>
                {website}
              </a>
            </div>
          )}
          {google_maps_url && (
            <div role="listitem">
              <span className="font-medium">{translations.map[currentLang]}:</span>{' '}
              <a href={google_maps_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline" aria-label={translations.map[currentLang]}>
                {translations.map[currentLang]}
              </a>
            </div>
          )}
        </div>

        {menu && (
          <div className="mb-4 text-gray-600 text-sm">
            <div className="font-medium mb-1" id="menu-label">{translations.menu[currentLang]}:</div>
            <pre className="whitespace-pre-wrap bg-gray-50 p-2 rounded" aria-labelledby="menu-label">{menu}</pre>
          </div>
        )}

        {prices && (
          <div className="text-gray-600 text-sm mb-4">
            <div className="font-medium mb-1" id="prices-label">{translations.prices[currentLang]}:</div>
            <pre className="whitespace-pre-wrap bg-gray-50 p-2 rounded" aria-labelledby="prices-label">{prices}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
