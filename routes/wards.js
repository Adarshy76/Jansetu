const express = require('express')
const router = express.Router()
const supabase = require('../config/supabase')
const { calculateGIS, getGISStatus } = require('../utils/calculateGIS')

router.get('/scores', async (req, res) => {
  try {
    const { data: all } = await supabase.from('complaints').select('ward_complaint, status, is_escalated, department')
    const wardMap = {}
    all.forEach(c => {
      const w = c.ward_complaint
      if (!wardMap[w]) wardMap[w] = []
      wardMap[w].push(c)
    })
    const wards = Object.entries(wardMap).map(([ward, complaints]) => {
      const score = calculateGIS(complaints)
      const status = getGISStatus(score)
      return {
        ward_number: parseInt(ward),
        ward_name: `Ward ${ward}`,
        score, status,
        total: complaints.length,
        resolved: complaints.filter(c => c.status === 'Resolved').length,
        in_progress: complaints.filter(c => c.status === 'In Progress').length,
        open: complaints.filter(c => c.status === 'Open').length,
        escalated: complaints.filter(c => c.is_escalated).length,
      }
    }).sort((a, b) => a.ward_number - b.ward_number)
    const districtGIS = Math.round(wards.reduce((s, w) => s + w.score, 0) / wards.length)
    const bestWard = wards.reduce((a, b) => a.score > b.score ? a : b)
    const worstWard = wards.reduce((a, b) => a.score < b.score ? a : b)
    res.json({ wards, districtGIS, bestWard, worstWard, totalWards: wards.length })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/:ward', async (req, res) => {
  try {
    const { data } = await supabase.from('complaints').select('*').eq('ward_complaint', req.params.ward)
    const score = calculateGIS(data)
    res.json({ ward_number: req.params.ward, score, status: getGISStatus(score), complaints: data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router