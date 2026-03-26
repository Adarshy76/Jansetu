const fs = require('fs')
const path = require('path')
const { parse } = require('csv-parse')
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

async function importCSV() {
  const records = []
  const csvPath = path.join(__dirname, '../data/final_master_cleaned.csv')

  const parser = fs.createReadStream(csvPath).pipe(parse({
    columns: true,
    skip_empty_lines: true,
    trim: true
  }))

  for await (const row of parser) {
    if (!row.complaint_text) continue
    records.push({
      complaint_id: parseInt(row.complaint_id) || null,
      complaint_text: row.complaint_text,
      ward_complaint: parseInt(row.ward_complaint) || null,
      street: row.street || null,
      department: row.department || 'Maintenance',
      date: row.date || new Date().toISOString().split('T')[0],
      status: row.status || 'Open',
      asset_name: row.asset_name || null,
      asset_type: row.asset_type || null,
      is_escalated: ['unsafe', 'broken', 'overflow', 'locked'].some(w =>
        (row.complaint_text || '').toLowerCase().includes(w)
      )
    })
  }

  console.log(`Importing ${records.length} records...`)

  // Import in batches of 100
  for (let i = 0; i < records.length; i += 100) {
    const batch = records.slice(i, i + 100)
    const { error } = await supabase.from('complaints').insert(batch)
    if (error) console.error('Batch error:', error.message)
    else console.log(`Imported ${Math.min(i + 100, records.length)}/${records.length}`)
  }

  console.log('Import complete!')
  process.exit(0)
}

importCSV().catch(console.error)