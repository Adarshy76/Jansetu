const jwt = require('jsonwebtoken')

module.exports = function(req, res, next) {
  const token = req.header('Authorization')?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Access denied. No token.' })
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}

module.exports.adminOnly = function(req, res, next) {
  const token = req.header('Authorization')?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Access denied' })
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    if (!['admin', 'leader'].includes(decoded.role)) {
      return res.status(403).json({ error: 'Admin access required' })
    }
    req.user = decoded
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}