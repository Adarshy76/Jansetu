const express = require('express')
const router = express.Router()
const supabase = require('../config/supabase')
const { getSentiment, bulkSentiment } = require('../utils/sentimentEngine')
const auth = require('../middleware/auth')

router.get('/analysis', auth.adminOnly, async (req, res) => {
  try {
    const { data } = await supabase.from('complaints').select('complaint_text, status, department, ward_complaint')
    const overall = bulkSentiment(data)

    // Per department
    const depts = {}
    data.forEach(c => {
      if (!depts[c.department]) depts[c.department] = []
      depts[c.department].push(c)
    })
    const byDepartment = Object.entries(depts).map(([dept, complaints]) => ({
      department: dept,
      ...bulkSentiment(complaints)
    }))

    // Recent with sentiment
    const recent = data.slice(0, 20).map(c => ({
      text: c.complaint_text,
      ...getSentiment(c.complaint_text),
      department: c.department,
      ward: c.ward_complaint
    }))

    res.json({ overall, byDepartment, recent })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/analyze', async (req, res) => {
  try {
    const { text } = req.body
    res.json(getSentiment(text))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router