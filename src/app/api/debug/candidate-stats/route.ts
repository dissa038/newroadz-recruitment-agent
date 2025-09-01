import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabase
      .from('candidates')
      .select('source, first_name, email, bio_description, embedding_status')
      .eq('source', 'loxo')

    if (error) throw error

    const stats = {
      total: data.length,
      loxo: data.length,
      withNames: data.filter(c => c.first_name).length,
      withEmails: data.filter(c => c.email).length,
      enhanced: data.filter(c => c.bio_description).length,
      embedded: data.filter(c => c.embedding_status === 'completed').length
    }

    return NextResponse.json(stats)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get stats' }, { status: 500 })
  }
}
