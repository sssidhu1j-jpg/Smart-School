const fs = require('fs');

const dataFile = '/tmp/enquiries.json';

function getEnquiries() {
  try {
    if (fs.existsSync(dataFile)) {
      return JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    }
  } catch (_) {}
  return [];
}

function saveEnquiries(data) {
  try {
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2), 'utf8');
  } catch (_) {}
}

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method === 'GET') {
    const list = getEnquiries();
    return res.status(200).json({ success: true, count: list.length, enquiries: list });
  }

  if (req.method === 'POST') {
    let body = req.body || {};
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (_) { body = {}; }
    }

    const { name, email, phone, grade, message } = body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ success: false, error: 'Full name is required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(String(email).trim())) {
      return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
    }

    const phoneDigits = String(phone || '').replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      return res.status(400).json({ success: false, error: 'Please enter a valid 10-digit phone number.' });
    }

    const list = getEnquiries();
    const newEnquiry = {
      id: Date.now(),
      name: String(name).trim(),
      email: String(email).trim(),
      phone: String(phone).trim(),
      grade: grade || 'General',
      message: message ? String(message).trim() : '',
      created_at: new Date().toISOString()
    };
    list.unshift(newEnquiry);
    saveEnquiries(list);

    return res.status(201).json({
      success: true,
      message: 'Enquiry submitted successfully! Our admissions office will get in touch.',
      id: newEnquiry.id
    });
  }

  res.status(405).json({ error: 'Method not allowed' });
};
