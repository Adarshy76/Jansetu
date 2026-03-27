const express = require('express')
const router = express.Router()
const supabase = require('../config/supabase')
const analyzeComplaint = require('../utils/analyzeComplaint')

router.post('/', async (req, res) => {
  try {
    const { citizen_name, phone, complaint_text, ward_number, street } = req.body
    const ai = analyzeComplaint(complaint_text)
    const { data, error } = await supabase.from('complaints').insert([{
      citizen_name, phone, complaint_text,
      ward_complaint: parseInt(ward_number),
      street,
      department: ai.department,
      status: ai.priority === 'HIGH' ? 'In Progress' : 'Open',
      is_escalated: ai.is_escalated,
      asset_type: ai.asset_type,
      date: new Date().toISOString().split('T')[0]
    }]).select().single()
    if (error) throw error
    res.json({ success: true, complaint: data, ai_analysis: ai })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/', async (req, res) => {
  try {
    const { ward, department, status, limit = 50 } = req.query
    let query = supabase.from('complaints').select('*').order('date', { ascending: false }).limit(parseInt(limit))
    if (ward) query = query.eq('ward_complaint', parseInt(ward))
    if (department) query = query.eq('department', department)
    if (status) query = query.eq('status', status)
    const { data, error } = await query
    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/stats', async (req, res) => {
  try {
    const { data: all } = await supabase.from('complaints').select('status, is_escalated, department, ward_complaint')
    const total = all.length
    const resolved = all.filter(c => c.status === 'Resolved').length
    const open = all.filter(c => c.status === 'Open').length
    const inProgress = all.filter(c => c.status === 'In Progress').length
    const escalated = all.filter(c => c.is_escalated).length
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0
    const deptMap = {}
    all.forEach(c => { deptMap[c.department] = (deptMap[c.department] || 0) + 1 })
    const departments = Object.entries(deptMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count)
    res.json({ total, resolved, open, inProgress, escalated, resolutionRate, departments })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/analyze', async (req, res) => {
  try {
    const { text } = req.body
    const result = analyzeComplaint(text)
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.patch('/:id', async (req, res) => {
  try {
    const updates = { ...req.body }
    if (updates.status === 'Resolved') updates.resolved_at = new Date().toISOString()
    const { data, error } = await supabase.from('complaints').update(updates).eq('id', req.params.id).select().single()
    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router