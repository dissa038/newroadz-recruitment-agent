import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabase
      .from('embedding_jobs')
      .select('status')

    if (error) throw error

    const stats = {
      pending: data.filter(j => j.status === 'pending').length,
      inProgress: data.filter(j => j.status === 'in_progress').length,
      completed: data.filter(j => j.status === 'completed').length,
      failed: data.filter(j => j.status === 'failed').length
    }

    return NextResponse.json(stats)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get embedding stats' }, { status: 500 })
  }
}
