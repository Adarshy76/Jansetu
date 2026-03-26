function analyzeComplaint(text) {
  const lower = (text || '').toLowerCase()

  // Category detection based on your CSV departments
  let department = 'Maintenance'
  let category_icon = '🔧'
  if (/road|pothole|drain|broken road|unsafe|bridge/.test(lower)) {
    department = 'Roads'; category_icon = '🛣️'
  } else if (/toilet|garbage|sanitation|sewage|dumping|waste|cleanliness|mosquito|illegal dump/.test(lower)) {
    department = 'Sanitation'; category_icon = '🗑️'
  } else if (/park|garden|light|tree|maintenance neglected|grass/.test(lower)) {
    department = 'Parks'; category_icon = '🌳'
  } else if (/hospital|health|medical|clinic/.test(lower)) {
    department = 'Health'; category_icon = '🏥'
  }

  // Priority detection
  let priority = 'LOW'
  let priority_reason = 'Standard issue'
  if (/unsafe|emergency|broken|accident|overflow|locked|unusable|danger/.test(lower)) {
    priority = 'HIGH'
    priority_reason = 'Safety risk or unusable facility detected'
  } else if (/neglected|missing|not working|issue|problem/.test(lower)) {
    priority = 'MEDIUM'
    priority_reason = 'Recurring or maintenance issue detected'
  }

  // Sentiment
  let sentiment = 'NEGATIVE'
  let sentiment_score = 30
  if (/resolved|fixed|good|thank|improved|better/.test(lower)) {
    sentiment = 'POSITIVE'; sentiment_score = 80
  } else if (/issue|problem|not working|missing/.test(lower)) {
    sentiment = 'NEGATIVE'; sentiment_score = 20
  } else {
    sentiment = 'NEUTRAL'; sentiment_score = 50
  }

  // Asset type detection
  let asset_type = 'PUBLIC'
  if (/school|college|educational/.test(lower)) asset_type = 'EDUCATIONAL'
  else if (/park|garden/.test(lower)) asset_type = 'PARK'
  else if (/hospital|health/.test(lower)) asset_type = 'HOSPITAL'
  else if (/market|commercial|shop/.test(lower)) asset_type = 'COMMERCIAL'
  else if (/office/.test(lower)) asset_type = 'OFFICE'

  return {
    department,
    category_icon,
    priority,
    priority_reason,
    sentiment,
    sentiment_score,
    asset_type,
    is_escalated: priority === 'HIGH'
  }
}

module.exports = analyzeComplaint