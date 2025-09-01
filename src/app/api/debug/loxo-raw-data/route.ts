import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Fetching candidates from Loxo API...')

    // Fetch from Loxo API
    const loxoResponse = await fetch(`${process.env.LOXO_API_URL}/${process.env.LOXO_AGENCY_SLUG}/people`, {
      headers: {
        'Authorization': `Bearer ${process.env.LOXO_API_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    if (!loxoResponse.ok) {
      throw new Error(`Loxo API error: ${loxoResponse.status}`)
    }

    const loxoData = await loxoResponse.json()
    const candidates = loxoData.people || []

    console.log(`📥 Got ${candidates.length} candidates from Loxo`)

    // Analyze the data structure
    const analysis = {
      totalCandidates: candidates.length,
      sampleCandidate: candidates[0] || null,
      fieldAnalysis: {},
      dataQuality: {
        withNames: 0,
        withEmails: 0,
        withPhones: 0,
        withTitles: 0,
        withCompanies: 0,
        withDescriptions: 0
      }
    }

    // Analyze all fields present in candidates
    const allFields = new Set()
    candidates.forEach(candidate => {
      Object.keys(candidate).forEach(field => allFields.add(field))
    })

    // Count field presence
    allFields.forEach(field => {
      const count = candidates.filter(c => c[field] !== null && c[field] !== undefined && c[field] !== '').length
      analysis.fieldAnalysis[field] = {
        present: count,
        percentage: Math.round((count / candidates.length) * 100)
      }
    })

    // Data quality analysis
    candidates.forEach(candidate => {
      if (candidate.name) analysis.dataQuality.withNames++
      if (candidate.emails && candidate.emails.length > 0) analysis.dataQuality.withEmails++
      if (candidate.phones && candidate.phones.length > 0) analysis.dataQuality.withPhones++
      if (candidate.current_title) analysis.dataQuality.withTitles++
      if (candidate.current_company) analysis.dataQuality.withCompanies++
      if (candidate.enhanced && candidate.enhanced.description) analysis.dataQuality.withDescriptions++
    })

    // Get enhanced data for first 5 candidates
    const enhancedSamples = []
    for (let i = 0; i < Math.min(5, candidates.length); i++) {
      const candidate = candidates[i]
      try {
        const enhancedResponse = await fetch(`${process.env.LOXO_API_URL}/${process.env.LOXO_AGENCY_SLUG}/people/${candidate.id}`, {
          headers: {
            'Authorization': `Bearer ${process.env.LOXO_API_KEY}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (enhancedResponse.ok) {
          const enhancedData = await enhancedResponse.json()
          enhancedSamples.push({
            id: candidate.id,
            name: candidate.name,
            basicData: candidate,
            enhancedData: enhancedData
          })
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 200))
      } catch (error) {
        console.error(`Failed to get enhanced data for ${candidate.id}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      analysis,
      enhancedSamples,
      rawCandidates: candidates.slice(0, 10) // First 10 for inspection
    })

  } catch (error) {
    console.error('Loxo raw data fetch failed:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
