"use client";

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from '../components/backoffice/Sidebar';

export default function BackofficeLayout({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Salta il controllo dell'autenticazione per la pagina di login
    if (pathname === '/backoffice/login') {
      setIsLoading(false);
      return;
    }

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
  }, [router, pathname]);

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

  // Non mostrare la sidebar nella pagina di login
  if (pathname === '/backoffice/login') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#082c33] to-[#1E4E68] text-[#FEF5E7] flex">
      <Sidebar />
      <main className="flex-1 min-h-screen transition-all duration-300 ease-in-out p-8">
        <div className="">
          {children}
        </div>
      </main>
    </div>
  );
}