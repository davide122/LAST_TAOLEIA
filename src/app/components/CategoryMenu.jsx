import React, { useState } from 'react';
import {
  MapPinIcon,
  SparklesIcon,
  CameraIcon,
  GlobeAltIcon,
  ShoppingBagIcon,
  BuildingLibraryIcon,
  FireIcon,
  StarIcon,
  BookOpenIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const CategoryMenu = ({ isVisible, onClose, onCategorySelect, currentLanguage = 'it' }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);

  const categories = {
    it: [
      {
        id: 'siti-storici',
        name: 'Siti Storici',
        icon: BuildingLibraryIcon,
        description: 'Scopri i monumenti e i luoghi storici di Taormina',
        suggestions: [
          'Raccontami del Teatro Greco di Taormina',
          'Qual è la storia del Palazzo Corvaja?',
          'Dimmi di più sulla Cattedrale di Taormina',
          'Come visitare Villa Romana del Casale?'
        ]
      },
      {
        id: 'gustare',
        name: 'Gustare',
        icon: SparklesIcon,
        description: 'Esplora la gastronomia locale e i sapori siciliani',
        suggestions: [
          'Quali sono i piatti tipici di Taormina?',
          'Dove posso mangiare la migliore granita?',
          'Consigli per ristoranti con vista mare',
          'Quali vini siciliani devo assaggiare?'
        ]
      },
      {
        id: 'experience',
        name: 'Experience',
        icon: CameraIcon,
        description: 'Vivi esperienze uniche e indimenticabili',
        suggestions: [
          'Quali attività posso fare a Taormina?',
          'Come organizzare un tramonto perfetto?',
          'Esperienze romantiche per coppie',
          'Attività per famiglie con bambini'
        ]
      },
      {
        id: 'tour',
        name: 'Tour',
        icon: GlobeAltIcon,
        description: 'Scopri i migliori itinerari e percorsi guidati',
        suggestions: [
          'Tour guidato del centro storico',
          'Escursioni nei dintorni di Taormina',
          'Tour in barca lungo la costa',
          'Itinerario di un giorno perfetto'
        ]
      },
      {
        id: 'shopping',
        name: 'Shopping',
        icon: ShoppingBagIcon,
        description: 'Trova i migliori negozi e prodotti locali',
        suggestions: [
          'Dove comprare ceramiche siciliane?',
          'Migliori negozi del Corso Umberto',
          'Prodotti tipici da portare a casa',
          'Mercati locali e artigianato'
        ]
      },
      {
        id: 'musei-mostre',
        name: 'Musei e Mostre',
        icon: BuildingLibraryIcon,
        description: 'Visita musei e scopri l\'arte locale',
        suggestions: [
          'Quali musei visitare a Taormina?',
          'Mostre ed eventi culturali attuali',
          'Palazzo dei Duchi di Santo Stefano',
          'Arte contemporanea in Sicilia'
        ]
      },
      {
        id: 'etna',
        name: 'Etna',
        icon: FireIcon,
        description: 'Esplora il vulcano più famoso d\'Europa',
        suggestions: [
          'Come visitare l\'Etna da Taormina?',
          'Tour dell\'Etna: cosa vedere?',
          'Escursioni sui crateri dell\'Etna',
          'Storia e leggende del vulcano'
        ]
      },
      {
        id: 'top-5',
        name: 'Top 5',
        icon: StarIcon,
        description: 'Le 5 cose imperdibili di Taormina',
        suggestions: [
          'Top 5 luoghi da visitare assolutamente',
          'I 5 ristoranti migliori di Taormina',
          'Le 5 spiagge più belle nei dintorni',
          'Top 5 esperienze uniche da vivere'
        ]
      },
      {
        id: 'miti-leggende',
        name: 'Miti e Leggende',
        icon: BookOpenIcon,
        description: 'Scopri le storie e i misteri di Taormina',
        suggestions: [
          'Leggende del Teatro Greco',
          'Miti siciliani e storie antiche',
          'Personaggi famosi che hanno visitato Taormina',
          'Storie misteriose della città'
        ]
      }
    ],
    en: [
      {
        id: 'historical-sites',
        name: 'Historical Sites',
        icon: BuildingLibraryIcon,
        description: 'Discover Taormina\'s monuments and historical places',
        suggestions: [
          'Tell me about Taormina\'s Greek Theatre',
          'What\'s the history of Palazzo Corvaja?',
          'Tell me more about Taormina Cathedral',
          'How to visit Villa Romana del Casale?'
        ]
      },
      {
        id: 'taste',
        name: 'Taste',
        icon: SparklesIcon,
        description: 'Explore local gastronomy and Sicilian flavors',
        suggestions: [
          'What are Taormina\'s typical dishes?',
          'Where can I eat the best granita?',
          'Restaurant recommendations with sea view',
          'Which Sicilian wines should I try?'
        ]
      },
      {
        id: 'experience',
        name: 'Experience',
        icon: CameraIcon,
        description: 'Live unique and unforgettable experiences',
        suggestions: [
          'What activities can I do in Taormina?',
          'How to organize a perfect sunset?',
          'Romantic experiences for couples',
          'Family activities with children'
        ]
      },
      {
        id: 'tours',
        name: 'Tours',
        icon: GlobeAltIcon,
        description: 'Discover the best itineraries and guided tours',
        suggestions: [
          'Guided tour of the historic center',
          'Excursions around Taormina',
          'Boat tour along the coast',
          'Perfect one-day itinerary'
        ]
      },
      {
        id: 'shopping',
        name: 'Shopping',
        icon: ShoppingBagIcon,
        description: 'Find the best shops and local products',
        suggestions: [
          'Where to buy Sicilian ceramics?',
          'Best shops on Corso Umberto',
          'Typical products to take home',
          'Local markets and crafts'
        ]
      },
      {
        id: 'museums-exhibitions',
        name: 'Museums & Exhibitions',
        icon: BuildingLibraryIcon,
        description: 'Visit museums and discover local art',
        suggestions: [
          'Which museums to visit in Taormina?',
          'Current exhibitions and cultural events',
          'Palazzo dei Duchi di Santo Stefano',
          'Contemporary art in Sicily'
        ]
      },
      {
        id: 'etna',
        name: 'Etna',
        icon: FireIcon,
        description: 'Explore Europe\'s most famous volcano',
        suggestions: [
          'How to visit Etna from Taormina?',
          'Etna tour: what to see?',
          'Excursions to Etna\'s craters',
          'History and legends of the volcano'
        ]
      },
      {
        id: 'top-5',
        name: 'Top 5',
        icon: StarIcon,
        description: 'The 5 must-see things in Taormina',
        suggestions: [
          'Top 5 places to visit absolutely',
          'The 5 best restaurants in Taormina',
          'The 5 most beautiful beaches nearby',
          'Top 5 unique experiences to live'
        ]
      },
      {
        id: 'myths-legends',
        name: 'Myths & Legends',
        icon: BookOpenIcon,
        description: 'Discover Taormina\'s stories and mysteries',
        suggestions: [
          'Legends of the Greek Theatre',
          'Sicilian myths and ancient stories',
          'Famous people who visited Taormina',
          'Mysterious stories of the city'
        ]
      }
    ],
    fr: [
      {
        id: 'sites-historiques',
        name: 'Sites Historiques',
        icon: BuildingLibraryIcon,
        description: 'Découvrez les monuments et les lieux historiques de Taormina',
        suggestions: [
          'Parlez-moi du Théâtre Grec de Taormina',
          'Quelle est l\'histoire du Palazzo Corvaja?',
          'Dites-moi plus sur la Cathédrale de Taormina',
          'Comment visiter la Villa Romana del Casale?'
        ]
      },
      {
        id: 'gouter',
        name: 'Goûter',
        icon: SparklesIcon,
        description: 'Explorez la gastronomie locale et les saveurs siciliennes',
        suggestions: [
          'Quels sont les plats typiques de Taormina?',
          'Où puis-je manger la meilleure granita?',
          'Recommandations de restaurants avec vue sur la mer',
          'Quels vins siciliens devrais-je essayer?'
        ]
      },
      {
        id: 'experience',
        name: 'Expérience',
        icon: CameraIcon,
        description: 'Vivez des expériences uniques et inoubliables',
        suggestions: [
          'Quelles activités puis-je faire à Taormina?',
          'Comment organiser un coucher de soleil parfait?',
          'Expériences romantiques pour couples',
          'Activités familiales avec enfants'
        ]
      },
      {
        id: 'visites',
        name: 'Visites',
        icon: GlobeAltIcon,
        description: 'Découvrez les meilleurs itinéraires et visites guidées',
        suggestions: [
          'Visite guidée du centre historique',
          'Excursions autour de Taormina',
          'Tour en bateau le long de la côte',
          'Itinéraire parfait d\'une journée'
        ]
      },
      {
        id: 'shopping',
        name: 'Shopping',
        icon: ShoppingBagIcon,
        description: 'Trouvez les meilleurs magasins et produits locaux',
        suggestions: [
          'Où acheter des céramiques siciliennes?',
          'Meilleurs magasins du Corso Umberto',
          'Produits typiques à ramener chez soi',
          'Marchés locaux et artisanat'
        ]
      },
      {
        id: 'musees-expositions',
        name: 'Musées & Expositions',
        icon: BuildingLibraryIcon,
        description: 'Visitez les musées et découvrez l\'art local',
        suggestions: [
          'Quels musées visiter à Taormina?',
          'Expositions actuelles et événements culturels',
          'Palazzo dei Duchi di Santo Stefano',
          'Art contemporain en Sicile'
        ]
      },
      {
        id: 'etna',
        name: 'Etna',
        icon: FireIcon,
        description: 'Explorez le volcan le plus célèbre d\'Europe',
        suggestions: [
          'Comment visiter l\'Etna depuis Taormina?',
          'Tour de l\'Etna: que voir?',
          'Excursions aux cratères de l\'Etna',
          'Histoire et légendes du volcan'
        ]
      },
      {
        id: 'top-5',
        name: 'Top 5',
        icon: StarIcon,
        description: 'Les 5 incontournables de Taormina',
        suggestions: [
          'Top 5 des lieux à visiter absolument',
          'Les 5 meilleurs restaurants de Taormina',
          'Les 5 plus belles plages à proximité',
          'Top 5 des expériences uniques à vivre'
        ]
      },
      {
        id: 'mythes-legendes',
        name: 'Mythes & Légendes',
        icon: BookOpenIcon,
        description: 'Découvrez les histoires et les mystères de Taormina',
        suggestions: [
          'Légendes du Théâtre Grec',
          'Mythes siciliens et histoires anciennes',
          'Personnages célèbres qui ont visité Taormina',
          'Histoires mystérieuses de la ville'
        ]
      }
    ],
    es: [
      {
        id: 'sitios-historicos',
        name: 'Sitios Históricos',
        icon: BuildingLibraryIcon,
        description: 'Descubre los monumentos y lugares históricos de Taormina',
        suggestions: [
          'Háblame del Teatro Griego de Taormina',
          '¿Cuál es la historia del Palazzo Corvaja?',
          'Cuéntame más sobre la Catedral de Taormina',
          '¿Cómo visitar la Villa Romana del Casale?'
        ]
      },
      {
        id: 'sabores',
        name: 'Sabores',
        icon: SparklesIcon,
        description: 'Explora la gastronomía local y los sabores sicilianos',
        suggestions: [
          '¿Cuáles son los platos típicos de Taormina?',
          '¿Dónde puedo comer la mejor granita?',
          'Recomendaciones de restaurantes con vista al mar',
          '¿Qué vinos sicilianos debo probar?'
        ]
      },
      {
        id: 'experiencia',
        name: 'Experiencia',
        icon: CameraIcon,
        description: 'Vive experiencias únicas e inolvidables',
        suggestions: [
          '¿Qué actividades puedo hacer en Taormina?',
          '¿Cómo organizar una puesta de sol perfecta?',
          'Experiencias románticas para parejas',
          'Actividades familiares con niños'
        ]
      },
      {
        id: 'tours',
        name: 'Tours',
        icon: GlobeAltIcon,
        description: 'Descubre los mejores itinerarios y visitas guiadas',
        suggestions: [
          'Visita guiada del centro histórico',
          'Excursiones alrededor de Taormina',
          'Tour en barco a lo largo de la costa',
          'Itinerario perfecto de un día'
        ]
      },
      {
        id: 'compras',
        name: 'Compras',
        icon: ShoppingBagIcon,
        description: 'Encuentra las mejores tiendas y productos locales',
        suggestions: [
          '¿Dónde comprar cerámica siciliana?',
          'Mejores tiendas del Corso Umberto',
          'Productos típicos para llevar a casa',
          'Mercados locales y artesanía'
        ]
      },
      {
        id: 'museos-exposiciones',
        name: 'Museos y Exposiciones',
        icon: BuildingLibraryIcon,
        description: 'Visita museos y descubre el arte local',
        suggestions: [
          '¿Qué museos visitar en Taormina?',
          'Exposiciones actuales y eventos culturales',
          'Palazzo dei Duchi di Santo Stefano',
          'Arte contemporáneo en Sicilia'
        ]
      },
      {
        id: 'etna',
        name: 'Etna',
        icon: FireIcon,
        description: 'Explora el volcán más famoso de Europa',
        suggestions: [
          '¿Cómo visitar el Etna desde Taormina?',
          'Tour del Etna: ¿qué ver?',
          'Excursiones a los cráteres del Etna',
          'Historia y leyendas del volcán'
        ]
      },
      {
        id: 'top-5',
        name: 'Top 5',
        icon: StarIcon,
        description: 'Las 5 cosas imprescindibles de Taormina',
        suggestions: [
          'Top 5 lugares que visitar absolutamente',
          'Los 5 mejores restaurantes de Taormina',
          'Las 5 playas más bonitas de los alrededores',
          'Top 5 experiencias únicas para vivir'
        ]
      },
      {
        id: 'mitos-leyendas',
        name: 'Mitos y Leyendas',
        icon: BookOpenIcon,
        description: 'Descubre las historias y misterios de Taormina',
        suggestions: [
          'Leyendas del Teatro Griego',
          'Mitos sicilianos e historias antiguas',
          'Personajes famosos que visitaron Taormina',
          'Historias misteriosas de la ciudad'
        ]
      }
    ],
    de: [
      {
        id: 'historische-staetten',
        name: 'Historische Stätten',
        icon: BuildingLibraryIcon,
        description: 'Entdecken Sie die Denkmäler und historischen Orte von Taormina',
        suggestions: [
          'Erzählen Sie mir vom Griechischen Theater in Taormina',
          'Was ist die Geschichte des Palazzo Corvaja?',
          'Erzählen Sie mir mehr über die Kathedrale von Taormina',
          'Wie kann ich die Villa Romana del Casale besuchen?'
        ]
      },
      {
        id: 'genuss',
        name: 'Genuss',
        icon: SparklesIcon,
        description: 'Entdecken Sie die lokale Gastronomie und sizilianische Aromen',
        suggestions: [
          'Was sind die typischen Gerichte von Taormina?',
          'Wo kann ich die beste Granita essen?',
          'Restaurantempfehlungen mit Meerblick',
          'Welche sizilianischen Weine sollte ich probieren?'
        ]
      },
      {
        id: 'erlebnis',
        name: 'Erlebnis',
        icon: CameraIcon,
        description: 'Erleben Sie einzigartige und unvergessliche Erfahrungen',
        suggestions: [
          'Welche Aktivitäten kann ich in Taormina unternehmen?',
          'Wie organisiere ich einen perfekten Sonnenuntergang?',
          'Romantische Erlebnisse für Paare',
          'Familienaktivitäten mit Kindern'
        ]
      },
      {
        id: 'touren',
        name: 'Touren',
        icon: GlobeAltIcon,
        description: 'Entdecken Sie die besten Routen und geführten Touren',
        suggestions: [
          'Geführte Tour durch die Altstadt',
          'Ausflüge rund um Taormina',
          'Bootstour entlang der Küste',
          'Perfekte Tagesroute'
        ]
      },
      {
        id: 'einkaufen',
        name: 'Einkaufen',
        icon: ShoppingBagIcon,
        description: 'Finden Sie die besten Geschäfte und lokalen Produkte',
        suggestions: [
          'Wo kann ich sizilianische Keramik kaufen?',
          'Beste Geschäfte am Corso Umberto',
          'Typische Produkte zum Mitnehmen',
          'Lokale Märkte und Handwerk'
        ]
      },
      {
        id: 'museen-ausstellungen',
        name: 'Museen & Ausstellungen',
        icon: BuildingLibraryIcon,
        description: 'Besuchen Sie Museen und entdecken Sie lokale Kunst',
        suggestions: [
          'Welche Museen sollte man in Taormina besuchen?',
          'Aktuelle Ausstellungen und kulturelle Veranstaltungen',
          'Palazzo dei Duchi di Santo Stefano',
          'Zeitgenössische Kunst in Sizilien'
        ]
      },
      {
        id: 'etna',
        name: 'Ätna',
        icon: FireIcon,
        description: 'Erkunden Sie den berühmtesten Vulkan Europas',
        suggestions: [
          'Wie besuche ich den Ätna von Taormina aus?',
          'Ätna-Tour: Was gibt es zu sehen?',
          'Ausflüge zu den Kratern des Ätna',
          'Geschichte und Legenden des Vulkans'
        ]
      },
      {
        id: 'top-5',
        name: 'Top 5',
        icon: StarIcon,
        description: 'Die 5 Must-Sees in Taormina',
        suggestions: [
          'Top 5 Orte, die man unbedingt besuchen sollte',
          'Die 5 besten Restaurants in Taormina',
          'Die 5 schönsten Strände in der Nähe',
          'Top 5 einzigartige Erlebnisse'
        ]
      },
      {
        id: 'mythen-legenden',
        name: 'Mythen & Legenden',
        icon: BookOpenIcon,
        description: 'Entdecken Sie die Geschichten und Geheimnisse von Taormina',
        suggestions: [
          'Legenden des Griechischen Theaters',
          'Sizilianische Mythen und alte Geschichten',
          'Berühmte Persönlichkeiten, die Taormina besucht haben',
          'Mysteriöse Geschichten der Stadt'
        ]
      }
    ]
  };

  const currentCategories = categories[currentLanguage] || categories.it;

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
  };

  const handleSuggestionClick = (suggestion) => {
    onCategorySelect(suggestion);
    onClose();
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[150] transition-all duration-500 ease-in-out">
      {/* Sfondo sfocato */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-md animate-fade-in"
        onClick={onClose}
      />

      {/* Pannello menu */}
      <div 
        className="absolute inset-x-0 bottom-0 max-h-[90vh] bg-white rounded-t-[3rem] shadow-2xl animate-fade-in-up flex flex-col"
      >
        {/* Handle per trascinamento (estetico) */}
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mt-4 mb-2" />
        
        {/* Intestazione */}
        <div className="px-6 py-4 flex justify-between items-center border-b border-black/5">
          <div className="flex items-center">
            {selectedCategory && (
              <button
                onClick={handleBackToCategories}
                className="mr-3 p-2 rounded-full bg-gray-100 text-[#0a3b3b] hover:bg-gray-200 transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <h2 className="text-2xl font-bold text-[#0a3b3b]">
              {selectedCategory 
                ? selectedCategory.name 
                : (currentLanguage === 'it' ? 'Esplora Taormina' : 
                   currentLanguage === 'en' ? 'Explore Taormina' :
                   currentLanguage === 'fr' ? 'Explorer Taormina' :
                   currentLanguage === 'es' ? 'Explora Taormina' :
                   'Taormina erkunden')
              }
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Contenuto scorrevole */}
        <div className="flex-1 overflow-y-auto p-6">
          {!selectedCategory ? (
            <div className="grid grid-cols-2 gap-4">
              {currentCategories.map((category) => {
                const IconComponent = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryClick(category)}
                    className="flex flex-col items-center p-6 bg-gray-50 rounded-3xl border border-black/5 hover:bg-white hover:shadow-xl hover:border-transparent transition-all duration-300 group"
                  >
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300 mb-4">
                      <IconComponent className="w-8 h-8 text-[#E3742E]" />
                    </div>
                    <span className="text-sm font-semibold text-[#0a3b3b] text-center">
                      {category.name}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="animate-fade-in-up">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-[#0a3b3b] rounded-2xl flex items-center justify-center shadow-lg mr-4">
                  {React.createElement(selectedCategory.icon, { className: "w-10 h-10 text-white" })}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-[#0a3b3b]">{selectedCategory.name}</h3>
                  <p className="text-gray-500 text-sm">{selectedCategory.description}</p>
                </div>
              </div>

              <div className="space-y-3 pb-8">
                {selectedCategory.suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left p-5 bg-gray-50 rounded-2xl border border-black/5 hover:bg-[#E3742E]/5 hover:border-[#E3742E]/30 transition-all duration-200 flex items-center group"
                  >
                    <div className="w-2 h-2 rounded-full bg-[#E3742E] mr-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="text-[#0a3b3b] font-medium">{suggestion}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryMenu;