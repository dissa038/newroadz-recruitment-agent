import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'

// POST /api/fix/loxo-data-mega-fix - MEGA FIX for all Loxo data extraction
export async function POST(request: NextRequest) {
  try {
    const { batchSize = 500 } = await request.json()
    
    logger.info({ batchSize }, '🔥 Starting MEGA Loxo data extraction fix')

    // Use service role client to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // Get all Loxo candidates that need fixing
    const { data: candidates, error: fetchError } = await supabase
      .from('candidates')
      .select('id, loxo_id, loxo_raw_data, first_name, email')
      .eq('source', 'loxo')
      .is('first_name', null)
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
      errorDetails: [] as any[]
    }

    // Process each candidate individually to handle duplicates
    for (const candidate of candidates) {
      try {
        const rawData = candidate.loxo_raw_data as any
        
        // Extract data from raw_data
        const fullName = rawData.name || ''
        const nameParts = fullName.split(' ')
        const firstName = nameParts[0] || null
        const lastName = nameParts.slice(1).join(' ') || null
        
        const primaryEmail = rawData.emails?.[0]?.value || null
        const primaryPhone = rawData.phones?.[0]?.value || null
        
        // Check if email already exists for another candidate
        if (primaryEmail) {
          const { data: existingEmail } = await supabase
            .from('candidates')
            .select('id')
            .eq('email', primaryEmail)
            .eq('source', 'loxo')
            .neq('id', candidate.id)
            .single()
            
          if (existingEmail) {
            logger.warn({ 
              candidateId: candidate.id, 
              email: primaryEmail 
            }, 'Email already exists, skipping')
            results.skipped++
            results.processed++
            continue
          }
        }
        
        // Update candidate with extracted data
        const updateData = {
          first_name: firstName,
          last_name: lastName,
          email: primaryEmail,
          phone: primaryPhone,
          current_title: rawData.current_title || null,
          current_company: rawData.current_company || null,
          city: rawData.city || null,
          state: rawData.state || null,
          country: rawData.country || null,
          linkedin_url: rawData.linkedin_url || null,
          updated_at: new Date().toISOString()
        }

        const { error: updateError } = await supabase
          .from('candidates')
          .update(updateData)
          .eq('id', candidate.id)

        if (updateError) {
          throw updateError
        }

        results.updated++
        logger.info({ 
          candidateId: candidate.id, 
          loxoId: candidate.loxo_id,
          extractedName: fullName,
          extractedEmail: primaryEmail 
        }, 'Fixed candidate data')

      } catch (error) {
        results.errors++
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        results.errorDetails.push({
          candidateId: candidate.id,
          loxoId: candidate.loxo_id,
          error: errorMessage
        })
        logger.error({ 
          candidateId: candidate.id, 
          error: errorMessage 
        }, 'Failed to fix candidate')
      }
      
      results.processed++
    }

    logger.info(results, '🎉 MEGA Loxo data extraction fix completed')

    return NextResponse.json({
      success: true,
      data: results
    })

  } catch (error) {
    logger.error({ error }, 'MEGA Loxo data extraction fix failed')
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
