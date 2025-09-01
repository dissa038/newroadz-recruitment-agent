import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'

// POST /api/fix/loxo-super-aggressive-fix - SUPER AGGRESSIVE FIX for ALL Loxo data
export async function POST(request: NextRequest) {
  try {
    const { batchSize = 1000 } = await request.json()
    
    logger.info({ batchSize }, '🔥 Starting SUPER AGGRESSIVE Loxo data fix')

    // Use service role client to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // Get ALL Loxo candidates with raw data (not just missing first_name)
    const { data: candidates, error: fetchError } = await supabase
      .from('candidates')
      .select('id, loxo_id, loxo_raw_data, first_name, email, phone, current_title, current_company, bio_description')
      .eq('source', 'loxo')
      .not('loxo_raw_data', 'is', null)
      .limit(batchSize)

    if (fetchError) {
      logger.error({ error: fetchError }, 'Failed to fetch candidates')
      return NextResponse.json(
        { success: false, error: 'Failed to fetch candidates' },
        { status: 500 }
      )
    }

    logger.info({ candidateCount: candidates.length }, 'Found candidates to fix')

    const results = {
      processed: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      fieldsFixed: {
        names: 0,
        emails: 0,
        phones: 0,
        titles: 0,
        companies: 0,
        descriptions: 0
      }
    }

    // Process each candidate
    for (const candidate of candidates) {
      try {
        const rawData = candidate.loxo_raw_data as any
        const updates: any = {}
        let hasUpdates = false
        
        // Extract name if missing
        if (!candidate.first_name && rawData.name) {
          const nameParts = rawData.name.split(' ')
          updates.first_name = nameParts[0] || null
          updates.last_name = nameParts.slice(1).join(' ') || null
          results.fieldsFixed.names++
          hasUpdates = true
        }
        
        // Extract email if missing
        if (!candidate.email && rawData.emails?.[0]?.value) {
          // Check for duplicates first
          const { data: existingEmail } = await supabase
            .from('candidates')
            .select('id')
            .eq('email', rawData.emails[0].value)
            .eq('source', 'loxo')
            .neq('id', candidate.id)
            .single()
            
          if (!existingEmail) {
            updates.email = rawData.emails[0].value
            results.fieldsFixed.emails++
            hasUpdates = true
          }
        }
        
        // Extract phone if missing
        if (!candidate.phone && rawData.phones?.[0]?.value) {
          updates.phone = rawData.phones[0].value
          results.fieldsFixed.phones++
          hasUpdates = true
        }
        
        // Extract title if missing
        if (!candidate.current_title && rawData.current_title) {
          updates.current_title = rawData.current_title
          results.fieldsFixed.titles++
          hasUpdates = true
        }
        
        // Extract company if missing
        if (!candidate.current_company && rawData.current_company) {
          updates.current_company = rawData.current_company
          results.fieldsFixed.companies++
          hasUpdates = true
        }
        
        // Extract description if missing
        if (!candidate.bio_description && rawData.enhanced?.description) {
          updates.bio_description = rawData.enhanced.description
          results.fieldsFixed.descriptions++
          hasUpdates = true
        }
        
        // Extract additional fields from raw data
        if (rawData.city && !updates.city) {
          updates.city = rawData.city
          hasUpdates = true
        }
        
        if (rawData.state && !updates.state) {
          updates.state = rawData.state
          hasUpdates = true
        }
        
        if (rawData.country && !updates.country) {
          updates.country = rawData.country
          hasUpdates = true
        }
        
        if (rawData.linkedin_url && !updates.linkedin_url) {
          updates.linkedin_url = rawData.linkedin_url
          hasUpdates = true
        }
        
        // Extract enhanced job history if missing
        if (rawData.enhanced?.employment_history && !candidate.detailed_job_history) {
          updates.detailed_job_history = rawData.enhanced.employment_history
          hasUpdates = true
        }
        
        // Extract education history if missing
        if (rawData.enhanced?.education_history) {
          updates.education_history = rawData.enhanced.education_history
          hasUpdates = true
        }
        
        // Extract skills if missing
        if (rawData.enhanced?.skills && Array.isArray(rawData.enhanced.skills)) {
          updates.skills = rawData.enhanced.skills
          hasUpdates = true
        }
        
        // Extract available documents if missing
        if (rawData.enhanced?.resumes && Array.isArray(rawData.enhanced.resumes)) {
          updates.available_documents = rawData.enhanced.resumes
          hasUpdates = true
        }

        if (hasUpdates) {
          updates.updated_at = new Date().toISOString()
          
          const { error: updateError } = await supabase
            .from('candidates')
            .update(updates)
            .eq('id', candidate.id)

          if (updateError) {
            throw updateError
          }

          results.updated++
          logger.info({ 
            candidateId: candidate.id, 
            loxoId: candidate.loxo_id,
            updatedFields: Object.keys(updates)
          }, 'Super aggressively fixed candidate')
        } else {
          results.skipped++
        }

      } catch (error) {
        results.errors++
        logger.error({ 
          candidateId: candidate.id, 
          error: error instanceof Error ? error.message : 'Unknown error'
        }, 'Failed to super aggressively fix candidate')
      }
      
      results.processed++
    }

    logger.info(results, '🎉 SUPER AGGRESSIVE Loxo fix completed')

    return NextResponse.json({
      success: true,
      data: results
    })

  } catch (error) {
    logger.error({ error }, 'SUPER AGGRESSIVE Loxo fix failed')
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
