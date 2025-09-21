import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

// Funzione per analizzare le parole di un messaggio
function analyzeWords(text, messageType = 'user') {
  if (!text || typeof text !== 'string') return [];
  
  // Rimuovi punteggiatura e converti in minuscolo
  const cleanText = text.toLowerCase().replace(/[^\w\s]/g, ' ');
  const words = cleanText.split(/\s+/).filter(word => word.length > 2);
  
  // Parole comuni da escludere (stop words italiane)
  const stopWords = new Set([
    'il', 'lo', 'la', 'le', 'gli', 'un', 'una', 'di', 'da', 'in', 'con', 'su', 'per', 'tra', 'fra',
    'a', 'ad', 'al', 'allo', 'alla', 'alle', 'agli', 'del', 'dello', 'della', 'delle', 'degli',
    'nel', 'nello', 'nella', 'nelle', 'negli', 'sul', 'sullo', 'sulla', 'sulle', 'sugli',
    'e', 'ed', 'o', 'od', 'ma', 'però', 'anche', 'ancora', 'pure', 'tuttavia', 'inoltre',
    'che', 'chi', 'cui', 'dove', 'quando', 'come', 'perché', 'se', 'mentre', 'dopo', 'prima',
    'io', 'tu', 'lui', 'lei', 'noi', 'voi', 'loro', 'mi', 'ti', 'si', 'ci', 'vi', 'lo', 'la', 'li', 'le',
    'mio', 'tuo', 'suo', 'nostro', 'vostro', 'loro', 'questo', 'questa', 'questi', 'queste',
    'quello', 'quella', 'quelli', 'quelle', 'molto', 'poco', 'tanto', 'più', 'meno', 'bene', 'male'
  ]);
  
  return words
    .filter(word => !stopWords.has(word))
    .map((word, index) => ({
      word,
      position: index,
      messageType,
      language: 'it' // Assumiamo italiano per ora
    }));
}

// Funzione semplice per calcolare sentiment (da migliorare con ML)
function calculateSentiment(word) {
  const positiveWords = new Set([
    'bello', 'buono', 'ottimo', 'fantastico', 'perfetto', 'eccellente', 'meraviglioso',
    'felice', 'contento', 'soddisfatto', 'piacevole', 'interessante', 'utile', 'facile'
  ]);
  
  const negativeWords = new Set([
    'brutto', 'cattivo', 'pessimo', 'terribile', 'orribile', 'sbagliato', 'difficile',
    'triste', 'arrabbiato', 'deluso', 'noioso', 'inutile', 'complicato', 'confuso'
  ]);
  
  if (positiveWords.has(word)) return 0.8;
  if (negativeWords.has(word)) return -0.8;
  return 0; // Neutrale
}

export async function POST(request) {
  try {
    const data = await request.json();
    const {
      conversationId,
      sessionId,
      messageText,
      messageType = 'user',
      messageId,
      timestamp
    } = data;

    console.log('📝 Analizzando parole messaggio:', { conversationId, messageType, wordCount: messageText?.split(' ').length });

    if (!messageText || !conversationId) {
      return NextResponse.json({
        success: false,
        message: 'messageText e conversationId sono richiesti'
      }, { status: 400 });
    }

    // Analizza le parole del messaggio
    const words = analyzeWords(messageText, messageType);
    
    // Salva ogni parola nel database
    for (const wordData of words) {
      const sentiment = calculateSentiment(wordData.word);
      
      await sql`
        INSERT INTO conversation_word_analysis (
          conversation_id,
          message_id,
          word,
          word_count,
          word_position,
          sentiment_score,
          language,
          is_keyword,
          category
        ) VALUES (
          ${conversationId},
          ${messageId || null},
          ${wordData.word},
          1,
          ${wordData.position},
          ${sentiment},
          ${wordData.language},
          ${Math.abs(sentiment) > 0.5}, -- È keyword se ha sentiment forte
          ${messageType === 'user' ? 'user_input' : 'assistant_response'}
        )
        ON CONFLICT (conversation_id, word, message_id) 
        DO UPDATE SET 
          word_count = conversation_word_analysis.word_count + 1,
          updated_at = CURRENT_TIMESTAMP
      `;
    }

    return NextResponse.json({
      success: true,
      message: 'Analisi parole completata',
      wordsAnalyzed: words.length
    });

  } catch (error) {
    console.error('❌ Errore nell\'analisi parole:', error);
    return NextResponse.json({
      success: false,
      message: 'Errore nell\'analisi delle parole',
      error: error.message
    }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const timeRange = searchParams.get('timeRange') || '7d';
    const stats = searchParams.get('stats') === 'true';
    const limit = parseInt(searchParams.get('limit')) || 50;

    if (conversationId) {
      // Recupera analisi parole per conversazione specifica
      const wordAnalysis = await sql`
        SELECT 
          word,
          SUM(word_count) as total_count,
          AVG(sentiment_score) as avg_sentiment,
          language,
          category,
          COUNT(DISTINCT message_id) as message_occurrences
        FROM conversation_word_analysis 
        WHERE conversation_id = ${conversationId}
        GROUP BY word, language, category
        ORDER BY total_count DESC
        LIMIT ${limit}
      `;

      // Statistiche sentiment
      const sentimentStats = await sql`
        SELECT 
          AVG(sentiment_score) as avg_sentiment,
          COUNT(CASE WHEN sentiment_score > 0.3 THEN 1 END) as positive_words,
          COUNT(CASE WHEN sentiment_score < -0.3 THEN 1 END) as negative_words,
          COUNT(CASE WHEN sentiment_score BETWEEN -0.3 AND 0.3 THEN 1 END) as neutral_words
        FROM conversation_word_analysis 
        WHERE conversation_id = ${conversationId}
      `;

      return NextResponse.json({
        success: true,
        wordAnalysis,
        sentimentStats: sentimentStats[0]
      });
    }

    if (stats) {
      // Recupera statistiche generali
      const wordStats = await sql`
        SELECT 
          COUNT(DISTINCT word) as unique_words,
          SUM(word_count) as total_words,
          AVG(sentiment_score) as avg_sentiment,
          COUNT(DISTINCT conversation_id) as conversations_analyzed
        FROM conversation_word_analysis
        WHERE created_at >= NOW() - INTERVAL '${timeRange === '24h' ? '1 day' : timeRange === '7d' ? '7 days' : '30 days'}'
      `;

      // Top parole più usate
      const topWords = await sql`
        SELECT 
          word,
          SUM(word_count) as total_count,
          AVG(sentiment_score) as avg_sentiment
        FROM conversation_word_analysis
        WHERE created_at >= NOW() - INTERVAL '${timeRange === '24h' ? '1 day' : timeRange === '7d' ? '7 days' : '30 days'}'
        GROUP BY word
        ORDER BY total_count DESC
        LIMIT 20
      `;

      return NextResponse.json({
        success: true,
        stats: wordStats[0],
        topWords
      });
    }

    return NextResponse.json({
      success: false,
      message: 'Parametri richiesti: conversationId o stats=true'
    }, { status: 400 });

  } catch (error) {
    console.error('❌ Errore recuperando analisi parole:', error);
    return NextResponse.json({
      success: false,
      message: 'Errore nel recupero analisi parole',
      error: error.message
    }, { status: 500 });
  }
}