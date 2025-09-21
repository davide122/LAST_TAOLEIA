import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

// GET - Recupera le schede di una conversazione
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json({
        success: false,
        message: 'conversationId è richiesto'
      }, { status: 400 });
    }

    // Recupera solo i messaggi tool (schede) della conversazione
    const cards = await sql`
      SELECT 
        id,
        content,
        metadata,
        timestamp
      FROM conversation_messages 
      WHERE conversation_id = ${conversationId} 
        AND role = 'tool'
      ORDER BY timestamp ASC
    `;

    // Formatta i dati delle schede
    const formattedCards = cards.map(card => {
      const metadata = card.metadata || {};
      const cardData = metadata.cardData || {};
      
      return {
        id: card.id,
        type: metadata.toolType || 'unknown',
        name: cardData.name || cardData.category || 'Scheda senza nome',
        description: cardData.description || '',
        address: cardData.address || '',
        category: cardData.category || cardData.type || '',
        recommendations: cardData.recommendations || [],
        content: card.content || '',
        timestamp: card.timestamp,
        metadata: metadata
      };
    });

    return NextResponse.json({
      success: true,
      cards: formattedCards,
      total: formattedCards.length
    });

  } catch (error) {
    console.error('Errore nel recupero schede:', error);
    return NextResponse.json({
      success: false,
      message: 'Errore interno del server',
      error: error.message
    }, { status: 500 });
  }
}