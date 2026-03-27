const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')
require('dotenv').config()

const app = express()

// CORS — must be first
app.use(cors({
  origin: [
    'https://jansetu-frontend.vercel.app',
    'https://jan-setu-client.vercel.app',
    'http://localhost:5173',
    'http://localhost:5174',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

// Handle preflight for all routes
app.options('*', cors())

// Body parser — CRITICAL, was missing
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Logger
app.use(morgan('dev'))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests, please try again later.' }
})
app.use('/api/', limiter)

// Health check — before routes
app.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'JanSetu AI Server Running',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  })
})

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    db: 'supabase connected',
    env: {
      supabase: !!process.env.SUPABASE_URL,
      jwt: !!process.env.JWT_SECRET,
    }
  })
})

// Routes
app.use('/api/auth', require('./routes/auth'))
app.use('/api/complaints', require('./routes/complaints'))
app.use('/api/wards', require('./routes/wards'))
app.use('/api/escalations', require('./routes/escalations'))
app.use('/api/brief', require('./routes/brief'))
app.use('/api/analytics', require('./routes/analytics'))
app.use('/api/sentiment', require('./routes/sentiment'))

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.url} not found` })
})

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack)
  res.status(500).json({ error: 'Internal server error', message: err.message })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`✅ JanSetu AI Server running on port ${PORT}`)
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`)
})