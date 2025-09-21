"use client";

import { FiMapPin, FiClock, FiStar, FiTag, FiInfo, FiExternalLink } from 'react-icons/fi';

export default function CardDisplay({ card }) {
  if (!card || !card.metadata) {
    return (
      <div className="bg-[#FEF5E7]/5 backdrop-blur-sm rounded-xl border border-[#FEF5E7]/10 p-6">
        <div className="text-[#FEF5E7]/60 text-center">
          <FiInfo className="w-8 h-8 mx-auto mb-2" />
          <p>Scheda non disponibile</p>
        </div>
      </div>
    );
  }

  const { metadata } = card;
  const cardData = metadata.cardData || {};
  const toolType = metadata.toolType || 'unknown';

  // Determina il tipo di scheda e i dati da mostrare
  const getCardInfo = () => {
    if (toolType === 'activity' || cardData.name) {
      return {
        type: 'Attività',
        icon: <FiMapPin className="w-5 h-5" />,
        color: 'blue',
        title: cardData.name || 'Attività senza nome',
        subtitle: cardData.address || cardData.location || '',
        description: cardData.description || '',
        category: cardData.category || cardData.type || '',
        extra: cardData.recommendations || []
      };
    } else if (toolType === 'menu' || cardData.category) {
      return {
        type: 'Menu',
        icon: <FiTag className="w-5 h-5" />,
        color: 'green',
        title: cardData.category || 'Menu',
        subtitle: cardData.subcategory || '',
        description: cardData.description || '',
        category: cardData.type || 'menu',
        extra: cardData.recommendations || cardData.items || []
      };
    } else {
      return {
        type: 'Scheda Generica',
        icon: <FiInfo className="w-5 h-5" />,
        color: 'gray',
        title: cardData.title || cardData.name || 'Scheda',
        subtitle: cardData.subtitle || '',
        description: cardData.description || '',
        category: cardData.category || cardData.type || 'unknown',
        extra: []
      };
    }
  };

  const cardInfo = getCardInfo();

  const getColorClasses = (color) => {
    switch (color) {
      case 'blue':
        return {
          bg: 'bg-blue-500/10',
          border: 'border-blue-500/20',
          text: 'text-blue-200',
          badge: 'bg-blue-500/20 text-blue-200'
        };
      case 'green':
        return {
          bg: 'bg-green-500/10',
          border: 'border-green-500/20',
          text: 'text-green-200',
          badge: 'bg-green-500/20 text-green-200'
        };
      default:
        return {
          bg: 'bg-gray-500/10',
          border: 'border-gray-500/20',
          text: 'text-gray-200',
          badge: 'bg-gray-500/20 text-gray-200'
        };
    }
  };

  const colors = getColorClasses(cardInfo.color);

  return (
    <div className={`${colors.bg} backdrop-blur-sm rounded-xl border ${colors.border} p-4 sm:p-6`}>
      {/* Header della card */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 gap-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${colors.badge} flex-shrink-0`}>
            {cardInfo.icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h3 className="text-base sm:text-lg font-semibold text-[#FEF5E7] truncate">
                {cardInfo.title}
              </h3>
              <span className={`px-2 py-1 rounded-full text-xs ${colors.badge} self-start sm:self-auto`}>
                {cardInfo.type}
              </span>
            </div>
            {cardInfo.subtitle && (
              <p className="text-sm text-[#FEF5E7]/70 mt-1 break-words">
                {cardInfo.subtitle}
              </p>
            )}
          </div>
        </div>
        
        {/* Timestamp */}
        <div className="flex items-center gap-1 text-xs text-[#FEF5E7]/50 flex-shrink-0">
          <FiClock className="w-3 h-3" />
          <span className="hidden sm:inline">
            {new Date(card.timestamp).toLocaleString()}
          </span>
          <span className="sm:hidden">
            {new Date(card.timestamp).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Contenuto principale */}
      <div className="space-y-4">
        {/* Descrizione */}
        {cardInfo.description && (
          <div>
            <h4 className="text-sm font-medium text-[#FEF5E7]/80 mb-2">Descrizione</h4>
            <p className="text-[#FEF5E7]/70 text-sm leading-relaxed">
              {cardInfo.description}
            </p>
          </div>
        )}

        {/* Categoria */}
        {cardInfo.category && (
          <div>
            <h4 className="text-sm font-medium text-[#FEF5E7]/80 mb-2">Categoria</h4>
            <span className={`inline-block px-3 py-1 rounded-full text-xs ${colors.badge}`}>
              {cardInfo.category}
            </span>
          </div>
        )}

        {/* Raccomandazioni o elementi extra */}
        {cardInfo.extra && cardInfo.extra.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-[#FEF5E7]/80 mb-2">
              {toolType === 'activity' ? 'Raccomandazioni' : 'Elementi'}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {cardInfo.extra.slice(0, 6).map((item, index) => (
                <div key={index} className="flex items-start gap-2 p-2 bg-[#FEF5E7]/5 rounded-lg">
                  <FiStar className="w-3 h-3 text-[#FEF5E7]/50 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-[#FEF5E7]/70 break-words">
                    {typeof item === 'string' ? item : item.name || item.title || JSON.stringify(item)}
                  </span>
                </div>
              ))}
            </div>
            {cardInfo.extra.length > 6 && (
              <p className="text-xs text-[#FEF5E7]/50 italic mt-2">
                ... e altri {cardInfo.extra.length - 6} elementi
              </p>
            )}
          </div>
        )}

        {/* Contenuto raw se presente */}
        {card.content && card.content.trim() && (
          <div>
            <h4 className="text-sm font-medium text-[#FEF5E7]/80 mb-2">Contenuto</h4>
            <div className="bg-[#FEF5E7]/5 rounded-lg p-3 text-sm text-[#FEF5E7]/70 max-h-32 overflow-y-auto">
              {card.content}
            </div>
          </div>
        )}
      </div>

      {/* Footer con metadati tecnici (collassabile) */}
      <details className="mt-4 pt-4 border-t border-[#FEF5E7]/10">
        <summary className="text-xs text-[#FEF5E7]/50 cursor-pointer hover:text-[#FEF5E7]/70 transition-colors">
          Dettagli tecnici (ID: {card.id})
        </summary>
        <div className="mt-2 p-3 bg-[#FEF5E7]/5 rounded-lg">
          <pre className="text-xs text-[#FEF5E7]/60 overflow-x-auto">
            {JSON.stringify(metadata, null, 2)}
          </pre>
        </div>
      </details>
    </div>
  );
}