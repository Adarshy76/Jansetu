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

// Add this to routes/auth.js
router.get('/seed', async (req, res) => {
  try {
    await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    const users = [
      { username: 'citizen', password: 'citizen123', role: 'citizen', name: 'Ramesh Kumar', designation: 'Citizen', avatar: 'citizen' },
      { username: 'admin', password: 'admin123', role: 'admin', name: 'Priya Sharma', designation: 'Ward Administrator', dept: 'Municipal Corporation', avatar: 'admin' },
      { username: 'leader', password: 'leader123', role: 'leader', name: 'Shri Arun Mishra', designation: 'District Magistrate', dept: 'District Collectorate', avatar: 'leader' },
    ]
    const { error } = await supabase.from('users').insert(users)
    if (error) throw error
    res.json({ message: 'Users seeded successfully', users: users.map(u => u.username) })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})