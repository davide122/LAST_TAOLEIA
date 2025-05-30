"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiActivity, FiUsers, FiMail, FiMap, FiLogOut, FiHome, FiSettings, FiHelpCircle, FiGlobe } from 'react-icons/fi';

export default function BackofficePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('dashboard');
  const router = useRouter();

  useEffect(() => {
    // Verifica se l'utente è autenticato
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check', {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          // Reindirizza alla pagina di login se non autenticato
          router.push('/backoffice/login');
        }
      } catch (error) {
        console.error('Errore nella verifica dell\'autenticazione:', error);
        router.push('/backoffice/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#082c33] to-[#1E4E68]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#FEF5E7] border-t-transparent"></div>
          <p className="text-[#FEF5E7] font-medium">Caricamento...</p>
        </div>
      </div>
    );
  }

  const menuItems = [
    { id: 'activities', label: 'Attività', icon: FiActivity, href: '/backoffice/activities' },
    { id: 'users', label: 'Utenti', icon: FiUsers, href: '/backoffice/users' },
    { id: 'emails', label: 'Email', icon: FiMail, href: '/backoffice/emails' },
    { id: 'itineraries', label: 'Itinerari', icon: FiMap, href: '/backoffice/itineraries' },
    { id: 'translations', label: 'Traduzioni', icon: FiGlobe, href: '/backoffice/translations' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#082c33] to-[#1E4E68] text-[#FEF5E7]">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-[#1E4E68]/80 backdrop-blur-sm border-r border-[#FEF5E7]/20">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-[#FEF5E7] mb-8">Taoleila</h1>
          <nav className="space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  activeSection === item.id
                    ? 'bg-[#FEF5E7] text-[#1E4E68]'
                    : 'text-[#FEF5E7] hover:bg-[#FEF5E7]/10'
                }`}
                onClick={() => setActiveSection(item.id)}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <button
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' });
              router.push('/backoffice/login');
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#FEF5E7] hover:bg-[#FEF5E7]/10 transition-all"
          >
            <FiLogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className=" p-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {menuItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="block group"
                onClick={() => setActiveSection(item.id)}
              >
                <div className="bg-[#FEF5E7]/10 backdrop-blur-sm rounded-3xl p-6 border border-[#FEF5E7]/20 hover:bg-[#FEF5E7]/20 transition-all duration-300 transform hover:scale-[1.02]">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 rounded-xl bg-[#FEF5E7]/10">
                      <item.icon className="w-6 h-6 text-[#FEF5E7]" />
                    </div>
                    <h2 className="text-xl font-semibold text-[#FEF5E7]">{item.label}</h2>
                  </div>
                  <p className="text-[#FEF5E7]/80">
                    {item.id === 'activities' && 'Aggiungi, modifica ed elimina le attività disponibili nel sistema.'}
                    {item.id === 'users' && 'Amministra gli utenti registrati nel sistema.'}
                    {item.id === 'emails' && 'Monitora le email inviate e gestisci le newsletter.'}
                    {item.id === 'itineraries' && 'Crea e gestisci itinerari personalizzati con timeline delle attività.'}
                    {item.id === 'translations' && 'Gestisci le traduzioni delle categorie e visualizza le traduzioni esistenti.'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}