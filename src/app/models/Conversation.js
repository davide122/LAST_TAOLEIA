import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant', 'tool', 'error'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  }
});

const conversationSchema = new mongoose.Schema({
  threadId: {
    type: String,
    required: true,
    index: true
  },
  language: {
    type: String,
    required: true,
    index: true
  },
  startTime: {
    type: Date,
    default: Date.now,
    index: true
  },
  endTime: {
    type: Date
  },
  messages: [messageSchema],
  metadata: {
    userAgent: String,
    ipAddress: String,
    sessionId: String,
    deviceInfo: {
      type: Map,
      of: mongoose.Schema.Types.Mixed
    }
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'error'],
    default: 'active'
  },
  errorLogs: [{
    timestamp: Date,
    error: String,
    context: mongoose.Schema.Types.Mixed
  }],
  performance: {
    responseTime: Number,
    messageCount: Number,
    errorCount: Number
  }
});

// Indici per ottimizzare le query
conversationSchema.index({ startTime: -1 });
conversationSchema.index({ language: 1, startTime: -1 });
conversationSchema.index({ status: 1, startTime: -1 });

// Metodi del modello
conversationSchema.methods.addMessage = async function(message) {
  this.messages.push(message);
  this.performance.messageCount = (this.performance.messageCount || 0) + 1;
  return this.save();
};

conversationSchema.methods.logError = async function(error, context = {}) {
  this.errorLogs.push({
    timestamp: new Date(),
    error: error.message || error,
    context
  });
  this.performance.errorCount = (this.performance.errorCount || 0) + 1;
  return this.save();
};

conversationSchema.methods.complete = async function() {
  this.endTime = new Date();
  this.status = 'completed';
  this.performance.responseTime = this.endTime - this.startTime;
  return this.save();
};

const Conversation = mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema);

export default Conversation; 