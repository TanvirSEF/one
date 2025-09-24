// app/api/circle/member/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getMemberDetails } from '@/lib/circle-headless'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const memberId = parseInt(id)
    
    if (isNaN(memberId)) {
      return NextResponse.json(
        { error: 'Invalid member ID' },
        { status: 400 }
      )
    }

    const member = await getMemberDetails(memberId)
    
    // Extract useful information for affiliate tracking
    const brokerInfo = {
      brokerId: member.profile_fields.not_visible.find(
        field => field.key === 'ti_bi_globe_client_id'
      )?.community_member_profile_field.display_value || 'N/A',
      
      inviter: member.profile_fields.visible.find(
        field => field.key === 'Name_or_account'
      )?.community_member_profile_field.display_value || 'N/A',
      
      source: member.profile_fields.visible.find(
        field => field.key === 'how_did_you_find_us'
      )?.community_member_profile_field.display_value || []
    }

    return NextResponse.json({
      ...member,
      brokerInfo
    })
  } catch (error) {
    console.error('Member profile fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch member profile' },
      { status: 500 }
    )
  }
}
