"use client";

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { FiActivity, FiUsers, FiMail, FiMap, FiLogOut, FiHome, FiMenu, FiX, FiMessageSquare, FiSearch } from 'react-icons/fi';

const Sidebar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Chiudi il menu mobile quando cambia il percorso
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Gestisci il ridimensionamento della finestra
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: FiHome, href: '/backoffice' },
    { id: 'activities', label: 'Attività', icon: FiActivity, href: '/backoffice/activities' },
    { id: 'users', label: 'Utenti', icon: FiUsers, href: '/backoffice/users' },
    { id: 'emails', label: 'Email', icon: FiMail, href: '/backoffice/emails' },
    { id: 'itineraries', label: 'Itinerari', icon: FiMap, href: '/backoffice/itineraries' },
    { id: 'conversations', label: 'Conversazioni', icon: FiMessageSquare, href: '/backoffice/conversations' },
    { id: 'keywords', label: 'Parole Chiave', icon: FiSearch, href: '/backoffice/keywords' },
  ];

  const isActive = (href) => {
    if (href === '/backoffice') {
      return pathname === '/backoffice';
    }
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/backoffice/login';
    } catch (error) {
      console.error('Errore durante il logout:', error);
    }
  };

  return (
    <>
      {/* Pulsante menu mobile */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 bg-[#1E4E68] text-[#FEF5E7] rounded-xl shadow-lg hover:bg-[#1E4E68]/90 transition-all"
          aria-label={isMobileMenuOpen ? 'Chiudi menu' : 'Apri menu'}
        >
          {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>

      {/* Overlay per mobile */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed left-0 top-0 h-full bg-[#1E4E68]/95 backdrop-blur-lg border-r border-[#FEF5E7]/20 z-40 transition-transform duration-300 ease-in-out shadow-xl ${isMobileMenuOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full md:translate-x-0'}`}
      >
        <div className="p-6">
          <h1 className="text-2xl font-bold text-[#FEF5E7] mb-8">Taoleila</h1>
          <nav className="space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive(item.href) ? 'bg-[#FEF5E7] text-[#1E4E68]' : 'text-[#FEF5E7] hover:bg-[#FEF5E7]/10'}`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#FEF5E7] hover:bg-[#FEF5E7]/10 transition-all"
          >
            <FiLogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Spazio per il contenuto principale (solo su desktop) */}
      <div className="hidden md:block w-64"></div>
    </>
  );
};

export default Sidebar;