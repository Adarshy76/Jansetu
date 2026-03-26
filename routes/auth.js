const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const supabase = require('../config/supabase')

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single()

    if (error || !user) return res.status(400).json({ error: 'User not found' })
    if (user.password !== password) return res.status(400).json({ error: 'Invalid password' })

    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name,
        designation: user.designation,
        dept: user.dept,
        ward: user.ward,
        avatar: user.avatar
      }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/me', require('../middleware/auth'), async (req, res) => {
  const { data } = await supabase.from('users').select('*').eq('id', req.user.id).single()
  res.json(data)
})

module.exports = router