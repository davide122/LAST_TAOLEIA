'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FiArrowLeft } from 'react-icons/fi';
import CategoryTranslations from '../../components/CategoryTranslations';
import TranslateCategoriesButton from '../../components/TranslateCategoriesButton';

export default function TranslationsPage() {
  const [selectedLanguage, setSelectedLanguage] = useState('it');
  
  // Lingue disponibili per la traduzione
  const availableLanguages = [
    { code: 'it', name: 'Italiano' },
    { code: 'en', name: 'Inglese' },
    { code: 'fr', name: 'Francese' },
    { code: 'es', name: 'Spagnolo' },
    { code: 'de', name: 'Tedesco' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#082c33] to-[#1E4E68] text-[#FEF5E7]">
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <Link 
                href="/backoffice" 
                className="flex items-center gap-2 text-[#FEF5E7]/80 hover:text-[#FEF5E7] transition-colors"
              >
                <FiArrowLeft className="w-5 h-5" />
                <span>Indietro</span>
              </Link>
              <h1 className="text-3xl font-bold mt-2">Gestione Traduzioni</h1>
            </div>
            <div>
              <TranslateCategoriesButton />
            </div>
          </div>

          {/* Selezione lingua */}
          <div className="bg-[#FEF5E7]/5 backdrop-blur-sm rounded-xl border border-[#FEF5E7]/10 p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Seleziona Lingua</h2>
            <div className="flex gap-2">
              {availableLanguages.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => setSelectedLanguage(lang.code)}
                  className={`px-4 py-2 rounded-lg transition-colors ${lang.code === selectedLanguage ? 'bg-[#FEF5E7] text-[#1E4E68]' : 'bg-[#FEF5E7]/10 hover:bg-[#FEF5E7]/20 text-[#FEF5E7]'}`}
                >
                  {lang.name}
                </button>
              ))}
            </div>
          </div>

          {/* Visualizzazione traduzioni */}
          <CategoryTranslations language={selectedLanguage} />
        </div>
      </div>
    </div>
  );
}