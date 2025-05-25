"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiPlus, FiTrash2, FiImage, FiCheck, FiX, FiLoader, FiGlobe } from 'react-icons/fi';
import TranslateButton from '@/app/components/TranslateButton';

// Categorie predefinite
const PREDEFINED_CATEGORIES = [
  { id: 'restaurant', label: 'Ristorante' },
  { id: 'bar', label: 'Bar' },
  { id: 'cafe', label: 'Caffè' },
  { id: 'hotel', label: 'Hotel' },
  { id: 'museum', label: 'Museo' },
  { id: 'gallery', label: 'Galleria d\'Arte' },
  { id: 'shop', label: 'Negozio' },
  { id: 'beach', label: 'Spiaggia' },
  { id: 'park', label: 'Parco' },
  { id: 'theater', label: 'Teatro' },
  { id: 'cinema', label: 'Cinema' },
  { id: 'nightclub', label: 'Nightclub' },
  { id: 'spa', label: 'Spa' },
  { id: 'gym', label: 'Palestra' },
  { id: 'other', label: 'Altro' }
];

export default function EditActivityPage({ params }) {
  const { id } = params;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  
  // Stato per i campi principali dell'attività
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    menu: '',
    prices: '',
    address: '',
    phone_number: '',
    website: '',
    description: '',
    category: '',
    google_maps_url: '',
    audio_guide_text: ''
  });

  // Stato per gestire le immagini (array di oggetti)
  const [images, setImages] = useState([]);

  // Carica i dati dell'attività
  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const response = await fetch(`/api/activities/${id}`);
        
        if (!response.ok) {
          throw new Error('Errore nel caricamento dell\'attività');
        }
        
        const data = await response.json();
        
        if (data.success) {
          // Imposta i dati dell'attività nel form
          setFormData({
            name: data.activity.name || '',
            email: data.activity.email || '',
            menu: data.activity.menu || '',
            prices: data.activity.prices || '',
            address: data.activity.address || '',
            phone_number: data.activity.phone_number || '',
            website: data.activity.website || '',
            description: data.activity.description || '',
            category: data.activity.category || '',
            google_maps_url: data.activity.google_maps_url || '',
            audio_guide_text: data.activity.audio_guide_text || ''
          });
          
          // Imposta le immagini
          setImages(data.images || []);
        } else {
          setError('Attività non trovata');
        }
      } catch (error) {
        console.error('Errore nel recupero dell\'attività:', error);
        setError('Impossibile caricare i dati dell\'attività. Riprova più tardi.');
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, [id]);

  // Gestione delle modifiche dei campi principali
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Gestione delle modifiche per ogni immagine
  const handleImageChange = (index, field, value) => {
    const updatedImages = [...images];
    updatedImages[index] = { ...updatedImages[index], [field]: value };
    setImages(updatedImages);
  };

  // Aggiunge un nuovo oggetto immagine
  const addImage = () => {
    setImages(prev => [...prev, { image_url: '', description: '', is_main: false }]);
  };

  // Rimuove un'immagine dall'array
  const removeImage = (index) => {
    setImages(prev => prev.filter((_, idx) => idx !== index));
  };

  // Gestione del submit del form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setSaving(true);
    
    try {
      const payload = { ...formData, images };
      
      const response = await fetch(`/api/activities/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(true);
        
        // Reindirizza alla lista dopo 2 secondi
        setTimeout(() => {
          router.push('/backoffice/activities');
        }, 2000);
      } else {
        setError(data.message || 'Errore durante l\'aggiornamento dell\'attività');
      }
    } catch (error) {
      console.error('Errore durante il salvataggio:', error);
      setError('Errore di connessione al server');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#082c33] to-[#1E4E68]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FEF5E7] border-t-transparent"></div>
          <p className="text-[#FEF5E7]/80">Caricamento in corso...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#082c33] to-[#1E4E68] text-[#FEF5E7]">
      <div className=" p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <Link 
                href="/backoffice/activities" 
                className="flex items-center gap-2 text-[#FEF5E7]/80 hover:text-[#FEF5E7] transition-colors"
              >
                <FiArrowLeft className="w-5 h-5" />
                <span>Torna alla lista</span>
              </Link>
              <h1 className="text-3xl font-bold mt-2">Modifica Attività</h1>
            </div>
            <div className="flex items-center gap-4">
              <TranslateButton activity={{...formData, id}} />
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="bg-red-500/20 backdrop-blur-sm border border-red-500/30 text-red-200 p-4 rounded-xl mb-6">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-500/20 backdrop-blur-sm border border-green-500/30 text-green-200 p-4 rounded-xl mb-6">
              <div className="flex items-center gap-2">
                <FiCheck className="w-5 h-5" />
                <span>Attività aggiornata con successo! Reindirizzamento in corso...</span>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="bg-[#FEF5E7]/5 backdrop-blur-sm rounded-xl border border-[#FEF5E7]/10 p-6">
              <h2 className="text-xl font-semibold mb-6">Informazioni Generali</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nome */}
                <div className="space-y-2">
                  <label htmlFor="name" className="block text-sm font-medium text-[#FEF5E7]/80">
                    Nome *
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-[#FEF5E7]/10 backdrop-blur-sm rounded-xl border border-[#FEF5E7]/20 focus:outline-none focus:ring-2 focus:ring-[#FEF5E7]/30 text-[#FEF5E7] placeholder-[#FEF5E7]/40"
                    placeholder="Inserisci il nome dell'attività"
                  />
                </div>
                
                {/* Email */}
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium text-[#FEF5E7]/80">
                    Email *
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-[#FEF5E7]/10 backdrop-blur-sm rounded-xl border border-[#FEF5E7]/20 focus:outline-none focus:ring-2 focus:ring-[#FEF5E7]/30 text-[#FEF5E7] placeholder-[#FEF5E7]/40"
                    placeholder="Inserisci l'email dell'attività"
                  />
                </div>
                
                {/* Google Maps URL */}
                <div className="space-y-2">
                  <label htmlFor="google_maps_url" className="block text-sm font-medium text-[#FEF5E7]/80">
                    URL Google Maps
                  </label>
                  <input
                    id="google_maps_url"
                    name="google_maps_url"
                    type="url"
                    value={formData.google_maps_url}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-[#FEF5E7]/10 backdrop-blur-sm rounded-xl border border-[#FEF5E7]/20 focus:outline-none focus:ring-2 focus:ring-[#FEF5E7]/30 text-[#FEF5E7] placeholder-[#FEF5E7]/40"
                    placeholder="Inserisci l'URL di Google Maps"
                  />
                  <p className="mt-2 text-sm text-[#FEF5E7]/60">
                    Inserisci l'URL di Google Maps per permettere agli utenti di trovare facilmente l'attività
                  </p>
                </div>
                
                {/* Categoria */}
                <div className="space-y-2">
                  <label htmlFor="category" className="block text-sm font-medium text-[#FEF5E7]/80">
                    Categoria
                  </label>
                  {!showCustomCategory ? (
                    <div className="space-y-2">
                      <select
                    id="category"
                    name="category"
                        value={formData.category}
                        onChange={(e) => {
                          if (e.target.value === 'custom') {
                            setShowCustomCategory(true);
                            setFormData(prev => ({ ...prev, category: '' }));
                          } else {
                            setFormData(prev => ({ ...prev, category: e.target.value }));
                          }
                        }}
                        className="w-full px-4 py-3 bg-[#FEF5E7]/10 backdrop-blur-sm rounded-xl border border-[#FEF5E7]/20 focus:outline-none focus:ring-2 focus:ring-[#FEF5E7]/30 text-[#FEF5E7] placeholder-[#FEF5E7]/40"
                      >
                        <option value="">Seleziona una categoria</option>
                        {PREDEFINED_CATEGORIES.map((cat) => (
                          <option key={cat.id} value={cat.label}>
                            {cat.label}
                          </option>
                        ))}
                        <option value="custom">+ Aggiungi nuova categoria</option>
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                    type="text"
                    value={formData.category}
                          onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                          placeholder="Inserisci una nuova categoria"
                          className="flex-1 px-4 py-3 bg-[#FEF5E7]/10 backdrop-blur-sm rounded-xl border border-[#FEF5E7]/20 focus:outline-none focus:ring-2 focus:ring-[#FEF5E7]/30 text-[#FEF5E7] placeholder-[#FEF5E7]/40"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setShowCustomCategory(false);
                            setFormData(prev => ({ ...prev, category: '' }));
                          }}
                          className="px-4 py-2 bg-[#FEF5E7]/10 hover:bg-[#FEF5E7]/20 rounded-xl transition-colors"
                        >
                          Annulla
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Indirizzo */}
                <div className="space-y-2">
                  <label htmlFor="address" className="block text-sm font-medium text-[#FEF5E7]/80">
                    Indirizzo
                  </label>
                  <input
                    id="address"
                    name="address"
                    type="text"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-[#FEF5E7]/10 backdrop-blur-sm rounded-xl border border-[#FEF5E7]/20 focus:outline-none focus:ring-2 focus:ring-[#FEF5E7]/30 text-[#FEF5E7] placeholder-[#FEF5E7]/40"
                    placeholder="Inserisci l'indirizzo"
                  />
                </div>
                
                {/* Telefono */}
                <div className="space-y-2">
                  <label htmlFor="phone_number" className="block text-sm font-medium text-[#FEF5E7]/80">
                    Telefono
                  </label>
                  <input
                    id="phone_number"
                    name="phone_number"
                    type="text"
                    value={formData.phone_number}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-[#FEF5E7]/10 backdrop-blur-sm rounded-xl border border-[#FEF5E7]/20 focus:outline-none focus:ring-2 focus:ring-[#FEF5E7]/30 text-[#FEF5E7] placeholder-[#FEF5E7]/40"
                    placeholder="Inserisci il numero di telefono"
                  />
                </div>
                
                {/* Sito Web */}
                <div className="space-y-2">
                  <label htmlFor="website" className="block text-sm font-medium text-[#FEF5E7]/80">
                    Sito Web
                  </label>
                  <input
                    id="website"
                    name="website"
                    type="text"
                    value={formData.website}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-[#FEF5E7]/10 backdrop-blur-sm rounded-xl border border-[#FEF5E7]/20 focus:outline-none focus:ring-2 focus:ring-[#FEF5E7]/30 text-[#FEF5E7] placeholder-[#FEF5E7]/40"
                    placeholder="Inserisci l'URL del sito web"
                  />
                </div>
              </div>
            </div>

            {/* Audio Guide */}
            <div className="bg-[#FEF5E7]/5 backdrop-blur-sm rounded-xl border border-[#FEF5E7]/10 p-6">
              <h2 className="text-xl font-semibold mb-6">Audio Guida</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="audio_guide_text" className="block text-sm font-medium text-[#FEF5E7]/80">
                    Testo Audio Guida (Opzionale)
                  </label>
                  <textarea
                    id="audio_guide_text"
                    name="audio_guide_text"
                    rows="6"
                    value={formData.audio_guide_text}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-[#FEF5E7]/10 backdrop-blur-sm rounded-xl border border-[#FEF5E7]/20 focus:outline-none focus:ring-2 focus:ring-[#FEF5E7]/30 text-[#FEF5E7] placeholder-[#FEF5E7]/40"
                    placeholder="Inserisci il testo che verrà letto da Taoleia come guida audio (opzionale)"
                  />
                  <p className="mt-2 text-sm text-[#FEF5E7]/60">
                    Se desideri fornire una guida audio per questa attività, inserisci qui il testo che verrà letto dalla voce di Taoleia. Questo campo è completamente opzionale.
                  </p>
                </div>
              </div>
            </div>

            {/* Menu e Prezzi */}
            <div className="bg-[#FEF5E7]/5 backdrop-blur-sm rounded-xl border border-[#FEF5E7]/10 p-6">
              <h2 className="text-xl font-semibold mb-6">Menu e Prezzi</h2>
              <div className="space-y-6">
                {/* Menu */}
                <div className="space-y-2">
                  <label htmlFor="menu" className="block text-sm font-medium text-[#FEF5E7]/80">
                    Menu
                  </label>
                  <textarea
                    id="menu"
                    name="menu"
                    rows="4"
                    value={formData.menu}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-[#FEF5E7]/10 backdrop-blur-sm rounded-xl border border-[#FEF5E7]/20 focus:outline-none focus:ring-2 focus:ring-[#FEF5E7]/30 text-[#FEF5E7] placeholder-[#FEF5E7]/40"
                    placeholder="Inserisci il menu dell'attività"
                  />
                </div>
                
                {/* Prezzi */}
                <div className="space-y-2">
                  <label htmlFor="prices" className="block text-sm font-medium text-[#FEF5E7]/80">
                    Prezzi
                  </label>
                  <textarea
                    id="prices"
                    name="prices"
                    rows="4"
                    value={formData.prices}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-[#FEF5E7]/10 backdrop-blur-sm rounded-xl border border-[#FEF5E7]/20 focus:outline-none focus:ring-2 focus:ring-[#FEF5E7]/30 text-[#FEF5E7] placeholder-[#FEF5E7]/40"
                    placeholder="Inserisci i prezzi"
                  />
                </div>
              </div>
            </div>

            {/* Immagini */}
            <div className="bg-[#FEF5E7]/5 backdrop-blur-sm rounded-xl border border-[#FEF5E7]/10 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Immagini</h2>
                <button
                  type="button"
                  onClick={addImage}
                  className="flex items-center gap-2 px-4 py-2 bg-[#FEF5E7] text-[#1E4E68] rounded-xl hover:bg-[#FEF5E7]/90 transition-all"
                >
                  <FiPlus className="w-5 h-5" />
                  <span>Aggiungi Immagine</span>
                </button>
              </div>

              <div className="space-y-6">
                {images.map((image, index) => (
                  <div key={index} className="bg-[#FEF5E7]/10 backdrop-blur-sm rounded-xl p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2">
                        <FiImage className="w-5 h-5 text-[#FEF5E7]/60" />
                        <span className="font-medium">Immagine {index + 1}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                      >
                        <FiTrash2 className="w-5 h-5 text-red-400" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-[#FEF5E7]/80">
                          URL Immagine
                        </label>
                        <input
                          type="text"
                          value={image.image_url}
                          onChange={(e) => handleImageChange(index, 'image_url', e.target.value)}
                          className="w-full px-4 py-3 bg-[#FEF5E7]/10 backdrop-blur-sm rounded-xl border border-[#FEF5E7]/20 focus:outline-none focus:ring-2 focus:ring-[#FEF5E7]/30 text-[#FEF5E7] placeholder-[#FEF5E7]/40"
                          placeholder="Inserisci l'URL dell'immagine"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-[#FEF5E7]/80">
                          Descrizione
                        </label>
                        <input
                          type="text"
                          value={image.description}
                          onChange={(e) => handleImageChange(index, 'description', e.target.value)}
                          className="w-full px-4 py-3 bg-[#FEF5E7]/10 backdrop-blur-sm rounded-xl border border-[#FEF5E7]/20 focus:outline-none focus:ring-2 focus:ring-[#FEF5E7]/30 text-[#FEF5E7] placeholder-[#FEF5E7]/40"
                          placeholder="Inserisci una descrizione"
                        />
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={image.is_main}
                          onChange={(e) => handleImageChange(index, 'is_main', e.target.checked)}
                          className="w-4 h-4 rounded border-[#FEF5E7]/20 bg-[#FEF5E7]/10 focus:ring-[#FEF5E7]/30"
                        />
                        <span className="text-sm text-[#FEF5E7]/80">Immagine principale</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => router.push('/backoffice/activities')}
                className="px-6 py-3 bg-[#FEF5E7]/10 hover:bg-[#FEF5E7]/20 rounded-xl transition-all"
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-[#FEF5E7] text-[#1E4E68] rounded-xl hover:bg-[#FEF5E7]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <FiLoader className="w-5 h-5 animate-spin" />
                    <span>Salvataggio in corso...</span>
                  </>
                ) : (
                  <span>Salva Modifiche</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}