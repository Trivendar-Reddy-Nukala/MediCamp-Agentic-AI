require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = express.Router();

const app = express();



// Middleware
app.use(express.json());
app.use(cors({ origin: "http://localhost:3000" }));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("MongoDB connection error:", err));

app.get('/',(req,res)=>{
  console.log("Hello World");
  res.send("Hello World");
})

// Schemas
const DoctorSchema = new mongoose.Schema({
  doctorId: { type: String, unique: true, required: true },
  password: { type: String, required: true },
});

const AdminSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
});

const AuthorizedDoctorSchema = new mongoose.Schema({
  doctorId: { type: String, unique: true, required: true },
});

const Doctor = mongoose.model("Doctor", DoctorSchema);
const Admin = mongoose.model("Admin", AdminSchema);
const AuthorizedDoctor = mongoose.model("AuthorizedDoctor", AuthorizedDoctorSchema);

// Token Generation
const generateToken = (id, isAdmin = false) => {
  return jwt.sign({ id, isAdmin }, process.env.JWT_SECRET, { expiresIn: "24h" });
};

// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Access denied" });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    res.status(403).json({ error: "Invalid token" });
  }
};

// Admin Authentication Middleware
const authenticateAdmin = (req, res, next) => {
  authenticateToken(req, res, () => {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }
    next();
  });
};

// **Admin Signup**
router.post('/admin/signup', async (req, res) => {
  try {
    const { username, password, adminKey } = req.body;

    // Check if the adminKey matches the expected value
    if (adminKey !== process.env.ADMIN_KEY) {
      return res.status(403).json({ message: 'Invalid admin key' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new admin user
    const newAdmin = new Admin({
      username,
      password: hashedPassword,
    });

    await newAdmin.save();
    res.status(201).json({ message: 'Admin account created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error creating admin account', error });
  }
});

// **Admin Login**
app.post("/api/admin/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await Admin.findOne({ username });

    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = generateToken(admin._id, true);
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
});

// **Admin: Add Authorized Doctor**
app.post("/api/admin/add-doctor", authenticateAdmin, async (req, res) => {
  try {
    const { doctorId } = req.body;

    const existingDoctor = await AuthorizedDoctor.findOne({ doctorId });
    if (existingDoctor) return res.status(400).json({ error: "Doctor already authorized" });

    const newDoctor = new AuthorizedDoctor({ doctorId });
    await newDoctor.save();

    res.status(201).json({ message: "Doctor authorized successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to authorize doctor" });
  }
});

// **Doctor Signup**
app.post("/api/doctor/signup", async (req, res) => {
  try {
    const { doctorId, password } = req.body;

    const authorized = await AuthorizedDoctor.findOne({ doctorId });
    if (!authorized) return res.status(403).json({ error: "Unauthorized doctor" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newDoctor = new Doctor({ doctorId, password: hashedPassword });

    await newDoctor.save();
    res.status(201).json({ message: "Doctor registered successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to register doctor" });
  }
});

// **Doctor Login**
app.post("/api/doctor/login", async (req, res) => {
  try {
    const { doctorId, password } = req.body;
    const doctor = await Doctor.findOne({ doctorId });

    if (!doctor || !(await bcrypt.compare(password, doctor.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = generateToken(doctor._id);
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
});

// **Start Server**
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = router;
