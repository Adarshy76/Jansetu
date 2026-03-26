const POSITIVE_WORDS = ['resolved', 'fixed', 'good', 'great', 'excellent', 'thank', 'thanks',
  'improved', 'better', 'happy', 'satisfied', 'appreciate', 'done', 'completed', 'repaired']

const NEGATIVE_WORDS = ['not cleaned', 'locked', 'unusable', 'neglected', 'missing', 'broken',
  'unsafe', 'overflow', 'dumping', 'dirty', 'issue', 'problem', 'danger', 'accumulation',
  'not working', 'breeding', 'illegal', 'garbage', 'waste', 'damaged']

function getSentiment(text) {
  const lower = (text || '').toLowerCase()
  let pos = 0, neg = 0

  POSITIVE_WORDS.forEach(w => { if (lower.includes(w)) pos++ })
  NEGATIVE_WORDS.forEach(w => { if (lower.includes(w)) neg++ })

  if (pos > neg) return { sentiment: 'POSITIVE', score: Math.min(100, pos * 25), icon: 'positive' }
  if (neg > pos) return { sentiment: 'NEGATIVE', score: Math.max(0, 100 - neg * 20), icon: 'negative' }
  return { sentiment: 'NEUTRAL', score: 50, icon: 'neutral' }
}

function bulkSentiment(complaints) {
  let positive = 0, negative = 0, neutral = 0
  complaints.forEach(c => {
    const s = getSentiment(c.complaint_text || c.description)
    if (s.sentiment === 'POSITIVE') positive++
    else if (s.sentiment === 'NEGATIVE') negative++
    else neutral++
  })
  const total = complaints.length || 1
  return {
    positive, negative, neutral, total,
    positivePercent: Math.round((positive / total) * 100),
    negativePercent: Math.round((negative / total) * 100),
    neutralPercent: Math.round((neutral / total) * 100),
    overall: positive > negative ? 'POSITIVE' : negative > positive ? 'NEGATIVE' : 'NEUTRAL',
    overallScore: Math.round(((positive * 100) + (neutral * 50)) / total)
  }
}

module.exports = { getSentiment, bulkSentiment }