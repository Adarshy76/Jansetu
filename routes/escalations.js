const express = require('express')
const router = express.Router()
const supabase = require('../config/supabase')
const auth = require('../middleware/auth')

router.get('/', auth.adminOnly, async (req, res) => {
  try {
    const { data } = await supabase.from('complaints').select('*').eq('is_escalated', true).order('date', { ascending: false })
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.patch('/:id/assign', auth.adminOnly, async (req, res) => {
  try {
    const { department, admin_notes } = req.body
    const { data } = await supabase.from('complaints').update({ department, admin_notes, status: 'In Progress' }).eq('id', req.params.id).select().single()
    res.json({ success: true, complaint: data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.patch('/:id/resolve', auth.adminOnly, async (req, res) => {
  try {
    const { data } = await supabase.from('complaints').update({ status: 'Resolved', resolved_at: new Date().toISOString(), is_escalated: false }).eq('id', req.params.id).select().single()
    res.json({ success: true, complaint: data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.patch('/:id/escalate-dm', auth.adminOnly, async (req, res) => {
  try {
    const { data } = await supabase.from('complaints').update({ escalated_to_dm: true, status: 'In Progress' }).eq('id', req.params.id).select().single()
    res.json({ success: true, complaint: data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router