// src/app/api/open-menu/route.js

import { NextResponse } from 'next/server';
export const runtime = 'nodejs';

export async function POST(req) {
  try {
    const { category, recommendations } = await req.json();
    
    // Validazione dei parametri
    if (!category) {
      return NextResponse.json(
        { error: 'Categoria non specificata' },
        { status: 400 }
      );
    }
    
    if (!recommendations || !Array.isArray(recommendations) || recommendations.length === 0) {
      return NextResponse.json(
        { error: 'Raccomandazioni non specificate o non valide' },
        { status: 400 }
      );
    }
    
    // Prepara la risposta
    const result = {
      category,
      recommendations,
      timestamp: new Date().toISOString(),
      type: 'menu'
    };
    
    return NextResponse.json(result);
  } catch (err) {
    console.error('Errore open-menu:', err);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}