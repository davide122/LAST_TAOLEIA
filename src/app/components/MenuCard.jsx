'use client';

import { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

export default function MenuCard({ category, recommendations, timestamp, type }) {
  const [expanded, setExpanded] = useState(true);

  // Se non ci sono dati validi, non mostrare nulla
  if (!category || !recommendations || !Array.isArray(recommendations)) {
    return null;
  }

  return (
    <div className="w-full max-w-md bg-white rounded-xl shadow-md overflow-hidden mb-4">
      {/* Intestazione con categoria e pulsante di espansione */}
      <div 
        className="px-4 py-3 bg-blue-600 text-white flex justify-between items-center cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <h3 className="text-lg font-semibold">{category}</h3>
        <button className="text-white">
          {expanded ? (
            <ChevronUpIcon className="h-5 w-5" />
          ) : (
            <ChevronDownIcon className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Contenuto espandibile */}
      {expanded && (
        <div className="p-4">
          <h4 className="text-md font-medium mb-2">Raccomandazioni:</h4>
          <ul className="list-disc pl-5 space-y-1">
            {recommendations.map((recommendation, index) => (
              <li key={index} className="text-gray-700">{recommendation}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}