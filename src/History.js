const mongoose = require('mongoose');
const crypto = require('crypto');

// Convert the key to exactly 32 bytes
const getKey = () => {
  const key = process.env.ENCRYPTION_KEY || '12345678901234567890123456789012';
  return Buffer.from(key.padEnd(32, '0').slice(0, 32));
};

const ENCRYPTION_KEY = getKey();
const IV_LENGTH = 16;

// Encryption Function
const encrypt = (text) => {
  if (!text) return text; // Handle empty values
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text.toString(), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error);
    return text; // Return original text if encryption fails
  }
};

// Decryption Function
const decrypt = (text) => {
  if (!text || !text.includes(':')) return text; // Handle empty or unencrypted values
  try {
    const [ivHex, encryptedHex] = text.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return text; // Return original text if decryption fails
  }
};

const historySchema = new mongoose.Schema({
  aadhaarNumber: { type: String, required: true },
  sourceText: { type: String, default: '' },
  translatedText: { type: String, default: '' },
  sourceLang: { type: String, default: '' },
  targetLang: { type: String, default: '' },
  diseases: [{
    disease: String,
    duration: String
  }],
  prescription: { type: String, required: true },
  symptoms: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  conversations: [{
    speaker: { type: String, enum: ['doctor', 'patient'] },
    originalText: String,
    translatedText: String,
    sourceLang: String,
    targetLang: String,
    timestamp: { type: Date, default: Date.now }
  }],
  summary: { type: String, default: '' }
});

// Pre-save middleware to encrypt sensitive data
historySchema.pre('save', function(next) {
  try {
    if (this.isModified('aadhaarNumber')) {
      this.aadhaarNumber = encrypt(this.aadhaarNumber);
    }
    if (this.isModified('prescription')) {
      this.prescription = encrypt(this.prescription);
    }
    if (this.isModified('symptoms')) {
      this.symptoms = encrypt(this.symptoms);
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Method to get decrypted data
historySchema.methods.getDecryptedData = function() {
  try {
    return {
      id: this._id,
      aadhaarNumber: decrypt(this.aadhaarNumber),
      sourceText: this.sourceText || '',
      translatedText: this.translatedText || '',
      sourceLang: this.sourceLang || '',
      targetLang: this.targetLang || '',
      diseases: this.diseases || [],
      prescription: decrypt(this.prescription),
      symptoms: decrypt(this.symptoms),
      timestamp: this.timestamp
    };
  } catch (error) {
    console.error('Error decrypting data:', error);
    return this;
  }
};

// Add this to your schema methods
historySchema.statics.encrypt = encrypt;

module.exports = mongoose.model('History', historySchema); 