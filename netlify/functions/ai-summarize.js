exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed'
    }
  }

  try {
    const { journalEntries } = JSON.parse(event.body || '{}')
    const text = String(journalEntries || '').toLowerCase()

    const hasPain = text.includes('sore') || text.includes('pain')
    const hasGood = text.includes('good') || text.includes('great') || text.includes('energy')

    let summary

    if (hasPain && !hasGood) {
      summary = "You've been moving even when it wasn't easy. That takes real strength. Keep listening to your body."
    } else if (hasGood && !hasPain) {
      summary = 'Wonderful progress! Your positive energy is inspiring. Keep up the great work!'
    } else if (hasGood && hasPain) {
      summary = "You had some good days and some tougher ones - that's completely normal. Every small step matters."
    } else {
      summary = 'Thank you for journaling. Your consistency is the foundation of better wellbeing.'
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ summary })
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Invalid request body' })
    }
  }
}
