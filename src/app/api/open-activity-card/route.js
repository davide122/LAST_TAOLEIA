// src/app/api/open-activity-card/route.js

import { NextResponse } from 'next/server';
import pool from '../../../utils/db';
export const runtime = 'nodejs';
const activityCache = new Map();

export async function POST(req) {
  try {
    const { query, lang = 'it' } = await req.json();
    const cacheKey = `${query}_${lang}`;
    const now = Date.now();
    
    if (activityCache.has(cacheKey)) {
      const { timestamp, data } = activityCache.get(cacheKey);
      if (now - timestamp < 5 * 60_000) {
        return NextResponse.json(data);
      }
    }
    
    const client = await pool.connect();
    try {
      // 1) Recupera l'attività con traduzioni se disponibili
      const { rows: actRows } = await client.query(
        `
        SELECT
          a.id,
          COALESCE(t.name, a.name) as name,
          a.email,
          COALESCE(t.menu, a.menu) as menu,
          COALESCE(t.prices, a.prices) as prices,
          a.address,
          a.phone_number,
          a.website,
          COALESCE(t.description, a.description) as description,
          a.category,
          a.google_maps_url,
          COALESCE(t.audio_guide_text, a.audio_guide_text) as audio_guide_text,
          a.updated_at,
          a.offers,
          a.specialties,
          a.proposals,
          a.ticket_info,
          a.opening_hours
        FROM activities a
        LEFT JOIN activity_translations t ON a.id = t.activity_id AND t.language_code = $1
        WHERE a.name        ILIKE $2
           OR a.description ILIKE $2
        LIMIT 1
        `,
        [lang, `%${query}%`]
      );

      if (actRows.length === 0) {
        return NextResponse.json(
          { message: `Mi spiace, non ho trovato nulla su '${query}'.` },
          { status: 404 }
        );
      }
      const activity = actRows[0];

      // 2) Recupera le immagini correlate
      const { rows: imgRows } = await client.query(
        `
        SELECT
          image_url,
          description,
          is_main
        FROM activity_images
        WHERE activity_id = $1
        ORDER BY is_main DESC, id ASC
        `,
        [activity.id]
      );

      const images = imgRows.map(img => ({
        url:  img.image_url,
        alt:  img.description,
        main: img.is_main
      }));

      // 3) Salva nella cache e restituisci attività + immagini
      const result = {
        ...activity,
        images,
        language_code: lang
      };
      
      activityCache.set(cacheKey, {
        timestamp: now,
        data: result
      });
      
      return NextResponse.json(result);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Errore open-activity-card:', err);
    return NextResponse.json(
      { error: "Errore durante la ricerca dell'attività" },
      { status: 500 }
    );
  }
}
