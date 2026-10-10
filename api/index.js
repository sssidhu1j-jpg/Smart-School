const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = 'smart_school_secret_key_2026';

// Middleware
app.use(cors());
app.use(express.json());

// Persistent storage (uses /tmp on Vercel lambda, local folder otherwise)
const isVercel = process.env.VERCEL === '1';
const dataFilePath = isVercel
  ? '/tmp/enquiries.json'
  : path.join(__dirname, 'enquiries.json');

// Helper to read enquiries
function getEnquiries() {
  try {
    if (fs.existsSync(dataFilePath)) {
      return JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
    }
  } catch (err) {
    console.error('Error reading enquiries:', err);
  }
  return [];
}

// Helper to save enquiries
function saveEnquiries(data) {
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving enquiries:', err);
  }
}

// Seed default users
const users = [
  {
    id: 1,
    name: 'School Administrator',
    email: 'admin@smartschool.com',
    password: bcrypt.hashSync('admin123', 10),
    role: 'admin'
  },
  {
    id: 2,
    name: 'Rahul Sharma',
    email: 'student@smartschool.com',
    password: bcrypt.hashSync('student123', 10),
    role: 'student',
    grade: 'Class 10-A',
    rollNo: 'SCH-1001'
  }
];

// ==========================================
// ROUTES
// ==========================================

// 1. Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Smart School API is running smoothly on Vercel!',
    timestamp: new Date().toISOString()
  });
});

// 2. Submit Enquiry (POST)
app.post('/api/enquiries', (req, res) => {
  const { name, email, phone, grade, message } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, error: 'Full name is required.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email.trim())) {
    return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
  }

  const phoneDigits = (phone || '').replace(/\D/g, '');
  if (phoneDigits.length < 10) {
    return res.status(400).json({ success: false, error: 'Please enter a valid 10-digit phone number.' });
  }

  const allEnquiries = getEnquiries();
  const newEnquiry = {
    id: Date.now(),
    name: name.trim(),
    email: email.trim(),
    phone: phone.trim(),
    grade: grade || 'General',
    message: message || '',
    created_at: new Date().toISOString()
  };

  allEnquiries.unshift(newEnquiry);
  saveEnquiries(allEnquiries);

  res.status(201).json({
    success: true,
    message: 'Enquiry submitted successfully! Our admissions office will get in touch.',
    id: newEnquiry.id
  });
});

// 3. Get All Enquiries (GET)
app.get('/api/enquiries', (req, res) => {
  const allEnquiries = getEnquiries();
  res.json({ success: true, count: allEnquiries.length, enquiries: allEnquiries });
});

// 4. Login (POST)
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required.' });
  }

  const user = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ success: false, error: 'Invalid email or password.' });
  }

  const token = jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    success: true,
    message: 'Login successful!',
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      grade: user.grade || null,
      rollNo: user.rollNo || null
    }
  });
});

// Listen locally if run with node
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Smart School Server running locally on http://localhost:${PORT}`);
  });
}

// Export for Vercel Serverless
module.exports = app;
