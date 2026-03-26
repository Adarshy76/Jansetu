function calculateGIS(complaints) {
  if (!complaints || !complaints.length) return 85

  const total = complaints.length
  const resolved = complaints.filter(c => c.status === 'Resolved').length
  const escalated = complaints.filter(c => c.is_escalated).length
  const inProgress = complaints.filter(c => c.status === 'In Progress').length

  // Department repeat issues
  const depts = {}
  complaints.forEach(c => {
    depts[c.department] = (depts[c.department] || 0) + 1
  })
  const repeats = Object.values(depts).filter(v => v >= 3).length

  const resolutionScore = total > 0 ? (resolved / total) * 40 : 40
  const progressScore = total > 0 ? (inProgress / total) * 10 : 10
  const escalationPenalty = Math.min(escalated * 5, 30)
  const repeatPenalty = Math.min(repeats * 3, 20)

  const score = Math.round(
    resolutionScore + progressScore + (30 - escalationPenalty) + (20 - repeatPenalty)
  )

  return Math.max(0, Math.min(100, score))
}

function getGISStatus(score) {
  if (score >= 80) return 'EXCELLENT'
  if (score >= 65) return 'GOOD'
  if (score >= 45) return 'AVERAGE'
  return 'CRITICAL'
}

module.exports = { calculateGIS, getGISStatus }