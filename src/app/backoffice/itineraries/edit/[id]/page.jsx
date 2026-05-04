"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiSave, FiPlus, FiCalendar, FiClock, FiTrash2, FiMove, FiLoader } from 'react-icons/fi';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

const newClientId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `cid-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const toMinutes = (time) => {
  if (typeof time !== 'string' || !/^\d{2}:\d{2}$/.test(time)) return 0;
  const [h, m] = time.split(':').map(n => parseInt(n, 10));
  return (h * 60) + m;
};

const fromMinutes = (minutes) => {
  const m = Math.max(0, Math.min(23 * 60 + 59, minutes));
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${h.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`;
};

const addMinutes = (time, delta) => fromMinutes(toMinutes(time) + delta);

// Componente per un singolo giorno dell'itinerario
const ItineraryDay = ({ day, activities, onAddActivity, onRemoveActivity, onMoveActivity, setActivities }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'activity',
    drop: (item) => {
      if (item.dayIndex !== day.index) {
        onMoveActivity(item.clientId, item.dayIndex, day.index);
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  return (
    <div 
      ref={drop}
      className={`bg-[#1E4E68] rounded-2xl p-4 mb-4 border-2 ${isOver ? 'border-[#79424f]' : 'border-transparent'}`}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-[#FEF5E7]">
          Giorno {day.index + 1}
        </h3>
        <button
          onClick={() => onAddActivity(day.index)}
          className="p-2 bg-[#79424f]/80 text-[#FEF5E7] rounded-full hover:bg-[#79424f] transition flex items-center"
        >
          <FiPlus size={16} />
        </button>
      </div>

      {/* Lista attività del giorno */}
      <div className="space-y-3">
        {activities
          .filter(activity => activity.dayIndex === day.index)
          .map((activity, index) => (
            <DraggableActivity 
              key={activity.clientId}
              activity={activity}
              dayIndex={day.index}
              onRemove={onRemoveActivity}
              activities={activities}
              setActivities={setActivities}
            />
          ))}

        {activities.filter(a => a.dayIndex === day.index).length === 0 && (
          <div className="text-center py-6 text-[#FEF5E7]/50 italic">
            Nessuna attività. Aggiungi un'attività o trascina qui un'attività esistente.
          </div>
        )}
      </div>
    </div>
  );
};

// Componente per un'attività trascinabile
const DraggableActivity = ({ activity, dayIndex, onRemove, activities, setActivities }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'activity',
    item: { clientId: activity.clientId, dayIndex },
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

  // Aggiorna l'attività nel parent component quando si salvano i cambiamenti
  const handleTimeChange = (e) => {
    const { name, value } = e.target;
    setTimeValues(prev => ({ ...prev, [name]: value }));
  };

  const saveTimeChanges = () => {
    const activityIndex = activities.findIndex((a) => a.clientId === activity.clientId);

    if (activityIndex !== -1) {
      const updatedActivities = [...activities];
      updatedActivities[activityIndex] = {
        ...updatedActivities[activityIndex],
        startTime: timeValues.startTime,
        endTime: timeValues.endTime,
        title: timeValues.title,
        description: timeValues.description
      };
      setActivities(updatedActivities);
    }

    setIsEditing(false);
  };

  return (
    <div 
      ref={drag}
      className={`bg-[#FEF5E7] rounded-xl p-3 cursor-move ${isDragging ? 'opacity-50' : 'opacity-100'}`}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center">
          <FiMove className="text-[#1E4E68]/50 mr-2" />
          <div>
            <h4 className="font-medium text-[#1E4E68]">{activity.title}</h4>
            {isEditing ? (
              <div className="mt-2 space-y-2">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-[#1E4E68]/70">Titolo:</label>
                  <input
                    type="text"
                    name="title"
                    value={timeValues.title}
                    onChange={handleTimeChange}
                    className="w-full px-2 py-1 text-xs bg-[#1E4E68]/10 rounded-md text-[#1E4E68]"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-[#1E4E68]/70">Inizio:</label>
                  <input
                    type="time"
                    name="startTime"
                    value={timeValues.startTime}
                    onChange={handleTimeChange}
                    className="px-2 py-1 text-xs bg-[#1E4E68]/10 rounded-md text-[#1E4E68]"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-[#1E4E68]/70">Fine:</label>
                  <input
                    type="time"
                    name="endTime"
                    value={timeValues.endTime}
                    onChange={handleTimeChange}
                    className="px-2 py-1 text-xs bg-[#1E4E68]/10 rounded-md text-[#1E4E68]"
                  />
                </div>
                <div className="flex items-start gap-2">
                  <label className="text-xs text-[#1E4E68]/70 pt-1">Note:</label>
                  <textarea
                    name="description"
                    value={timeValues.description}
                    onChange={handleTimeChange}
                    rows={2}
                    className="w-full px-2 py-1 text-xs bg-[#1E4E68]/10 rounded-md text-[#1E4E68]"
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={saveTimeChanges}
                    className="px-2 py-1 text-xs bg-green-500 text-white rounded-md hover:bg-green-600 transition"
                  >
                    Salva
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-2 py-1 text-xs bg-gray-500 text-white rounded-md hover:bg-gray-600 transition"
                  >
                    Annulla
                  </button>
                </div>
              </div>
            ) : (
              <div 
                className="flex items-center text-[#1E4E68]/70 text-xs cursor-pointer hover:text-[#1E4E68] transition"
                onClick={() => setIsEditing(true)}
              >
                <FiClock className="mr-1" />
                <span>{activity.startTime} - {activity.endTime}</span>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={() => onRemove(activity.clientId)}
          className="p-1.5 text-[#F15525] hover:bg-[#F15525]/10 rounded-full transition"
        >
          <FiTrash2 size={16} />
        </button>
      </div>
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

  const categories = ['all', ...new Set(availableActivities.map(a => a.category).filter(Boolean))];

  return (
    <div className="bg-[#1E4E68] rounded-2xl p-4 mb-4">
      <h3 className="text-lg font-semibold text-[#FEF5E7] mb-3">Attività Disponibili</h3>
      
      <div className="space-y-3 mb-4">
        <input
          type="text"
          placeholder="Cerca attività..."
          className="w-full px-4 py-2 bg-[#082c33] text-[#FEF5E7] rounded-full focus:outline-none focus:ring-2 focus:ring-[#79424f] placeholder-[#FEF5E7]/50"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          disabled={loading}
        />
        <select
          className="w-full px-4 py-2 bg-[#082c33] text-[#FEF5E7] rounded-full focus:outline-none focus:ring-2 focus:ring-[#79424f]"
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
      
      <div className="max-h-60 overflow-y-auto pr-2 space-y-2">
        {loading ? (
          <div className="text-center py-8 text-[#FEF5E7]/70">
            <div className="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent rounded-full mb-2" />
            <p>Caricamento attività...</p>
          </div>
        ) : error ? (
          <div className="text-center py-4 text-[#F15525] italic">
            {error}
          </div>
        ) : filteredActivities.length > 0 ? (
          filteredActivities.map(activity => (
            <div 
              key={activity.id} 
              className="bg-[#FEF5E7] rounded-xl p-3 cursor-pointer hover:bg-[#FEF5E7]/90 transition"
              onClick={() => onSelect(activity)}
            >
              <div className="flex items-start">
                {activity.image && (
                  <div className="w-12 h-12 rounded-md overflow-hidden mr-3 flex-shrink-0">
                    <img 
                      src={activity.image} 
                      alt={activity.title} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <h4 className="font-medium text-[#1E4E68]">{activity.title}</h4>
                  {activity.category && (
                    <div className="inline-block bg-[#1E4E68]/10 text-[#1E4E68] text-xs px-2 py-0.5 rounded-full mb-1">
                      {activity.category}
                    </div>
                  )}
                  <div className="flex items-center text-[#1E4E68]/70 text-xs">
                    <FiClock className="mr-1" />
                    <span>Durata: {activity.duration} min</span>
                  </div>
                </div>
              </div>
              {activity.description && (
                <p className="text-xs text-[#1E4E68]/80 mt-2 line-clamp-2">
                  {activity.description}
                </p>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-4 text-[#FEF5E7]/50 italic">
            Nessuna attività trovata
          </div>
        )}
      </div>
    </div>
  );
};

export default function EditItineraryPage({ params }) {
  const router = useRouter();
  const { id } = params;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  
  // Stato dell'itinerario
  const [itinerary, setItinerary] = useState({
    title: '',
    description: '',
    days: 1,
  });
  
  // Stato per i giorni e le attività
  const [days, setDays] = useState([{ index: 0 }]);
  const [activities, setActivities] = useState([]);

  const computeTimeSlot = (dayIndex, durationMinutes = 60) => {
    const dayActivities = activities
      .filter(a => a.dayIndex === dayIndex)
      .slice()
      .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
    const last = dayActivities[dayActivities.length - 1];
    const start = last?.endTime ? addMinutes(last.endTime, 15) : '09:00';
    const end = addMinutes(start, durationMinutes);
    return { startTime: start, endTime: end };
  };

  // Carica i dati dell'itinerario
  useEffect(() => {
    const fetchItinerary = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/itineraries/${id}`);
        
        if (!response.ok) {
          throw new Error('Errore nel caricamento dell\'itinerario');
        }
        
        const data = await response.json();
        
        // Imposta i dati dell'itinerario
        setItinerary({
          title: data.title || '',
          description: data.description || '',
          days: data.days || 1,
        });
        
        // Imposta i giorni
        const daysCount = data.days || 1;
        const newDays = Array.from({ length: daysCount }, (_, i) => ({ index: i }));
        setDays(newDays);
        setSelectedDayIndex((prev) => Math.max(0, Math.min(daysCount - 1, prev)));
        
        // Imposta le attività
        setActivities((data.activities || []).map(a => ({
          ...a,
          clientId: newClientId(),
          description: a.description || ''
        })));
      } catch (error) {
        console.error('Errore:', error);
        setError('Impossibile caricare l\'itinerario. Riprova più tardi.');
      } finally {
        setLoading(false);
      }
    };

    fetchItinerary();
  }, [id]);

  // Gestione del cambio di input
  const handleChange = (e) => {
    const { name, value } = e.target;
    const nextValue = name === 'days' ? (parseInt(value, 10) || 1) : value;
    setItinerary({ ...itinerary, [name]: nextValue });

    // Se cambia il numero di giorni, aggiorna l'array dei giorni
    if (name === 'days') {
      const daysCount = nextValue;
      const newDays = Array.from({ length: daysCount }, (_, i) => ({ index: i }));
      setDays(newDays);
      setSelectedDayIndex((prev) => Math.max(0, Math.min(daysCount - 1, prev)));
      setActivities((prev) => prev.filter(a => a.dayIndex < daysCount));
    }
  };

  // Aggiunge un'attività a un giorno specifico
  const handleAddActivity = (dayIndex, activity = null) => {
    const duration = activity?.duration ? parseInt(activity.duration, 10) : 60;
    const { startTime, endTime } = computeTimeSlot(dayIndex, Number.isFinite(duration) ? duration : 60);
    const newActivity = activity ? {
      ...activity,
      clientId: newClientId(),
      dayIndex,
      startTime,
      endTime,
    } : {
      clientId: newClientId(),
      title: 'Nuova Attività',
      dayIndex,
      startTime,
      endTime,
      description: ''
    };
    
    setActivities([...activities, newActivity]);
  };

  // Rimuove un'attività
  const handleRemoveActivity = (clientId) => {
    setActivities(activities.filter(a => a.clientId !== clientId));
  };

  // Sposta un'attività da un giorno all'altro
  const handleMoveActivity = (clientId, fromDayIndex, toDayIndex) => {
    const activityToMove = activities.find(a => a.clientId === clientId && a.dayIndex === fromDayIndex);
    
    if (activityToMove) {
      const newActivity = { ...activityToMove, dayIndex: toDayIndex };
      const filteredActivities = activities.filter(a => a.clientId !== clientId);
      
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
      setSaving(true);
      setError('');

      const itineraryData = {
        ...itinerary,
        activities: activities
          .slice()
          .sort((a, b) => {
            if (a.dayIndex !== b.dayIndex) return a.dayIndex - b.dayIndex;
            return (a.startTime || '').localeCompare(b.startTime || '');
          })
          .map(a => ({
          title: a.title,
          dayIndex: a.dayIndex,
          startTime: a.startTime,
          endTime: a.endTime,
          description: a.description || '',
        })),
      };

      // Chiamata API per aggiornare l'itinerario
      const response = await fetch(`/api/itineraries/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itineraryData),
      });

      if (!response.ok) {
        throw new Error('Errore durante l\'aggiornamento dell\'itinerario');
      }

      // Reindirizza alla pagina di gestione itinerari
      router.push('/backoffice/itineraries');
    } catch (error) {
      console.error('Errore:', error);
      setError('Impossibile aggiornare l\'itinerario. Riprova più tardi.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#082c33] flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#FEF5E7] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <Link 
              href="/backoffice/itineraries" 
              className="flex items-center gap-2 text-[#FEF5E7]/80 hover:text-[#FEF5E7] transition-colors"
            >
              <FiArrowLeft className="w-5 h-5" />
              <span>Torna alla lista</span>
            </Link>
            <h1 className="text-3xl font-bold mt-2">Modifica Itinerario</h1>
          </div>
          <button 
            onClick={handleSave}
            disabled={saving}
            className={`px-6 py-3 bg-[#FEF5E7] text-[#1E4E68] rounded-xl hover:bg-[#FEF5E7]/90 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {saving ? (
              <>
                <FiLoader className="w-5 h-5 animate-spin" /> Salvataggio...
              </>
            ) : (
              <>
                <FiSave className="w-5 h-5" /> Salva Modifiche
              </>
            )}
          </button>
        </div>

        <main className="container mx-auto py-8 px-4">
          {error && (
            <div className="bg-[#F15525]/80 text-[#FEF5E7] p-4 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Form principale */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-[#1E4E68] rounded-3xl shadow-2xl p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">Informazioni Itinerario</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#FEF5E7]/80 mb-1">
                      Titolo
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={itinerary.title}
                      onChange={handleChange}
                      placeholder="Inserisci un titolo..."
                      className="w-full px-4 py-2 bg-[#082c33] text-[#FEF5E7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#79424f] placeholder-[#FEF5E7]/50"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-[#FEF5E7]/80 mb-1">
                      Descrizione
                    </label>
                    <textarea
                      name="description"
                      value={itinerary.description}
                      onChange={handleChange}
                      placeholder="Descrivi l'itinerario..."
                      rows="3"
                      className="w-full px-4 py-2 bg-[#082c33] text-[#FEF5E7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#79424f] placeholder-[#FEF5E7]/50"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-[#FEF5E7]/80 mb-1">
                      Numero di Giorni
                    </label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        name="days"
                        value={itinerary.days}
                        onChange={handleChange}
                        min="1"
                        max="14"
                        className="w-24 px-4 py-2 bg-[#082c33] text-[#FEF5E7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#79424f]"
                      />
                      <span className="ml-2 text-[#FEF5E7]/70">giorni</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline dei giorni */}
              <div className="bg-[#1E4E68] rounded-3xl shadow-2xl p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <FiCalendar className="mr-2" /> Pianificazione Giornaliera
                </h2>
                
                <div className="space-y-4">
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
                onSelect={(activity) => handleAddActivity(selectedDayIndex, activity)}
              />

              <div className="bg-[#1E4E68] rounded-2xl p-4 mb-4">
                <h3 className="text-lg font-semibold text-[#FEF5E7] mb-3">Giorno target</h3>
                <div className="flex items-center gap-3">
                  <FiCalendar className="text-[#FEF5E7]/70" />
                  <select
                    className="w-full px-4 py-2 bg-[#082c33] text-[#FEF5E7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#79424f]"
                    value={selectedDayIndex}
                    onChange={(e) => setSelectedDayIndex(parseInt(e.target.value, 10))}
                  >
                    {days.map((d) => (
                      <option key={d.index} value={d.index}>
                        Giorno {d.index + 1}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="bg-[#1E4E68] rounded-2xl p-4">
                <h3 className="text-lg font-semibold text-[#FEF5E7] mb-3">Suggerimenti</h3>
                <ul className="text-[#FEF5E7]/80 space-y-2 text-sm">
                  <li className="flex items-start">
                    <span className="inline-block bg-[#79424f] text-[#FEF5E7] rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5">1</span>
                    <span>Trascina le attività tra i diversi giorni per organizzare l'itinerario</span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block bg-[#79424f] text-[#FEF5E7] rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5">2</span>
                    <span>Aggiungi attività dal pannello laterale o crea nuove attività direttamente</span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block bg-[#79424f] text-[#FEF5E7] rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5">3</span>
                    <span>Imposta gli orari per ogni attività per creare una timeline precisa</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </main>
      </div>
    </DndProvider>
  );
}
