'use client';

import { useState, useEffect } from 'react';

// Hook per gestire i dati offline utilizzando IndexedDB
export function useOfflineData() {
  const [db, setDb] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Inizializza il database IndexedDB
  useEffect(() => {
    const initDb = async () => {
      try {
        if (!window.indexedDB) {
          throw new Error('Il tuo browser non supporta IndexedDB');
        }
        
        const request = window.indexedDB.open('TaoleiaOfflineDB', 1);
        
        request.onerror = (event) => {
          setError('Errore durante apertura del database: ' + event.target.errorCode);
          setIsLoading(false);
        };
        
        request.onsuccess = (event) => {
          const database = event.target.result;
          setDb(database);
          setIsLoading(false);
        };
        
        request.onupgradeneeded = (event) => {
          const database = event.target.result;
          
          // Crea gli object store necessari
          if (!database.objectStoreNames.contains('messages')) {
            database.createObjectStore('messages', { keyPath: 'id' });
          }
          
          if (!database.objectStoreNames.contains('activities')) {
            database.createObjectStore('activities', { keyPath: 'id' });
          }
          
          if (!database.objectStoreNames.contains('categories')) {
            database.createObjectStore('categories', { keyPath: 'id' });
          }
        };
      } catch (err) {
        setError(err.message);
        setIsLoading(false);
      }
    };
    
    initDb();
    
    return () => {
      // Chiudi la connessione al database quando il componente viene smontato
      if (db) {
        db.close();
      }
    };
  }, []);
  
  // Funzione per salvare un messaggio nella coda offline
  const saveMessageToQueue = async (message) => {
    if (!db) return null;
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(['messages'], 'readwrite');
        const store = transaction.objectStore('messages');
        
        // Aggiungi un ID e un timestamp se non esistono
        const messageToSave = {
          ...message,
          id: message.id || Date.now().toString(),
          timestamp: message.timestamp || new Date().toISOString()
        };
        
        const request = store.add(messageToSave);
        
        request.onsuccess = () => resolve(messageToSave);
        request.onerror = (event) => reject(event.target.error);
      } catch (err) {
        reject(err);
      }
    });
  };
  
  // Funzione per recuperare tutti i messaggi dalla coda
  const getMessagesQueue = async () => {
    if (!db) return [];
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(['messages'], 'readonly');
        const store = transaction.objectStore('messages');
        const request = store.getAll();
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(event.target.error);
      } catch (err) {
        reject(err);
      }
    });
  };
  
  // Funzione per rimuovere un messaggio dalla coda
  const removeMessageFromQueue = async (messageId) => {
    if (!db) return false;
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(['messages'], 'readwrite');
        const store = transaction.objectStore('messages');
        const request = store.delete(messageId);
        
        request.onsuccess = () => resolve(true);
        request.onerror = (event) => reject(event.target.error);
      } catch (err) {
        reject(err);
      }
    });
  };
  
  // Funzione per salvare un'attività nella cache offline
  const saveActivity = async (activity) => {
    if (!db) return null;
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(['activities'], 'readwrite');
        const store = transaction.objectStore('activities');
        const request = store.put(activity);
        
        request.onsuccess = () => resolve(activity);
        request.onerror = (event) => reject(event.target.error);
      } catch (err) {
        reject(err);
      }
    });
  };
  
  // Funzione per recuperare un'attività dalla cache offline
  const getActivity = async (activityId) => {
    if (!db) return null;
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(['activities'], 'readonly');
        const store = transaction.objectStore('activities');
        const request = store.get(activityId);
        
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = (event) => reject(event.target.error);
      } catch (err) {
        reject(err);
      }
    });
  };
  
  // Funzione per salvare categorie nella cache offline
  const saveCategories = async (categories) => {
    if (!db) return false;
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(['categories'], 'readwrite');
        const store = transaction.objectStore('categories');
        
        // Salva ogni categoria
        const promises = categories.map(category => {
          return new Promise((res, rej) => {
            const request = store.put(category);
            request.onsuccess = () => res(true);
            request.onerror = (event) => rej(event.target.error);
          });
        });
        
        Promise.all(promises)
          .then(() => resolve(true))
          .catch(err => reject(err));
      } catch (err) {
        reject(err);
      }
    });
  };
  
  // Funzione per recuperare tutte le categorie dalla cache offline
  const getCategories = async () => {
    if (!db) return [];
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(['categories'], 'readonly');
        const store = transaction.objectStore('categories');
        const request = store.getAll();
        
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = (event) => reject(event.target.error);
      } catch (err) {
        reject(err);
      }
    });
  };
  
  return {
    isLoading,
    error,
    saveMessageToQueue,
    getMessagesQueue,
    removeMessageFromQueue,
    saveActivity,
    getActivity,
    saveCategories,
    getCategories
  };
}