const express = require('express')
const router = express.Router()
const supabase = require('../config/supabase')
const { calculateGIS, getGISStatus } = require('../utils/calculateGIS')
const { bulkSentiment } = require('../utils/sentimentEngine')

router.get('/weekly', async (req, res) => {
  try {
    const { data: all } = await supabase.from('complaints').select('*')
    const total = all.length
    const resolved = all.filter(c => c.status === 'Resolved').length
    const open = all.filter(c => c.status === 'Open').length
    const inProgress = all.filter(c => c.status === 'In Progress').length
    const escalated = all.filter(c => c.is_escalated).length
    const resolutionRate = Math.round((resolved / total) * 100)
    const wardMap = {}
    all.forEach(c => {
      if (!wardMap[c.ward_complaint]) wardMap[c.ward_complaint] = []
      wardMap[c.ward_complaint].push(c)
    })
    const wardScores = Object.entries(wardMap).map(([ward, complaints]) => {
      const score = calculateGIS(complaints)
      return { ward: `Ward ${ward}`, score, status: getGISStatus(score), total: complaints.length, resolved: complaints.filter(c => c.status === 'Resolved').length }
    }).sort((a, b) => b.score - a.score)
    const deptMap = {}
    all.forEach(c => { deptMap[c.department] = (deptMap[c.department] || 0) + 1 })
    const topIssues = Object.entries(deptMap).map(([dept, count]) => ({ department: dept, count })).sort((a, b) => b.count - a.count)
    const sentiment = bulkSentiment(all)
    const allScores = wardScores.map(w => w.score)
    const districtGIS = Math.round(allScores.reduce((s, v) => s + v, 0) / allScores.length)
    const bestWard = wardScores[0]
    const worstWard = wardScores[wardScores.length - 1]
    const recommendations = []
    if (worstWard.score < 40) recommendations.push({ priority: 'CRITICAL', title: `Immediate Action — ${worstWard.ward}`, desc: `GIS score critically low at ${worstWard.score}/100. ${worstWard.total} complaints pending. Deploy team immediately.` })
    if (escalated > 10) recommendations.push({ priority: 'HIGH', title: `${escalated} Escalated Complaints Pending`, desc: 'Multiple high-priority complaints need department assignment within 24 hours.' })
    if (resolutionRate < 50) recommendations.push({ priority: 'MEDIUM', title: 'Resolution Rate Below Target', desc: `Current rate ${resolutionRate}%. Target is 70%. Review department workflows.` })
    recommendations.push({ priority: 'INFO', title: `Replicate ${bestWard.ward} Model`, desc: `Best performing ward with GIS ${bestWard.score}/100. ${bestWard.resolved}/${bestWard.total} resolved. Study and scale.` })
    res.json({ total, resolved, open, inProgress, escalated, resolutionRate, districtGIS, wardScores, topIssues, sentiment, bestWard, worstWard, recommendations })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router