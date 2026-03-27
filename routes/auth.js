const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const supabase = require('../config/supabase')
const authMiddleware = require('../middleware/auth')

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' })
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single()

    if (error || !user) {
      return res.status(400).json({ error: 'User not found. Run /api/auth/seed first.' })
    }

    if (user.password !== password) {
      return res.status(400).json({ error: 'Invalid password' })
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        name: user.name,
        username: user.username
      },
      process.env.JWT_SECRET || 'jansetu_secret_2026',
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
    console.error('Login error:', err)
    res.status(500).json({ error: err.message })
  }
})

// GET /api/auth/me — get current user
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, role, name, designation, dept, ward, avatar')
      .eq('id', req.user.id)
      .single()

    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/auth/seed — create default users (open route for setup)
router.get('/seed', async (req, res) => {
  try {
    // Delete existing users
    await supabase
      .from('users')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    const users = [
      {
        username: 'citizen',
        password: 'citizen123',
        role: 'citizen',
        name: 'Ramesh Kumar',
        designation: 'Citizen',
        dept: null,
        ward: 'Ward 10',
        avatar: 'citizen'
      },
      {
        username: 'admin',
        password: 'admin123',
        role: 'admin',
        name: 'Priya Sharma',
        designation: 'Ward Administrator',
        dept: 'Municipal Corporation',
        ward: null,
        avatar: 'admin'
      },
      {
        username: 'leader',
        password: 'leader123',
        role: 'leader',
        name: 'Shri Arun Mishra',
        designation: 'District Magistrate',
        dept: 'District Collectorate',
        ward: null,
        avatar: 'leader'
      },
    ]

    const { error } = await supabase.from('users').insert(users)
    if (error) throw error

    res.json({
      message: '✅ Users seeded successfully',
      credentials: [
        { username: 'citizen', password: 'citizen123', role: 'citizen' },
        { username: 'admin', password: 'admin123', role: 'admin' },
        { username: 'leader', password: 'leader123', role: 'leader' },
      ]
    })
  } catch (err) {
    console.error('Seed error:', err)
    res.status(500).json({ error: err.message })
  }
})

// GET /api/auth/users — check existing users (debug)
router.get('/users', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('username, role, name, designation')
    if (error) throw error
    res.json({ count: data.length, users: data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router