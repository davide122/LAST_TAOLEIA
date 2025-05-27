'use client';
import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

// Componente per il controllo dello zoom
const ZoomControl = () => {
  const map = useMap();
  return (
    <div className="absolute bottom-4 right-4 z-[1000] flex flex-col gap-2">
      <button
        onClick={() => map.zoomIn()}
        className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
      >
        <span className="text-xl">+</span>
      </button>
      <button
        onClick={() => map.zoomOut()}
        className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
      >
        <span className="text-xl">-</span>
      </button>
    </div>
  );
};

// Componente per i controlli della mappa
const MapControls = ({ 
  categories, 
  selectedCategory, 
  onCategoryChange,
  onSearch,
  onCreateRoute,
  isCreatingRoute,
  routePoints,
  onClearRoute,
  onSaveRoute
}) => {
  return (
    <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-4">
      {/* Search Bar */}
      <div className="w-64">
        <input
          type="text"
          placeholder="Cerca luoghi..."
          onChange={(e) => onSearch(e.target.value)}
          className="w-full px-3 py-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border-0 focus:ring-2 focus:ring-orange-500 focus:outline-none"
        />
      </div>

      {/* Categories */}
      <div className="bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg">
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                selectedCategory === category.id
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Route Creation */}
      <div className="bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg">
        <button
          onClick={onCreateRoute}
          className={`w-full px-3 py-2 rounded-lg text-sm transition-all ${
            isCreatingRoute
              ? 'bg-red-500 text-white'
              : 'bg-orange-500 text-white hover:bg-orange-600'
          }`}
        >
          {isCreatingRoute ? 'Annulla Creazione' : 'Crea Nuovo Percorso'}
        </button>

        {isCreatingRoute && (
          <div className="mt-2 space-y-2">
            <p className="text-xs text-gray-600">
              Clicca sulla mappa per aggiungere punti al percorso
            </p>
            {routePoints.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-gray-600">
                  Punti nel percorso: {routePoints.length}
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={onClearRoute}
                    className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300"
                  >
                    Cancella
                  </button>
                  <button
                    onClick={onSaveRoute}
                    className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600"
                  >
                    Salva
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const Map = () => {
  const [isClient, setIsClient] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPOI, setSelectedPOI] = useState(null);
  const [isCreatingRoute, setIsCreatingRoute] = useState(false);
  const [routePoints, setRoutePoints] = useState([]);
  const [savedRoutes, setSavedRoutes] = useState([]);

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
      openingHours: '9:00 - 19:00',
      image: '/images/teatro-antico.jpg'
    },
    {
      id: 2,
      name: 'Corso Umberto',
      description: 'La via principale di Taormina, ricca di negozi e ristoranti',
      position: [37.8516, 15.2833],
      category: 'shopping',
      price: 'Gratuito',
      openingHours: 'Sempre aperto',
      image: '/images/corso-umberto.jpg'
    },
    {
      id: 3,
      name: 'Isola Bella',
      description: 'Splendida isola collegata alla terraferma da una sottile striscia di sabbia',
      position: [37.8512, 15.2998],
      category: 'beaches',
      price: '€4',
      openingHours: '9:00 - 19:00',
      image: '/images/isola-bella.jpg'
    },
    {
      id: 4,
      name: 'Piazza IX Aprile',
      description: 'Piazza panoramica con vista sul mare e sull\'Etna',
      position: [37.8517, 15.2839],
      category: 'monuments',
      price: 'Gratuito',
      openingHours: 'Sempre aperto',
      image: '/images/piazza-ix-aprile.jpg'
    },
    {
      id: 5,
      name: 'Ristorante Al Duomo',
      description: 'Ristorante tradizionale siciliano con terrazza panoramica',
      position: [37.8518, 15.2836],
      category: 'restaurants',
      price: '€€€',
      openingHours: '12:00 - 23:00',
      image: '/images/al-duomo.jpg'
    }
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

  // Gestione della creazione del percorso
  const handleMapClick = (e) => {
    if (isCreatingRoute) {
      setRoutePoints([...routePoints, [e.latlng.lat, e.latlng.lng]]);
    }
  };

  const handleCreateRoute = () => {
    setIsCreatingRoute(!isCreatingRoute);
    if (!isCreatingRoute) {
      setRoutePoints([]);
    }
  };

  const handleClearRoute = () => {
    setRoutePoints([]);
  };

  const handleSaveRoute = () => {
    if (routePoints.length > 1) {
      const newRoute = {
        id: Date.now(),
        points: routePoints,
        name: `Percorso ${savedRoutes.length + 1}`,
        createdAt: new Date().toISOString()
      };
      setSavedRoutes([...savedRoutes, newRoute]);
      setRoutePoints([]);
      setIsCreatingRoute(false);
    }
  };

  if (!isClient) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <MapControls
        categories={CATEGORIES}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        onSearch={setSearchQuery}
        onCreateRoute={handleCreateRoute}
        isCreatingRoute={isCreatingRoute}
        routePoints={routePoints}
        onClearRoute={handleClearRoute}
        onSaveRoute={handleSaveRoute}
      />

      <MapContainer
        center={TAORMINA_CENTER}
        zoom={15}
        style={{ height: '100%', width: '100%' }}
        className="rounded-2xl"
        onClick={handleMapClick}
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

        {/* Percorsi salvati */}
        {savedRoutes.map(route => (
          <Polyline
            key={route.id}
            positions={route.points}
            pathOptions={{ color: 'blue', weight: 3, dashArray: '5, 10' }}
          />
        ))}

        {/* Percorso in creazione */}
        {routePoints.length > 0 && (
          <Polyline
            positions={routePoints}
            pathOptions={{ color: 'red', weight: 3 }}
          />
        )}

        {/* Markers dei punti di interesse */}
        {filteredPOIs.map((poi) => (
          <Marker
            key={poi.id}
            position={poi.position}
            icon={customIcon}
            eventHandlers={{
              click: () => setSelectedPOI(poi)
            }}
          >
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

        <ZoomControl />
      </MapContainer>

      {/* Dettaglio POI selezionato */}
      {selectedPOI && (
        <div className="absolute bottom-4 left-4 right-4 z-[1000] bg-white/90 backdrop-blur-sm p-4 rounded-2xl shadow-lg transform transition-all duration-300 ease-in-out">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold text-gray-800">{selectedPOI.name}</h3>
              <p className="text-gray-600 mt-1">{selectedPOI.description}</p>
            </div>
            <button
              onClick={() => setSelectedPOI(null)}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              ✕
            </button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-semibold text-gray-700">Categoria:</span>
              <p className="text-gray-600">{CATEGORIES.find(c => c.id === selectedPOI.category)?.name}</p>
            </div>
            <div>
              <span className="font-semibold text-gray-700">Prezzo:</span>
              <p className="text-gray-600">{selectedPOI.price}</p>
            </div>
            <div className="col-span-2">
              <span className="font-semibold text-gray-700">Orari:</span>
              <p className="text-gray-600">{selectedPOI.openingHours}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Map;