"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiSave, FiPlus, FiCalendar, FiClock, FiTrash2, FiMove, FiLoader, FiAlertCircle, FiInfo, FiSearch, FiFilter } from 'react-icons/fi';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Componente per un singolo giorno dell'itinerario
const ItineraryDay = ({ day, activities, onAddActivity, onRemoveActivity, onMoveActivity, setActivities }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'activity',
    drop: (item) => {
      if (item.dayIndex !== day.index) {
        onMoveActivity(item.index, item.dayIndex, day.index);
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  return (
    <div 
      ref={drop}
      className={`bg-[#FEF5E7]/5 backdrop-blur-sm rounded-xl p-6 mb-6 border-2 ${isOver ? 'border-[#FEF5E7]/30' : 'border-[#FEF5E7]/10'} transition-all`}
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-[#FEF5E7]">
          Giorno {day.index + 1}
        </h3>
        <button
          onClick={() => onAddActivity(day.index)}
          className="p-2 bg-[#FEF5E7] text-[#1E4E68] rounded-xl hover:bg-[#FEF5E7]/90 transition-all flex items-center gap-2"
        >
          <FiPlus className="w-5 h-5" />
          <span className="text-sm">Aggiungi</span>
        </button>
      </div>

      {/* Lista attività del giorno */}
      <div className="space-y-4">
        {activities
          .filter(activity => activity.dayIndex === day.index)
          .map((activity, index) => (
            <DraggableActivity 
              key={activity.id || index}
              activity={activity}
              index={index}
              dayIndex={day.index}
              onRemove={onRemoveActivity}
              activities={activities}
              setActivities={setActivities}
            />
          ))}

        {activities.filter(a => a.dayIndex === day.index).length === 0 && (
          <div className="text-center py-8 text-[#FEF5E7]/50 italic bg-[#FEF5E7]/5 backdrop-blur-sm rounded-xl border border-[#FEF5E7]/10">
            <FiPlus className="w-8 h-8 mx-auto mb-2 text-[#FEF5E7]/30" />
            <p>Nessuna attività</p>
            <p className="text-sm mt-1">Aggiungi un'attività o trascina qui un'attività esistente</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Componente per un'attività trascinabile
const DraggableActivity = ({ activity, index, dayIndex, onRemove, activities, setActivities }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'activity',
    item: { index, dayIndex },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const [isEditing, setIsEditing] = useState(false);
  const [timeValues, setTimeValues] = useState({
    startTime: activity.startTime || '09:00',
    endTime: activity.endTime || '10:00',
    title: activity.title,
    description: activity.description || ''
  });

  // Aggiorna l'attività quando si salvano i cambiamenti
  const handleTimeChange = (e) => {
    const { name, value } = e.target;
    setTimeValues(prev => ({ ...prev, [name]: value }));
  };

  const saveTimeChanges = () => {
    // Trova l'indice dell'attività nell'array activities
    const activityIndex = activities.findIndex(
      (a) => (a.id === activity.id || a === activity) && a.dayIndex === dayIndex
    );

    if (activityIndex !== -1) {
      // Crea una copia dell'array activities
      const updatedActivities = [...activities];
      // Aggiorna l'attività con i nuovi valori
      updatedActivities[activityIndex] = {
        ...updatedActivities[activityIndex],
        startTime: timeValues.startTime,
        endTime: timeValues.endTime,
        title: timeValues.title,
        description: timeValues.description
      };
      // Aggiorna lo stato delle attività
      setActivities(updatedActivities);
    } else {
      // Aggiorna direttamente l'oggetto attività se non è stato trovato nell'array
      activity.startTime = timeValues.startTime;
      activity.endTime = timeValues.endTime;
      activity.title = timeValues.title;
      activity.description = timeValues.description;
    }
    
    setIsEditing(false);
  };

  return (
    <div 
      ref={drag}
      className={`bg-[#FEF5E7] rounded-xl p-4 cursor-move ${isDragging ? 'opacity-50' : 'opacity-100'} hover:shadow-lg transition-all`}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      {isEditing ? (
        <div className="p-2">
          <div className="mb-3">
            <label className="block text-sm font-medium text-[#1E4E68]/80 mb-1">
              Titolo
            </label>
            <input
              type="text"
              name="title"
              value={timeValues.title}
              onChange={handleTimeChange}
              className="w-full px-3 py-2 bg-[#1E4E68]/10 text-[#1E4E68] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1E4E68]"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-sm font-medium text-[#1E4E68]/80 mb-1">
                Inizio
              </label>
              <input
                type="time"
                name="startTime"
                value={timeValues.startTime}
                onChange={handleTimeChange}
                className="w-full px-3 py-2 bg-[#1E4E68]/10 text-[#1E4E68] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1E4E68]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1E4E68]/80 mb-1">
                Fine
              </label>
              <input
                type="time"
                name="endTime"
                value={timeValues.endTime}
                onChange={handleTimeChange}
                className="w-full px-3 py-2 bg-[#1E4E68]/10 text-[#1E4E68] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1E4E68]"
              />
            </div>
          </div>
          
          <div className="mb-3">
            <label className="block text-sm font-medium text-[#1E4E68]/80 mb-1">
              Descrizione
            </label>
            <textarea
              name="description"
              value={timeValues.description}
              onChange={handleTimeChange}
              rows="2"
              className="w-full px-3 py-2 bg-[#1E4E68]/10 text-[#1E4E68] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1E4E68]"
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setIsEditing(false)}
              className="px-3 py-1.5 bg-[#1E4E68]/20 text-[#1E4E68] rounded-lg hover:bg-[#1E4E68]/30 transition text-sm"
            >
              Annulla
            </button>
            <button
              onClick={saveTimeChanges}
              className="px-3 py-1.5 bg-[#1E4E68] text-[#FEF5E7] rounded-lg hover:bg-[#1E4E68]/90 transition text-sm flex items-center"
            >
              <FiSave className="mr-1 w-4 h-4" /> Salva
            </button>
          </div>
        </div>
      ) : (
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-[#1E4E68]/10 rounded-lg">
              <FiMove className="w-5 h-5 text-[#1E4E68]/60" />
            </div>
            <div>
              <h4 className="font-medium text-[#1E4E68]">{activity.title}</h4>
              <div 
                className="flex items-center text-[#1E4E68]/70 text-sm mt-1 cursor-pointer hover:text-[#1E4E68] transition-all"
                onClick={() => setIsEditing(true)}
                title="Modifica orari"
              >
                <FiClock className="w-4 h-4 mr-1" />
                <span>{activity.startTime} - {activity.endTime}</span>
              </div>
              {activity.description && (
                <p className="text-sm text-[#1E4E68]/60 mt-2 line-clamp-2">
                  {activity.description}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => onRemove(activity.id || index, dayIndex)}
            className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
            title="Elimina attività"
          >
            <FiTrash2 className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

// Componente per il selettore di attività
const ActivitySelector = ({ activities, onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [availableActivities, setAvailableActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  useEffect(() => {
    // Carica le attività disponibili dal database
    const fetchActivities = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/activities/list');
        
        if (!res.ok) {
          throw new Error('Errore nel caricamento delle attività');
        }
        
        const data = await res.json();
        
        if (data.success && data.activities) {
          // Trasforma i dati nel formato richiesto dal componente
          const formattedActivities = data.activities.map(activity => ({
            id: activity.id,
            title: activity.name,
            duration: 60, // Durata predefinita in minuti (puoi modificare se hai questo dato)
            description: activity.description,
            category: activity.category,
            image: activity.main_image
          }));
          
          setAvailableActivities(formattedActivities);
        } else {
          throw new Error('Formato dati non valido');
        }
      } catch (err) {
        console.error('Errore nel caricamento delle attività:', err);
        setError('Impossibile caricare le attività');
      } finally {
        setLoading(false);
      }
    };
    
    fetchActivities();
  }, []);

  const filteredActivities = availableActivities.filter(activity => {
    const matchesSearch = activity.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || activity.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Estrai le categorie uniche
  const categories = ['all', ...new Set(availableActivities.map(a => a.category).filter(Boolean))];

  return (
    <div className="bg-[#FEF5E7]/5 backdrop-blur-sm rounded-xl p-6 mb-6 border border-[#FEF5E7]/10">
      <h3 className="text-xl font-semibold text-[#FEF5E7] mb-6">Attività Disponibili</h3>
      
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="text-[#FEF5E7]/60" />
          </div>
          <input
            type="text"
            placeholder="Cerca attività..."
            className="w-full pl-10 pr-4 py-3 bg-[#FEF5E7]/10 backdrop-blur-sm rounded-xl border border-[#FEF5E7]/20 focus:outline-none focus:ring-2 focus:ring-[#FEF5E7]/30 text-[#FEF5E7] placeholder-[#FEF5E7]/40"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={loading}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <FiFilter className="text-[#FEF5E7]/60" />
          <select
            className="bg-[#FEF5E7]/10 backdrop-blur-sm rounded-xl border border-[#FEF5E7]/20 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#FEF5E7]/30 text-[#FEF5E7]"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            disabled={loading}
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? 'Tutte le categorie' : category}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="max-h-96 overflow-y-auto pr-2 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FEF5E7] border-t-transparent"></div>
            <p className="mt-4 text-[#FEF5E7]/80">Caricamento attività in corso...</p>
          </div>
        ) : error ? (
          <div className="bg-red-500/20 backdrop-blur-sm border border-red-500/30 text-red-200 p-4 rounded-xl">
            <div className="flex items-center gap-2">
              <FiAlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </div>
        ) : filteredActivities.length > 0 ? (
          filteredActivities.map(activity => (
            <div 
              key={activity.id} 
              className="bg-[#FEF5E7] rounded-xl p-4 cursor-pointer hover:shadow-lg transition-all"
              onClick={() => onSelect(activity)}
            >
              <div className="flex items-start gap-4">
                {activity.image && (
                  <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                    <img 
                      src={activity.image} 
                      alt={activity.title} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-[#1E4E68]">{activity.title}</h4>
                    {activity.category && (
                      <span className="inline-block bg-[#1E4E68]/10 text-[#1E4E68] text-xs px-2 py-0.5 rounded-full">
                        {activity.category}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center text-[#1E4E68]/70 text-sm">
                    <FiClock className="w-4 h-4 mr-1" />
                    <span>Durata: {activity.duration} min</span>
                  </div>
                  {activity.description && (
                    <p className="text-sm text-[#1E4E68]/60 mt-2 line-clamp-2">
                      {activity.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-[#FEF5E7]/50 italic bg-[#FEF5E7]/5 backdrop-blur-sm rounded-xl border border-[#FEF5E7]/10">
            <FiSearch className="w-8 h-8 mx-auto mb-2 text-[#FEF5E7]/30" />
            <p>Nessuna attività trovata</p>
            <p className="text-sm mt-1">Prova a modificare i filtri di ricerca</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default function CreateItineraryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Stato dell'itinerario
  const [itinerary, setItinerary] = useState({
    title: '',
    description: '',
    days: 1,
  });
  
  // Stato per i giorni e le attività
  const [days, setDays] = useState([{ index: 0 }]);
  const [activities, setActivities] = useState([]);

  // Gestione del cambio di input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setItinerary({ ...itinerary, [name]: value });

    // Se cambia il numero di giorni, aggiorna l'array dei giorni
    if (name === 'days') {
      const daysCount = parseInt(value) || 1;
      const newDays = Array.from({ length: daysCount }, (_, i) => ({ index: i }));
      setDays(newDays);
    }
  };

  // Aggiunge un'attività a un giorno specifico
  const handleAddActivity = (dayIndex, activity = null) => {
    const newActivity = activity ? {
      ...activity,
      dayIndex,
      startTime: '09:00',
      endTime: '10:00',
    } : {
      id: `temp-${Date.now()}`,
      title: 'Nuova Attività',
      dayIndex,
      startTime: '09:00',
      endTime: '10:00',
    };
    
    setActivities([...activities, newActivity]);
  };

  // Rimuove un'attività
  const handleRemoveActivity = (activityId, dayIndex) => {
    setActivities(activities.filter((a, i) => 
      a.id !== activityId || (a.id === activityId && a.dayIndex !== dayIndex)
    ));
  };

  // Sposta un'attività da un giorno all'altro
  const handleMoveActivity = (activityIndex, fromDayIndex, toDayIndex) => {
    const updatedActivities = [...activities];
    const activityToMove = activities.find(
      (a, i) => i === activityIndex && a.dayIndex === fromDayIndex
    );
    
    if (activityToMove) {
      const newActivity = { ...activityToMove, dayIndex: toDayIndex };
      const filteredActivities = activities.filter(
        (a, i) => !(i === activityIndex && a.dayIndex === fromDayIndex)
      );
      
      setActivities([...filteredActivities, newActivity]);
    }
  };

  // Salva l'itinerario
  const handleSave = async () => {
    if (!itinerary.title) {
      setError('Il titolo è obbligatorio');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const itineraryData = {
        ...itinerary,
        activities: activities.map(a => ({
          id: a.id,
          title: a.title,
          dayIndex: a.dayIndex,
          startTime: a.startTime,
          endTime: a.endTime,
        })),
      };

      // Chiamata API per salvare l'itinerario
      const response = await fetch('/api/itineraries/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itineraryData),
      });

      if (!response.ok) {
        throw new Error('Errore durante il salvataggio dell\'itinerario');
      }

      setSuccess('Itinerario creato con successo');
      router.push('/backoffice/itineraries');
    } catch (error) {
      console.error('Errore:', error);
      setError('Impossibile salvare l\'itinerario. Riprova più tardi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-gradient-to-br from-[#082c33] to-[#1E4E68] text-[#FEF5E7]">
        <div className="p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <Link 
                  href="/backoffice/itineraries" 
                  className="flex items-center gap-2 text-[#FEF5E7]/80 hover:text-[#FEF5E7] transition-colors"
                >
                  <FiArrowLeft className="w-5 h-5" />
                  <span>Torna alla lista</span>
                </Link>
                <h1 className="text-3xl font-bold mt-2">Crea Nuovo Itinerario</h1>
              </div>
              <button 
                onClick={handleSave}
                disabled={loading}
                className="px-6 py-3 bg-[#FEF5E7] text-[#1E4E68] rounded-xl hover:bg-[#FEF5E7]/90 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiSave className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                <span>Salva Itinerario</span>
              </button>
            </div>

            {/* Messages */}
            {error && (
              <div className="bg-red-500/20 backdrop-blur-sm border border-red-500/30 text-red-200 p-4 rounded-xl mb-6">
                <div className="flex items-center gap-2">
                  <FiAlertCircle className="w-5 h-5" />
                  <span>{error}</span>
                </div>
              </div>
            )}

            {success && (
              <div className="bg-green-500/20 backdrop-blur-sm border border-green-500/30 text-green-200 p-4 rounded-xl mb-6">
                <div className="flex items-center gap-2">
                  <FiInfo className="w-5 h-5" />
                  <span>{success}</span>
                </div>
              </div>
            )}

            {/* Form principale */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="bg-[#FEF5E7]/5 backdrop-blur-sm rounded-xl p-6 mb-6 border border-[#FEF5E7]/10">
                  <h2 className="text-xl font-semibold text-[#FEF5E7] mb-6">Informazioni Itinerario</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-[#FEF5E7]/80 mb-2">
                        Titolo
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={itinerary.title}
                        onChange={handleChange}
                        placeholder="Inserisci un titolo..."
                        className="w-full px-4 py-3 bg-[#FEF5E7]/10 backdrop-blur-sm rounded-xl border border-[#FEF5E7]/20 focus:outline-none focus:ring-2 focus:ring-[#FEF5E7]/30 text-[#FEF5E7] placeholder-[#FEF5E7]/40"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-[#FEF5E7]/80 mb-2">
                        Descrizione
                      </label>
                      <textarea
                        name="description"
                        value={itinerary.description}
                        onChange={handleChange}
                        placeholder="Descrivi l'itinerario..."
                        rows="3"
                        className="w-full px-4 py-3 bg-[#FEF5E7]/10 backdrop-blur-sm rounded-xl border border-[#FEF5E7]/20 focus:outline-none focus:ring-2 focus:ring-[#FEF5E7]/30 text-[#FEF5E7] placeholder-[#FEF5E7]/40"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-[#FEF5E7]/80 mb-2">
                        Numero di Giorni
                      </label>
                      <div className="flex items-center gap-4">
                        <input
                          type="number"
                          name="days"
                          value={itinerary.days}
                          onChange={handleChange}
                          min="1"
                          max="14"
                          className="w-24 px-4 py-3 bg-[#FEF5E7]/10 backdrop-blur-sm rounded-xl border border-[#FEF5E7]/20 focus:outline-none focus:ring-2 focus:ring-[#FEF5E7]/30 text-[#FEF5E7]"
                        />
                        <span className="text-[#FEF5E7]/60">giorni</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timeline dei giorni */}
                <div className="bg-[#FEF5E7]/5 backdrop-blur-sm rounded-xl p-6 border border-[#FEF5E7]/10">
                  <h2 className="text-xl font-semibold text-[#FEF5E7] mb-6 flex items-center gap-2">
                    <FiCalendar className="w-5 h-5" />
                    <span>Pianificazione Giornaliera</span>
                  </h2>
                  
                  <div className="space-y-6">
                    {days.map((day) => (
                      <ItineraryDay
                        key={day.index}
                        day={day}
                        activities={activities}
                        onAddActivity={handleAddActivity}
                        onRemoveActivity={handleRemoveActivity}
                        onMoveActivity={handleMoveActivity}
                        setActivities={setActivities}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1">
                <ActivitySelector 
                  activities={[]}
                  onSelect={(activity) => handleAddActivity(0, activity)}
                />
                
                <div className="bg-[#FEF5E7]/5 backdrop-blur-sm rounded-xl p-6 border border-[#FEF5E7]/10">
                  <h3 className="text-xl font-semibold text-[#FEF5E7] mb-6">Suggerimenti</h3>
                  <ul className="text-[#FEF5E7]/80 space-y-4">
                    <li className="flex items-start gap-3">
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-[#FEF5E7] text-[#1E4E68] rounded-lg text-sm font-medium flex-shrink-0">1</span>
                      <span>Trascina le attività tra i diversi giorni per organizzare l'itinerario</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-[#FEF5E7] text-[#1E4E68] rounded-lg text-sm font-medium flex-shrink-0">2</span>
                      <span>Aggiungi attività dal pannello laterale o crea nuove attività direttamente</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-[#FEF5E7] text-[#1E4E68] rounded-lg text-sm font-medium flex-shrink-0">3</span>
                      <span>Imposta gli orari per ogni attività per creare una timeline precisa</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  );
}