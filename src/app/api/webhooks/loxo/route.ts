import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { LoxoEnhancer } from '@/lib/loxo/enhancer'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    
    console.log('🔔 Loxo Webhook Received:', {
      event: payload.event,
      timestamp: new Date().toISOString(),
      data: payload.data
    })

    // Handle different webhook events
    switch (payload.event) {
      case 'person.created':
        await handlePersonCreated(payload.data)
        break
        
      case 'person.updated':
        await handlePersonUpdated(payload.data)
        break
        
      case 'resume.uploaded':
        await handleResumeUploaded(payload.data)
        break
        
      default:
        console.log('🤷 Unknown webhook event:', payload.event)
    }

    return Response.json({ 
      success: true, 
      message: `Processed ${payload.event} event` 
    })

  } catch (error) {
    console.error('❌ Webhook processing error:', error)
    return Response.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

async function handlePersonCreated(personData: any) {
  console.log('👤 New person created:', personData.id)
  
  try {
    // Sync the new person to our database
    const { error } = await supabase
      .from('candidates')
      .upsert({
        id: `loxo-${personData.id}`,
        loxo_id: personData.id,
        name: personData.name,
        email: personData.email,
        source: 'loxo',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (error) {
      console.error('Failed to sync new person:', error)
      return
    }

    // Trigger enhancement for the new person
    const enhancer = new LoxoEnhancer()
    await enhancer.enhanceCandidates([`loxo-${personData.id}`])
    
    console.log('✅ New person synced and enhanced:', personData.id)
    
  } catch (error) {
    console.error('Error handling person created:', error)
  }
}

async function handlePersonUpdated(personData: any) {
  console.log('🔄 Person updated:', personData.id)
  
  try {
    // Update the person in our database
    const { error } = await supabase
      .from('candidates')
      .update({
        name: personData.name,
        email: personData.email,
        updated_at: new Date().toISOString()
      })
      .eq('loxo_id', personData.id)

    if (error) {
      console.error('Failed to update person:', error)
      return
    }

    // Re-enhance the updated person to get latest data
    const enhancer = new LoxoEnhancer()
    await enhancer.enhanceCandidates([`loxo-${personData.id}`])
    
    console.log('✅ Person updated and re-enhanced:', personData.id)
    
  } catch (error) {
    console.error('Error handling person updated:', error)
  }
}

async function handleResumeUploaded(resumeData: any) {
  console.log('📄 Resume uploaded:', resumeData)
  
  try {
    // Find the candidate and trigger CV download
    const { data: candidate } = await supabase
      .from('candidates')
      .select('id')
      .eq('loxo_id', resumeData.person_id)
      .single()

    if (candidate) {
      // Trigger enhancement with CV download for this specific candidate
      const enhancer = new LoxoEnhancer()
      await enhancer.enhanceCandidates([candidate.id], { downloadCVs: true })
      
      console.log('✅ Resume processed for candidate:', resumeData.person_id)
    }
    
  } catch (error) {
    console.error('Error handling resume uploaded:', error)
  }
}

// Handle webhook verification (if Loxo sends verification challenges)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const challenge = searchParams.get('challenge')
  
  if (challenge) {
    // Return the challenge for webhook verification
    return Response.json({ challenge })
  }
  
  return Response.json({ 
    status: 'Loxo webhook endpoint active',
    timestamp: new Date().toISOString()
  })
}
