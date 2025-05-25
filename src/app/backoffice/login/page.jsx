"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        // Reindirizza al backoffice dopo il login
        router.push('/backoffice');
      } else {
        setError(data.error || 'Errore durante il login');
      }
    } catch (error) {
      setError('Errore di connessione al server');
      console.error('Errore durante il login:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#082c33] px-4">
      <div className="w-full max-w-md bg-[#FEF5E7] rounded-3xl shadow-2xl p-8 border border-[#1E4E68]/20">
        <h1 className="text-3xl font-bold text-center text-[#1E4E68] mb-8">Accesso Backoffice</h1>
        
        {error && (
          <div className="bg-[#F15525]/80 text-[#FEF5E7] p-3 rounded-full mb-4 font-medium">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#1E4E68] mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-[#FEF5E7] border border-[#1E4E68]/20 rounded-full focus:outline-none focus:ring-2 focus:ring-[#79424f] text-[#1E4E68] placeholder-[#1E4E68]/40"
              placeholder="nome@esempio.com"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[#1E4E68] mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-[#FEF5E7] border border-[#1E4E68]/20 rounded-full focus:outline-none focus:ring-2 focus:ring-[#79424f] text-[#1E4E68] placeholder-[#1E4E68]/40"
              placeholder="••••••••"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 rounded-full font-medium text-[#FEF5E7] bg-[#79424f] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#79424f] transition ring-2 ring-[#FEF5E7] ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Accesso in corso...' : 'Accedi'}
          </button>
        </form>
      </div>
    </div>
  );
}