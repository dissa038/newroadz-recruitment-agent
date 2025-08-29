import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { loxoLogger } from '@/lib/logger'

// POST /api/sync/loxo/backfill - Remap existing Loxo candidates from raw data
export async function POST(request: NextRequest) {
  const supabase = createServiceClient()
  const log = loxoLogger.child({ route: 'loxo-backfill' })

  try {
    const { limit = 1000 } = await request.json().catch(() => ({ limit: 1000 }))

    // Fetch candidates needing backfill: top-level email/phone missing but present in raw
    const { data: candidates, error } = await (supabase as any)
      .from('candidates')
      .select('id, first_name, last_name, email, phone, linkedin_url, current_title, current_company, loxo_raw_data')
      .eq('source', 'loxo')
      .or('email.is.null,phone.is.null')
      .limit(limit)

    if (error) {
      log.error({ error }, 'Failed to fetch candidates for backfill')
      return NextResponse.json({ success: false, error: 'Fetch error' }, { status: 500 })
    }

    let updated = 0
    for (const c of candidates || []) {
      const raw = c.loxo_raw_data || {}

      const rawEmail = Array.isArray(raw.emails) && raw.emails.length > 0 ? raw.emails[0]?.value : undefined
      const rawPhone = Array.isArray(raw.phones) && raw.phones.length > 0 ? raw.phones[0]?.value : undefined
      const [firstName, lastName] = splitFullName(c.first_name, c.last_name, raw.name)

      const updates: any = {}
      const email = normalizeEmail(c.email || rawEmail)
      const phone = normalizePhone(c.phone || rawPhone)
      if (!c.first_name && firstName) updates.first_name = firstName
      if (!c.last_name && lastName) updates.last_name = lastName
      if (!c.email && email) updates.email = email
      if (!c.phone && phone) updates.phone = phone
      if (!c.linkedin_url && raw.linkedin_url) updates.linkedin_url = normalizeUrl(raw.linkedin_url)
      if (!c.current_title && (raw.current_title || raw.title)) updates.current_title = raw.current_title || raw.title
      if (!c.current_company && (raw.current_company || raw.company)) updates.current_company = raw.current_company || raw.company

      if (Object.keys(updates).length === 0) continue

      const { error: updErr } = await (supabase as any)
        .from('candidates')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', c.id)

      if (updErr) {
        log.warn({ updErr, id: c.id }, 'Backfill update failed for candidate')
        continue
      }
      updated++
    }

    return NextResponse.json({ success: true, data: { scanned: candidates?.length || 0, updated } })

  } catch (error: any) {
    log.error({ error: error?.message }, 'Backfill failed')
    return NextResponse.json({ success: false, error: 'Backfill failed' }, { status: 500 })
  }
}

function splitFullName(first?: string | null, last?: string | null, fallbackName?: string | null): [string | null, string | null] {
  if (first || last) return [first || null, last || null]
  const name = (fallbackName || '').trim()
  if (!name) return [null, null]
  const parts = name.split(/\s+/)
  if (parts.length === 1) return [parts[0], null]
  const lastName = parts.pop() as string
  const firstName = parts.join(' ')
  return [firstName || null, lastName || null]
}

function normalizeEmail(email?: string | null): string | null {
  if (!email) return null
  const e = String(email).trim().toLowerCase()
  return /.+@.+\..+/.test(e) ? e : null
}

function normalizePhone(phone?: string | null): string | null {
  if (!phone) return null
  const cleaned = String(phone).replace(/[^\d+]/g, '')
  if (!cleaned) return null
  if (cleaned.startsWith('+')) return cleaned
  if (cleaned.startsWith('0')) return `+31${cleaned.slice(1)}`
  return `+31${cleaned}`
}

function normalizeUrl(url?: string | null): string | null {
  if (!url) return null
  const u = String(url).trim()
  return u || null
}


