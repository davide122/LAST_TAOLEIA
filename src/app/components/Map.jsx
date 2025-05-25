'use client';
import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline } from 'react-leaflet';
import L from 'leaflet';

const Map = () => {
  const [isClient, setIsClient] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestedRoute, setShowSuggestedRoute] = useState(false);

  // Coordinate di Taormina
  const TAORMINA_CENTER = [37.8516, 15.2853];

  // Categorie dei punti di interesse
  const CATEGORIES = [
    { id: 'all', name: 'Tutti' },
    { id: 'monuments', name: 'Monumenti' },
    { id: 'shopping', name: 'Shopping' },
    { id: 'beaches', name: 'Spiagge' },
    { id: 'restaurants', name: 'Ristoranti' }
  ];

  // Punti di interesse di That's Taormina
  const POINTS_OF_INTEREST = [
    {
      id: 1,
      name: 'Teatro Antico',
      description: 'Antico teatro greco-romano con vista mozzafiato sul mare e sull\'Etna',
      position: [37.8525, 15.2893],
      category: 'monuments',
      price: '€12',
      openingHours: '9:00 - 19:00'
    },
    {
      id: 2,
      name: 'Corso Umberto',
      description: 'La via principale di Taormina, ricca di negozi e ristoranti',
      position: [37.8516, 15.2833],
      category: 'shopping',
      price: 'Gratuito',
      openingHours: 'Sempre aperto'
    },
    {
      id: 3,
      name: 'Isola Bella',
      description: 'Splendida isola collegata alla terraferma da una sottile striscia di sabbia',
      position: [37.8512, 15.2998],
      category: 'beaches',
      price: '€4',
      openingHours: '9:00 - 19:00'
    },
    {
      id: 4,
      name: 'Piazza IX Aprile',
      description: 'Piazza panoramica con vista sul mare e sull\'Etna',
      position: [37.8517, 15.2839],
      category: 'monuments',
      price: 'Gratuito',
      openingHours: 'Sempre aperto'
    },
    {
      id: 5,
      name: 'Ristorante Al Duomo',
      description: 'Ristorante tradizionale siciliano con terrazza panoramica',
      position: [37.8518, 15.2836],
      category: 'restaurants',
      price: '€€€',
      openingHours: '12:00 - 23:00'
    }
  ];

  // Percorso turistico suggerito
  const SUGGESTED_ROUTE = [
    POINTS_OF_INTEREST[1].position, // Corso Umberto
    POINTS_OF_INTEREST[3].position, // Piazza IX Aprile
    POINTS_OF_INTEREST[0].position, // Teatro Antico
    POINTS_OF_INTEREST[4].position, // Ristorante
    POINTS_OF_INTEREST[2].position  // Isola Bella
  ];

  // Stile personalizzato per i marker
  const customIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Filtra i punti di interesse in base alla categoria e alla ricerca
  const filteredPOIs = POINTS_OF_INTEREST.filter(poi => {
    const matchesCategory = selectedCategory === 'all' || poi.category === selectedCategory;
    const matchesSearch = poi.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         poi.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (!isClient) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        Caricamento mappa...
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {/* Filtri e ricerca */}
      <div className="absolute top-4 left-4 z-[1000] bg-white p-4 rounded-lg shadow-lg">
        
        <button
          className={`mt-2 w-full p-2 rounded ${showSuggestedRoute ? 'bg-orange-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setShowSuggestedRoute(!showSuggestedRoute)}
        >
          {showSuggestedRoute ? 'Nascondi percorso' : 'Mostra percorso consigliato'}
        </button>
      </div>

      <MapContainer
        center={TAORMINA_CENTER}
        zoom={15}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {/* Area di Taormina */}
        <Circle
          center={TAORMINA_CENTER}
          radius={1000}
          pathOptions={{ color: 'orange', fillColor: 'orange', fillOpacity: 0.1 }}
        />

        {/* Percorso suggerito */}
        {showSuggestedRoute && (
          <Polyline
            positions={SUGGESTED_ROUTE}
            pathOptions={{ color: 'orange', weight: 3, dashArray: '5, 10' }}
          />
        )}

        {/* Markers dei punti di interesse */}
        {filteredPOIs.map((poi) => (
          <Marker key={poi.id} position={poi.position} icon={customIcon}>
            <Popup>
              <div className="text-sm">
                <h3 className="font-bold text-lg mb-1">{poi.name}</h3>
                <p className="mb-2">{poi.description}</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="font-semibold">Categoria:</span><br/>
                    {CATEGORIES.find(c => c.id === poi.category)?.name}
                  </div>
                  <div>
                    <span className="font-semibold">Prezzo:</span><br/>
                    {poi.price}
                  </div>
                  <div className="col-span-2">
                    <span className="font-semibold">Orari:</span><br/>
                    {poi.openingHours}
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default Map;