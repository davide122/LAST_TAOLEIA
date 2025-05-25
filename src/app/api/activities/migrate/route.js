import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const sql = neon(process.env.DATABASE_URL);

export async function POST(req) {
  try {
    // Verifica il token di sicurezza (puoi implementare la tua logica di autenticazione)
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Non autorizzato' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    if (token !== process.env.MIGRATION_TOKEN) {
      return NextResponse.json(
        { success: false, message: 'Token non valido' },
        { status: 401 }
      );
    }

    // Leggi il file di migrazione
    const migrationPath = path.join(process.cwd(), 'src/app/api/activities/migration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Esegui la migrazione
    await sql`${migrationSQL}`;

    return NextResponse.json({ 
      success: true, 
      message: 'Migrazione completata con successo' 
    });
  } catch (error) {
    console.error('Errore durante la migrazione:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
} 