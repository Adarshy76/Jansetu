const express = require('express')
const router = express.Router()
const supabase = require('../config/supabase')
const auth = require('../middleware/auth')

router.get('/overview', auth.adminOnly, async (req, res) => {
  try {
    const { data: all } = await supabase.from('complaints').select('*')

    // Department breakdown
    const deptMap = {}
    all.forEach(c => { deptMap[c.department] = (deptMap[c.department] || 0) + 1 })

    // Asset type breakdown
    const assetMap = {}
    all.forEach(c => { assetMap[c.asset_type] = (assetMap[c.asset_type] || 0) + 1 })

    // Status breakdown
    const statusMap = { Open: 0, 'In Progress': 0, Resolved: 0 }
    all.forEach(c => { if (statusMap[c.status] !== undefined) statusMap[c.status]++ })

    // Monthly trend
    const monthMap = {}
    all.forEach(c => {
      const month = (c.date || '').substring(0, 7)
      if (!monthMap[month]) monthMap[month] = { filed: 0, resolved: 0 }
      monthMap[month].filed++
      if (c.status === 'Resolved') monthMap[month].resolved++
    })

    const trend = Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({ month, ...data }))

    // Top streets
    const streetMap = {}
    all.forEach(c => { streetMap[c.street] = (streetMap[c.street] || 0) + 1 })
    const topStreets = Object.entries(streetMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([street, count]) => ({ street, count }))

    res.json({
      departments: Object.entries(deptMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
      assetTypes: Object.entries(assetMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
      statusBreakdown: statusMap,
      trend,
      topStreets,
      total: all.length
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router