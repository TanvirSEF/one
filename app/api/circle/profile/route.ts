// app/api/circle/profile/route.ts
import { NextResponse } from 'next/server'
import { getMemberProfile } from '@/lib/circle-headless'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const profile = await getMemberProfile()
    
    return NextResponse.json(profile)
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}


