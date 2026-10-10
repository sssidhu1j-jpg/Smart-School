const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// 1. Initialize SQLite Database (creates school.db automatically)
const dbPath = path.join(__dirname, 'school.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database connection error:', err.message);
  } else {
    console.log('Connected to SQLite database: school.db');
  }
});

// 2. Create Enquiries Table if it does not exist
db.run(`
  CREATE TABLE IF NOT EXISTS enquiries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    grade TEXT,
    message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// 3. Health Check Route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Smart School API is running smoothly!' });
});

// 4. POST /api/enquiries — Receive & Validate Enquiry Submission
app.post('/api/enquiries', (req, res) => {
  const { name, email, phone, grade, message } = req.body;

  // Validation: Check required fields
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, error: 'Full name is required.' });
  }

  // Validation: Check email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email.trim())) {
    return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
  }

  // Validation: Check phone length (at least 10 digits)
  const phoneDigits = (phone || '').replace(/\D/g, '');
  if (phoneDigits.length < 10) {
    return res.status(400).json({ success: false, error: 'Please enter a valid 10-digit phone number.' });
  }

  // Save into SQLite Database
  const sql = `INSERT INTO enquiries (name, email, phone, grade, message) VALUES (?, ?, ?, ?, ?)`;
  const params = [name.trim(), email.trim(), phone.trim(), grade || '', message || ''];

  db.run(sql, params, function (err) {
    if (err) {
      console.error('Error saving enquiry:', err.message);
      return res.status(500).json({ success: false, error: 'Database error. Could not save enquiry.' });
    }

    res.status(201).json({
      success: true,
      message: 'Enquiry submitted successfully! Our admissions team will contact you soon.',
      enquiryId: this.lastID
    });
  });
});

// 5. GET /api/enquiries — View All Enquiries (For Admin)
app.get('/api/enquiries', (req, res) => {
  db.all('SELECT * FROM enquiries ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true, count: rows.length, enquiries: rows });
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`===========================================`);
  console.log(` Smart School Server is running!`);
  console.log(` API URL: http://localhost:${PORT}`);
  console.log(`===========================================`);
});// Homepage route
app.get("/", (req, res) => {
  res.send("Smart School Backend is running!");
});