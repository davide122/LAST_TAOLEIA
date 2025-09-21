import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Parole comuni da escludere dall'analisi
const STOP_WORDS = [
  'il', 'lo', 'la', 'le', 'gli', 'i', 'un', 'una', 'uno', 'di', 'da', 'del', 'della', 'delle', 'dei', 'degli',
  'in', 'con', 'su', 'per', 'tra', 'fra', 'a', 'ad', 'al', 'alla', 'alle', 'ai', 'agli', 'nel', 'nella', 'nelle',
  'nei', 'negli', 'sul', 'sulla', 'sulle', 'sui', 'sugli', 'dal', 'dalla', 'dalle', 'dai', 'dagli', 'col', 'coi',
  'e', 'ed', 'o', 'od', 'ma', 'però', 'anche', 'ancora', 'pure', 'se', 'che', 'chi', 'cui', 'dove', 'quando',
  'come', 'perché', 'mentre', 'quindi', 'poi', 'già', 'più', 'molto', 'poco', 'tanto', 'troppo', 'assai',
  'abbastanza', 'piuttosto', 'così', 'qui', 'qua', 'là', 'lì', 'sopra', 'sotto', 'dentro', 'fuori', 'davanti',
  'dietro', 'prima', 'dopo', 'sempre', 'mai', 'spesso', 'qualche', 'ogni', 'tutto', 'tutti', 'tutte', 'niente',
  'nulla', 'qualcosa', 'qualcuno', 'nessuno', 'altro', 'altri', 'altre', 'stesso', 'stessa', 'stessi', 'stesse',
  'mio', 'mia', 'miei', 'mie', 'tuo', 'tua', 'tuoi', 'tue', 'suo', 'sua', 'suoi', 'sue', 'nostro', 'nostra',
  'nostri', 'nostre', 'vostro', 'vostra', 'vostri', 'vostre', 'loro', 'questo', 'questa', 'questi', 'queste',
  'quello', 'quella', 'quelli', 'quelle', 'essere', 'avere', 'fare', 'dire', 'andare', 'venire', 'stare', 'dare',
  'sapere', 'vedere', 'dovere', 'potere', 'volere', 'bene', 'male', 'meglio', 'peggio', 'sì', 'no', 'non', 'ne',
  'ci', 'vi', 'si', 'mi', 'ti', 'lo', 'la', 'li', 'le', 'gli', 'me', 'te', 'lui', 'lei', 'noi', 'voi', 'loro'
];

// Parole che indicano confusione o blocco
const CONFUSION_WORDS = [
  'non capisco', 'confuso', 'confusa', 'difficile', 'complicato', 'aiuto', 'problema', 'errore',
  'sbagliato', 'sbagliata', 'bloccato', 'bloccata', 'stuck', 'help', 'cosa significa', 'come si fa',
  'non funziona', 'non va', 'perché', 'come mai', 'strano', 'strana', 'weird', 'bug'
];

// Parole positive
const POSITIVE_WORDS = [
  'bene', 'bello', 'bella', 'buono', 'buona', 'ottimo', 'ottima', 'perfetto', 'perfetta', 'fantastico',
  'fantastica', 'eccellente', 'magnifico', 'magnifica', 'meraviglioso', 'meravigliosa', 'grazie',
  'piacere', 'felice', 'contento', 'contenta', 'soddisfatto', 'soddisfatta', 'great', 'good', 'nice',
  'perfect', 'excellent', 'amazing', 'wonderful', 'fantastic', 'awesome', 'love', 'like'
];

// Parole negative
const NEGATIVE_WORDS = [
  'male', 'brutto', 'brutta', 'cattivo', 'cattiva', 'pessimo', 'pessima', 'terribile', 'orribile',
  'disgustoso', 'disgustosa', 'noioso', 'noiosa', 'frustrante', 'irritante', 'arrabbiato', 'arrabbiata',
  'triste', 'deluso', 'delusa', 'insoddisfatto', 'insoddisfatta', 'bad', 'terrible', 'awful', 'horrible',
  'disgusting', 'boring', 'frustrating', 'annoying', 'angry', 'sad', 'disappointed', 'hate', 'dislike'
];

function analyzeText(text) {
  if (!text) return { words: [], sentiment: 'neutral', confusion_indicators: 0 };
  
  // Normalizza il testo
  const normalizedText = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Estrai le parole
  const words = normalizedText.split(' ')
    .filter(word => word.length > 2 && !STOP_WORDS.includes(word));
  
  // Conta le parole
  const wordCount = {};
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });
  
  // Analisi del sentiment
  let positiveScore = 0;
  let negativeScore = 0;
  let confusionScore = 0;
  
  words.forEach(word => {
    if (POSITIVE_WORDS.includes(word)) positiveScore++;
    if (NEGATIVE_WORDS.includes(word)) negativeScore++;
  });
  
  // Controlla frasi di confusione
  CONFUSION_WORDS.forEach(phrase => {
    if (normalizedText.includes(phrase)) confusionScore++;
  });
  
  let sentiment = 'neutral';
  if (positiveScore > negativeScore) sentiment = 'positive';
  else if (negativeScore > positiveScore) sentiment = 'negative';
  
  return {
    words: Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 50),
    sentiment,
    confusion_indicators: confusionScore,
    positive_score: positiveScore,
    negative_score: negativeScore
  };
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    
    if (!conversationId) {
      return NextResponse.json(
        { success: false, message: 'conversationId è richiesto' },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    
    try {
      // Recupera tutti i messaggi della conversazione
      const messagesQuery = `
        SELECT 
          id,
          role,
          content,
          timestamp,
          metadata
        FROM messages 
        WHERE conversation_id = $1
        ORDER BY timestamp ASC
      `;
      
      const messagesResult = await client.query(messagesQuery, [conversationId]);
      
      // Analizza i messaggi dell'utente
      const userMessages = messagesResult.rows.filter(msg => msg.role === 'user');
      const assistantMessages = messagesResult.rows.filter(msg => msg.role === 'assistant');
      
      let allUserText = '';
      let allAssistantText = '';
      let messageAnalysis = [];
      let totalConfusionIndicators = 0;
      let sentimentProgression = [];
      
      // Analizza ogni messaggio utente
      userMessages.forEach((msg, index) => {
        const analysis = analyzeText(msg.content);
        allUserText += ' ' + msg.content;
        totalConfusionIndicators += analysis.confusion_indicators;
        
        messageAnalysis.push({
          message_id: msg.id,
          timestamp: msg.timestamp,
          word_count: msg.content.split(' ').length,
          top_words: analysis.words.slice(0, 10),
          sentiment: analysis.sentiment,
          confusion_indicators: analysis.confusion_indicators,
          positive_score: analysis.positive_score,
          negative_score: analysis.negative_score
        });
        
        sentimentProgression.push({
          message_index: index + 1,
          timestamp: msg.timestamp,
          sentiment: analysis.sentiment,
          positive_score: analysis.positive_score,
          negative_score: analysis.negative_score
        });
      });
      
      // Analizza tutto il testo dell'utente
      const overallUserAnalysis = analyzeText(allUserText);
      
      // Analizza i messaggi dell'assistente per lunghezza e complessità
      assistantMessages.forEach(msg => {
        allAssistantText += ' ' + msg.content;
      });
      
      const overallAssistantAnalysis = analyzeText(allAssistantText);
      
      // Calcola statistiche temporali
      const conversationDuration = userMessages.length > 1 ? 
        new Date(userMessages[userMessages.length - 1].timestamp) - new Date(userMessages[0].timestamp) : 0;
      
      const avgTimeBetweenMessages = userMessages.length > 1 ?
        conversationDuration / (userMessages.length - 1) : 0;
      
      // Identifica pattern di ripetizione
      const repeatedWords = overallUserAnalysis.words.filter(([word, count]) => count >= 3);
      
      // Analizza la complessità del linguaggio
      const avgWordsPerMessage = userMessages.reduce((sum, msg) => 
        sum + msg.content.split(' ').length, 0) / userMessages.length;
      
      const uniqueWords = new Set(allUserText.toLowerCase().split(/\s+/)).size;
      const totalWords = allUserText.split(/\s+/).length;
      const vocabularyRichness = totalWords > 0 ? uniqueWords / totalWords : 0;
      
      return NextResponse.json({
        success: true,
        wordAnalysis: {
          overall_stats: {
            total_user_messages: userMessages.length,
            total_assistant_messages: assistantMessages.length,
            conversation_duration_ms: conversationDuration,
            avg_time_between_messages_ms: avgTimeBetweenMessages,
            avg_words_per_message: Math.round(avgWordsPerMessage * 100) / 100,
            total_words: totalWords,
            unique_words: uniqueWords,
            vocabulary_richness: Math.round(vocabularyRichness * 100) / 100,
            total_confusion_indicators: totalConfusionIndicators
          },
          user_analysis: {
            top_words: overallUserAnalysis.words,
            overall_sentiment: overallUserAnalysis.sentiment,
            positive_score: overallUserAnalysis.positive_score,
            negative_score: overallUserAnalysis.negative_score,
            repeated_words: repeatedWords
          },
          assistant_analysis: {
            top_words: overallAssistantAnalysis.words.slice(0, 20),
            avg_response_length: Math.round(allAssistantText.length / assistantMessages.length)
          },
          message_analysis: messageAnalysis,
          sentiment_progression: sentimentProgression,
          patterns: {
            confusion_trend: messageAnalysis.map(m => ({
              timestamp: m.timestamp,
              confusion_level: m.confusion_indicators
            })),
            sentiment_changes: sentimentProgression.filter((curr, index, arr) => 
              index === 0 || curr.sentiment !== arr[index - 1].sentiment
            )
          }
        }
      });
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Errore nell\'analisi delle parole:', error);
    return NextResponse.json(
      { success: false, message: 'Errore interno del server', error: error.message },
      { status: 500 }
    );
  }
}