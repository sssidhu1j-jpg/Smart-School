const crypto = require('crypto');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body = req.body || {};
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (_) { body = {}; }
  }

  const { email, username, password } = body;
  const user = String(email || username || '').trim().toLowerCase();
  const pass = String(password || '');

  const isAdmin = (user === 'admin' || user === 'admin@smartschool.com') && (pass === 'admin123' || pass === '1234');
  const isStudent = (user === 'student' || user === 'student@smartschool.com') && (pass === 'student123');

  if (isAdmin) {
    const token = crypto.randomBytes(24).toString('hex');
    return res.status(200).json({
      success: true,
      message: 'Admin login successful!',
      token,
      user: { id: 1, name: 'School Administrator', email: 'admin@smartschool.com', role: 'admin' }
    });
  }

  if (isStudent) {
    const token = crypto.randomBytes(24).toString('hex');
    return res.status(200).json({
      success: true,
      message: 'Student login successful!',
      token,
      user: { id: 2, name: 'Rahul Sharma', email: 'student@smartschool.com', role: 'student', grade: 'Class 10-A', rollNo: 'SCH-1001' }
    });
  }

  return res.status(401).json({ success: false, error: 'Invalid username or password.' });
};
