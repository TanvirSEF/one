// app/api/circle/members/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { listMembers, getMemberPublicProfile, type PublicProfile } from '@/lib/circle-headless'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = searchParams.get('page')
    const per_page = searchParams.get('per_page')
    const search = searchParams.get('search') || undefined

    const perPageNum = per_page ? Number(per_page) : 300
    const pageNum = page ? Number(page) : 1

    const base = await listMembers({
      page: pageNum,
      per_page: perPageNum,
      search,
    })

    const records = await Promise.all(
      base.records.map(async (m) => {
        try {
          const profile: PublicProfile = await getMemberPublicProfile(m.community_member_id)
          const visible = profile.profile_fields?.visible ?? []
          const invitedField = visible.find((f) => f.key === 'Name_or_account')
          const invitedValue = invitedField?.community_member_profile_field?.display_value
          const invitedBy = typeof invitedValue === 'string' ? invitedValue : Array.isArray(invitedValue) ? invitedValue.join(', ') : 'N/A'
          return { ...m, invitedBy }
        } catch {
          return { ...m, invitedBy: 'N/A' }
        }
      })
    )

    return NextResponse.json({ ...base, records })
  } catch (error) {
    console.error('Members list fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch members' },
      { status: 500 }
    )
  }
}


