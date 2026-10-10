const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 5000;

// Persistent enquiries storage (/tmp for Vercel, local folder otherwise)
const isVercel = Boolean(process.env.VERCEL);
const dataFilePath = isVercel
  ? '/tmp/enquiries.json'
  : path.join(__dirname, 'enquiries.json');

// Read enquiries safely
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

// Save enquiries safely
function saveEnquiries(data) {
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving enquiries:', err);
  }
}

// Parse request body
function parseBody(req) {
  if (req.body && typeof req.body === 'object') return Promise.resolve(req.body);
  if (typeof req.body === 'string') {
    try { return Promise.resolve(JSON.parse(req.body)); } catch (_) { return Promise.resolve({}); }
  }
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(body || '{}')); }
      catch (_) { resolve({}); }
    });
    req.on('error', () => resolve({}));
  });
}

// Helper to send JSON response
function sendJson(res, statusCode, data) {
  res.setHeader('Content-Type', 'application/json');
  res.writeHead(statusCode);
  res.end(JSON.stringify(data));
}

// Request Handler
async function handler(req, res) {
  // Global CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  // Parse path (strip query params and normalize /api prefix)
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname.replace(/\/+$/, '') || '/';

  // 1. HEALTH CHECK: GET /api/health
  if (pathname === '/api/health' || pathname === '/health') {
    return sendJson(res, 200, {
      status: 'ok',
      message: 'Smart School API is running smoothly on Vercel!',
      timestamp: new Date().toISOString()
    });
  }

  // 2. ENQUIRIES: GET /api/enquiries
  if ((pathname === '/api/enquiries' || pathname === '/enquiries') && req.method === 'GET') {
    const list = getEnquiries();
    return sendJson(res, 200, { success: true, count: list.length, enquiries: list });
  }

  // 3. ENQUIRIES: POST /api/enquiries
  if ((pathname === '/api/enquiries' || pathname === '/enquiries') && req.method === 'POST') {
    const body = await parseBody(req);
    const { name, email, phone, grade, message } = body;

    if (!name || !String(name).trim()) {
      return sendJson(res, 400, { success: false, error: 'Full name is required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(String(email).trim())) {
      return sendJson(res, 400, { success: false, error: 'Please enter a valid email address.' });
    }

    const phoneDigits = String(phone || '').replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      return sendJson(res, 400, { success: false, error: 'Please enter a valid 10-digit phone number.' });
    }

    const all = getEnquiries();
    const newEnquiry = {
      id: Date.now(),
      name: String(name).trim(),
      email: String(email).trim(),
      phone: String(phone).trim(),
      grade: grade || 'General',
      message: message ? String(message).trim() : '',
      created_at: new Date().toISOString()
    };

    all.unshift(newEnquiry);
    saveEnquiries(all);

    return sendJson(res, 201, {
      success: true,
      message: 'Enquiry submitted successfully! Our admissions office will get in touch.',
      id: newEnquiry.id
    });
  }

  // 4. AUTH: POST /api/auth/login
  if ((pathname === '/api/auth/login' || pathname === '/auth/login' || pathname === '/login') && req.method === 'POST') {
    const body = await parseBody(req);
    const email = String(body.email || body.username || '').trim().toLowerCase();
    const password = String(body.password || '');

    if (!email || !password) {
      return sendJson(res, 400, { success: false, error: 'Username/Email and password are required.' });
    }

    // Check credentials (admin / student)
    const isAdmin = (email === 'admin@smartschool.com' || email === 'admin') &&
                    (password === 'admin123' || password === '1234');
    const isStudent = (email === 'student@smartschool.com' || email === 'student') &&
                      (password === 'student123');

    if (isAdmin) {
      const token = crypto.randomBytes(24).toString('hex');
      return sendJson(res, 200, {
        success: true,
        message: 'Admin login successful!',
        token,
        user: { id: 1, name: 'School Administrator', email: 'admin@smartschool.com', role: 'admin' }
      });
    }

    if (isStudent) {
      const token = crypto.randomBytes(24).toString('hex');
      return sendJson(res, 200, {
        success: true,
        message: 'Student login successful!',
        token,
        user: {
          id: 2,
          name: 'Rahul Sharma',
          email: 'student@smartschool.com',
          role: 'student',
          grade: 'Class 10-A',
          rollNo: 'SCH-1001'
        }
      });
    }

    return sendJson(res, 401, { success: false, error: 'Invalid username or password.' });
  }

  // Fallback 404 for unknown API routes
  return sendJson(res, 404, { success: false, error: `Route not found: ${pathname}` });
}

// Local server execution
if (!isVercel) {
  const server = http.createServer(handler);
  server.listen(PORT, () => {
    console.log(`Smart School Server running locally on http://localhost:${PORT}`);
  });
}

// Export for Vercel Serverless
module.exports = handler;
