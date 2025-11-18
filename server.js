require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const History = require('./models/History');

const app = express();

// Middleware
app.use(express.json());

const allowedOrigins = ['http://localhost:3000', 'http://localhost:5000'];

app.use(cors({
  origin: function(origin, callback) {
    // allow requests with no origin (mobile apps, curl, postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  credentials: true
}));

// handle preflight for all routes
app.options('*', cors());

// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied' });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid token' });
  }
};

// Admin Authentication Middleware
const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied' });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    if (!verified.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    req.user = verified;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid token' });
  }
};

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Schemas
const AdminSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const DoctorSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  name: String,
  specialization: String,
  createdAt: { type: Date, default: Date.now }
});

const Admin = mongoose.model('Admin', AdminSchema);
const Doctor = mongoose.model('Doctor', DoctorSchema);

// Admin Routes
app.post('/api/admin/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ error: 'Admin already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new admin
    const admin = new Admin({
      email,
      password: hashedPassword
    });

    await admin.save();
    res.status(201).json({ message: 'Admin created successfully' });
  } catch (error) {
    console.error('Admin signup error:', error);
    res.status(500).json({ error: 'Failed to create admin' });
  }
});

app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, admin.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: admin._id, email: admin.email, isAdmin: true },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, email: admin.email });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Doctor Routes
app.post('/api/admin/add-doctor', authenticateAdmin, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if doctor already exists
    const existingDoctor = await Doctor.findOne({ email });
    if (existingDoctor) {
      return res.status(400).json({ error: 'Doctor already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new doctor
    const doctor = new Doctor({
      email,
      password: hashedPassword
    });

    await doctor.save();
    res.status(201).json({ message: 'Doctor added successfully' });
  } catch (error) {
    console.error('Add doctor error:', error);
    res.status(500).json({ error: 'Failed to add doctor' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const doctor = await Doctor.findOne({ email });

    if (!doctor) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, doctor.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: doctor._id, email: doctor.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      doctor: {
        id: doctor._id,
        email: doctor.email,
        name: doctor.name,
        specialization: doctor.specialization
      }
    });
  } catch (error) {
    console.error('Doctor login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Add this route to validate tokens
app.get('/api/validate-token', authenticateToken, (req, res) => {
  res.json({ valid: true });
});

// Update history routes
app.get('/api/history', authenticateToken, async (req, res) => {
  try {
    const histories = await History.find().sort({ timestamp: -1 });
    const decryptedHistories = histories.map(history => {
      try {
        return history.getDecryptedData();
      } catch (error) {
        console.error('Error decrypting history:', error);
        return history;
      }
    });
    res.json(decryptedHistories);
  } catch (error) {
    console.error('History fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

app.post('/api/history', authenticateToken, async (req, res) => {
  try {
    const {
      aadhaarNumber,
      sourceText,
      translatedText,
      sourceLang,
      targetLang,
      diseases,
      prescription,
      symptoms
    } = req.body;

    // Validate required fields
    if (!aadhaarNumber || !prescription || !symptoms) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const history = new History({
      aadhaarNumber,
      sourceText: sourceText || '',
      translatedText: translatedText || '',
      sourceLang: sourceLang || '',
      targetLang: targetLang || '',
      diseases: diseases || [],
      prescription,
      symptoms
    });

    await history.save();
    res.status(201).json({ message: 'History saved successfully' });
  } catch (error) {
    console.error('History save error:', error);
    res.status(500).json({ error: 'Failed to save history', details: error.message });
  }
});

// Update the search route
app.get('/api/history/search/:aadhaar', authenticateToken, async (req, res) => {
  try {
    const aadhaarNumber = req.params.aadhaar;
    
    // Find all histories and decrypt to compare
    const allHistories = await History.find().sort({ timestamp: -1 });
    
    // Filter histories where decrypted Aadhaar matches the search
    const matchingHistories = allHistories.filter(history => {
      const decryptedData = history.getDecryptedData();
      return decryptedData.aadhaarNumber === aadhaarNumber;
    });

    if (matchingHistories.length === 0) {
      return res.status(404).json({ error: 'No records found for this Aadhaar number' });
    }

    // Return decrypted matching histories
    const decryptedHistories = matchingHistories.map(history => history.getDecryptedData());
    res.json(decryptedHistories);
  } catch (error) {
    console.error('History search error:', error);
    res.status(500).json({ error: 'Failed to search history' });
  }
});

// Add conversation to history
app.post('/api/history/:aadhaar/conversation', authenticateToken, async (req, res) => {
  try {
    const { aadhaar } = req.params;
    const { speaker, originalText, translatedText, sourceLang, targetLang } = req.body;

    const history = await History.findOne({ aadhaarNumber: aadhaar });
    if (!history) {
      return res.status(404).json({ error: 'History not found' });
    }

    history.conversations.push({
      speaker,
      originalText,
      translatedText,
      sourceLang,
      targetLang
    });

    await history.save();
    res.status(201).json({ message: 'Conversation saved successfully' });
  } catch (error) {
    console.error('Save conversation error:', error);
    res.status(500).json({ error: 'Failed to save conversation' });
  }
});

// Analytics Routes
app.get('/api/analytics/dashboard', authenticateToken, async (req, res) => {
  try {
    // Total counts
    const totalConsultations = await History.countDocuments();
    const totalDoctors = await Doctor.countDocuments();
    const totalPatients = await User.countDocuments({ role: 'patient' });
    const totalAdmins = await Admin.countDocuments();

    // Consultations by day (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const consultationsByDay = await History.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          date: '$_id',
          count: 1,
          _id: 0,
        },
      },
    ]);

    // Disease frequency
    const diseaseFrequency = await History.aggregate([
      { $unwind: '$diseases' },
      {
        $group: {
          _id: '$diseases',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 8 },
      {
        $project: {
          disease: '$_id',
          count: 1,
          _id: 0,
        },
      },
    ]);

    // Symptom frequency
    const symptomFrequency = await History.aggregate([
      { $unwind: '$symptoms' },
      {
        $group: {
          _id: '$symptoms',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $project: {
          symptom: '$_id',
          count: 1,
          _id: 0,
        },
      },
    ]);

    // Language preference
    const languagePreference = await History.aggregate([
      {
        $group: {
          _id: '$patientLanguage',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      {
        $project: {
          language: '$_id',
          count: 1,
          _id: 0,
        },
      },
    ]);

    // Doctor performance
    const doctorPerformance = await History.aggregate([
      {
        $group: {
          _id: '$doctorId',
          doctorName: { $first: '$doctorName' },
          consultationCount: { $sum: 1 },
          averageRating: { $avg: '$rating' },
        },
      },
      { $sort: { consultationCount: -1 } },
      { $limit: 10 },
      {
        $project: {
          _id: 0,
          doctorName: 1,
          consultationCount: 1,
          averageRating: 1,
        },
      },
    ]);

    // Prescription verification
    const prescriptionVerification = await History.aggregate([
      {
        $group: {
          _id: '$prescriptionStatus',
          count: { $sum: 1 },
        },
      },
    ]);

    const prescriptionStats = {
      approved: 0,
      caution: 0,
      rejected: 0,
    };

    prescriptionVerification.forEach(item => {
      if (item._id === 'approved') prescriptionStats.approved = item.count;
      if (item._id === 'caution') prescriptionStats.caution = item.count;
      if (item._id === 'rejected') prescriptionStats.rejected = item.count;
    });

    // Age distribution
    const ageDistribution = await User.aggregate([
      {
        $bucket: {
          groupBy: '$age',
          boundaries: [0, 18, 35, 50, 65, 120],
          default: 'Unknown',
          output: {
            count: { $sum: 1 },
          },
        },
      },
      {
        $project: {
          ageGroup: {
            $switch: {
              branches: [
                { case: { $eq: ['$_id', 0] }, then: '0-18' },
                { case: { $eq: ['$_id', 18] }, then: '18-35' },
                { case: { $eq: ['$_id', 35] }, then: '35-50' },
                { case: { $eq: ['$_id', 50] }, then: '50-65' },
                { case: { $eq: ['$_id', 65] }, then: '65+' },
              ],
              default: 'Unknown',
            },
          },
          count: 1,
          _id: 0,
        },
      },
    ]);

    res.json({
      totalConsultations,
      totalDoctors,
      totalPatients,
      totalAdmins,
      consultationsByDay,
      diseaseFrequency,
      symptomFrequency,
      languagePreference,
      doctorPerformance,
      prescriptionVerification: prescriptionStats,
      ageDistribution,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics data' });
  }
});

// Start Server
const PORT = process.env.BACKEND_PORT || process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
