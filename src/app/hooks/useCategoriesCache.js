'use client';

import { useState, useEffect, useCallback } from 'react';

// Cache globale per le categorie
let globalCategoriesCache = null;
let globalActivitiesCache = null;
let isLoadingCategories = false;
let isLoadingActivities = false;
const subscribers = new Set();

// Funzione per notificare tutti i subscriber
const notifySubscribers = () => {
  subscribers.forEach(callback => callback());
};

// Hook personalizzato per gestire la cache delle categorie
export function useCategoriesCache() {
  const [categories, setCategories] = useState(globalCategoriesCache || []);
  const [activities, setActivities] = useState(globalActivitiesCache || []);
  const [loading, setLoading] = useState(false);

  // Funzione per aggiornare lo stato locale
  const updateState = useCallback(() => {
    setCategories(globalCategoriesCache || []);
    setActivities(globalActivitiesCache || []);
    setLoading(isLoadingCategories || isLoadingActivities);
  }, []);

  // Registra il componente come subscriber
  useEffect(() => {
    subscribers.add(updateState);
    return () => {
      subscribers.delete(updateState);
    };
  }, [updateState]);

  // Funzione per caricare le categorie
  const loadCategories = useCallback(async () => {
    if (isLoadingCategories || globalCategoriesCache) return;
    
    // Controlla prima la cache localStorage
    const timestamp = localStorage.getItem('categoriesCacheTimestamp');
    const now = Date.now();
    const cacheAge = timestamp ? now - parseInt(timestamp) : Infinity;
    const cacheExpired = cacheAge > 3600000; // 1 ora

    if (!cacheExpired) {
      const cache = localStorage.getItem('categoriesCache');
      if (cache) {
        try {
          const data = JSON.parse(cache);
          if (data && data.categories && Array.isArray(data.categories)) {
            globalCategoriesCache = data.categories;
            notifySubscribers();
            return;
          }
        } catch (e) {
          // Continua con il fetch se la cache è corrotta
        }
      }
    }

    isLoadingCategories = true;
    notifySubscribers();

    try {
      const res = await fetch('/api/get-categories');
      if (!res.ok) throw new Error(`Errore HTTP: ${res.status}`);
      const data = await res.json();
      
      if (data && data.categories && Array.isArray(data.categories)) {
        globalCategoriesCache = data.categories;
        localStorage.setItem('categoriesCache', JSON.stringify(data));
        localStorage.setItem('categoriesCacheTimestamp', Date.now().toString());
      } else {
        globalCategoriesCache = [];
      }
    } catch (error) {
      console.error('Errore nel caricamento delle categorie:', error);
      // Prova a usare i dati dalla cache se disponibili
      const cache = localStorage.getItem('categoriesCache');
      if (cache) {
        try {
          const data = JSON.parse(cache);
          if (data && data.categories) {
            globalCategoriesCache = data.categories;
          }
        } catch (e) {
          globalCategoriesCache = [];
        }
      } else {
        globalCategoriesCache = [];
      }
    } finally {
      isLoadingCategories = false;
      notifySubscribers();
    }
  }, []);

  // Funzione per caricare le attività
  const loadActivities = useCallback(async () => {
    if (isLoadingActivities || globalActivitiesCache) return;
    
    // Controlla prima la cache localStorage
    const timestamp = localStorage.getItem('activitiesCacheTimestamp');
    const now = Date.now();
    const cacheAge = timestamp ? now - parseInt(timestamp) : Infinity;
    const cacheExpired = cacheAge > 3600000; // 1 ora

    if (!cacheExpired) {
      const cache = localStorage.getItem('activitiesCache');
      if (cache) {
        try {
          const data = JSON.parse(cache);
          if (data && data.activities && Array.isArray(data.activities)) {
            globalActivitiesCache = data.activities;
            notifySubscribers();
            return;
          }
        } catch (e) {
          // Continua con il fetch se la cache è corrotta
        }
      }
    }

    isLoadingActivities = true;
    notifySubscribers();

    try {
      const res = await fetch('/api/get-activities');
      if (!res.ok) throw new Error(`Errore HTTP: ${res.status}`);
      const data = await res.json();
      
      if (data && data.activities && Array.isArray(data.activities)) {
        globalActivitiesCache = data.activities;
        localStorage.setItem('activitiesCache', JSON.stringify(data));
        localStorage.setItem('activitiesCacheTimestamp', Date.now().toString());
      } else {
        globalActivitiesCache = [];
      }
    } catch (error) {
      console.error('Errore nel caricamento delle attività:', error);
      // Prova a usare i dati dalla cache se disponibili
      const cache = localStorage.getItem('activitiesCache');
      if (cache) {
        try {
          const data = JSON.parse(cache);
          if (data && data.activities) {
            globalActivitiesCache = data.activities;
          }
        } catch (e) {
          globalActivitiesCache = [];
        }
      } else {
        globalActivitiesCache = [];
      }
    } finally {
      isLoadingActivities = false;
      notifySubscribers();
    }
  }, []);

  // Carica i dati al primo mount
  useEffect(() => {
    loadCategories();
    loadActivities();
  }, [loadCategories, loadActivities]);

  return {
    categories,
    activities,
    loading,
    refetch: () => {
      globalCategoriesCache = null;
      globalActivitiesCache = null;
      loadCategories();
      loadActivities();
    }
  };
}