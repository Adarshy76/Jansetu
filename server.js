const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')
require('dotenv').config()

const app = express()

// Middleware
app.use(cors({
  origin: [
    process.env.FRONTEND_URL,
    'http://localhost:5173',
    'http://localhost:5174'
  ],
  credentials: true
}))
app.use(express.json())
app.use(morgan('dev'))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests'
})
app.use('/api/', limiter)

// Routes
app.use('/api/auth', require('./routes/auth'))
app.use('/api/complaints', require('./routes/complaints'))
app.use('/api/wards', require('./routes/wards'))
app.use('/api/escalations', require('./routes/escalations'))
app.use('/api/brief', require('./routes/brief'))
app.use('/api/analytics', require('./routes/analytics.js'))
app.use('/api/sentiment', require('./routes/sentiment'))

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'JanSetu AI Server Running',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  })
})

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Internal server error' })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`JanSetu AI Server running on port ${PORT}`)
})