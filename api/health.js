module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({
    status: 'ok',
    message: 'Smart School API is running smoothly on Vercel!',
    timestamp: new Date().toISOString()
  });
};
