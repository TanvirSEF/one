// app/api/circle/members/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { listMembers, getMemberPublicProfile, type PublicProfile, type HeadlessMember } from '@/lib/circle-headless'

export const dynamic = 'force-dynamic'

// Enhanced member row type with country data
type EnhancedMemberRow = {
  community_member_id: number
  name: string
  headline: string
  roles: { admin: boolean; moderator: boolean }
  avatar_url: string | null
  messaging_enabled: boolean
  email: string
  can_receive_dm_from_current_member: boolean
  member_tags: Array<{
    id: number
    name: string
    color: string
    is_public: boolean
    display_format: string
    emoji: string
  }>
  invitedBy: string
  country: string // Added country field
}

// Professional location extraction utility
class LocationExtractor {
  private static readonly FLAG_TO_COUNTRY: Record<string, string> = {
    '🇺🇸': 'United States', '🇬🇧': 'United Kingdom', '🇨🇦': 'Canada', '🇦🇺': 'Australia',
    '🇩🇪': 'Germany', '🇫🇷': 'France', '🇪🇸': 'Spain', '🇮🇹': 'Italy', '🇯🇵': 'Japan',
    '🇨🇳': 'China', '🇮🇳': 'India', '🇧🇷': 'Brazil', '🇲🇽': 'Mexico', '🇰🇷': 'South Korea',
    '🇳🇴': 'Norway', '🇸🇪': 'Sweden', '🇩🇰': 'Denmark', '🇫🇮': 'Finland', '🇳🇱': 'Netherlands',
    '🇨🇴': 'Colombia', '🇦🇷': 'Argentina', '🇨🇱': 'Chile', '🇵🇪': 'Peru', '🇻🇪': 'Venezuela',
    '🇪🇨': 'Ecuador', '🇺🇾': 'Uruguay', '🇵🇾': 'Paraguay', '🇧🇴': 'Bolivia', '🇬🇾': 'Guyana',
    '🇸🇷': 'Suriname', '🇫🇫': 'French Guiana', '🇨🇷': 'Costa Rica', '🇵🇦': 'Panama',
    '🇳🇮': 'Nicaragua', '🇭🇳': 'Honduras', '🇬🇹': 'Guatemala', '🇧🇿': 'Belize', '🇸🇻': 'El Salvador',
    '🇨🇺': 'Cuba', '🇯🇲': 'Jamaica', '🇭🇹': 'Haiti', '🇩🇴': 'Dominican Republic', '🇵🇷': 'Puerto Rico',
    '🇹🇹': 'Trinidad and Tobago', '🇧🇧': 'Barbados', '🇬🇩': 'Grenada', '🇱🇨': 'Saint Lucia',
    '🇻🇨': 'Saint Vincent and the Grenadines', '🇦🇬': 'Antigua and Barbuda', '🇩🇲': 'Dominica',
    '🇰🇳': 'Saint Kitts and Nevis', '🇧🇸': 'Bahamas', '🇿🇦': 'South Africa', '🇳🇬': 'Nigeria',
    '🇪🇬': 'Egypt', '🇰🇪': 'Kenya', '🇬🇭': 'Ghana', '🇪🇹': 'Ethiopia', '🇺🇬': 'Uganda',
    '🇹🇿': 'Tanzania', '🇷🇼': 'Rwanda', '🇿🇼': 'Zimbabwe', '🇧🇼': 'Botswana', '🇳🇦': 'Namibia',
    '🇿🇲': 'Zambia', '🇲🇼': 'Malawi', '🇲🇿': 'Mozambique', '🇦🇴': 'Angola', '🇨🇩': 'Democratic Republic of the Congo',
    '🇨🇬': 'Republic of the Congo', '🇨🇲': 'Cameroon', '🇨🇫': 'Central African Republic', '🇹🇩': 'Chad',
    '🇸🇩': 'Sudan', '🇸🇸': 'South Sudan', '🇪🇷': 'Eritrea', '🇩🇯': 'Djibouti', '🇸🇴': 'Somalia',
    '🇲🇦': 'Morocco', '🇩🇿': 'Algeria', '🇹🇳': 'Tunisia', '🇱🇾': 'Libya', '🇲🇷': 'Mauritania',
    '🇲🇱': 'Mali', '🇧🇫': 'Burkina Faso', '🇳🇪': 'Niger', '🇸🇳': 'Senegal', '🇬🇲': 'Gambia',
    '🇬🇼': 'Guinea-Bissau', '🇬🇳': 'Guinea', '🇸🇱': 'Sierra Leone', '🇱🇷': 'Liberia', '🇨🇮': 'Ivory Coast',
    '🇹🇬': 'Togo', '🇧🇯': 'Benin', '🇬🇦': 'Gabon', '🇬🇶': 'Equatorial Guinea', '🇸🇹': 'Sao Tome and Principe',
    '🇨🇻': 'Cape Verde', '🇲🇺': 'Mauritius', '🇸🇨': 'Seychelles', '🇰🇲': 'Comoros', '🇲🇬': 'Madagascar',
    '🇷🇺': 'Russia', '🇺🇦': 'Ukraine', '🇧🇾': 'Belarus', '🇲🇩': 'Moldova', '🇷🇴': 'Romania',
    '🇧🇬': 'Bulgaria', '🇷🇸': 'Serbia', '🇲🇪': 'Montenegro', '🇧🇦': 'Bosnia and Herzegovina', '🇭🇷': 'Croatia',
    '🇸🇮': 'Slovenia', '🇸🇰': 'Slovakia', '🇨🇿': 'Czech Republic', '🇵🇱': 'Poland', '🇭🇺': 'Hungary',
    '🇦🇹': 'Austria', '🇨🇭': 'Switzerland', '🇱🇮': 'Liechtenstein', '🇱🇺': 'Luxembourg', '🇧🇪': 'Belgium',
    '🇮🇪': 'Ireland', '🇮🇸': 'Iceland', '🇲🇹': 'Malta', '🇨🇾': 'Cyprus', '🇬🇷': 'Greece',
    '🇦🇱': 'Albania', '🇲🇰': 'North Macedonia', '🇽🇰': 'Kosovo', '🇲🇳': 'Mongolia', '🇰🇿': 'Kazakhstan',
    '🇺🇿': 'Uzbekistan', '🇹🇲': 'Turkmenistan', '🇰🇬': 'Kyrgyzstan', '🇹🇯': 'Tajikistan', '🇦🇫': 'Afghanistan',
    '🇵🇰': 'Pakistan', '🇧🇩': 'Bangladesh', '🇱🇰': 'Sri Lanka', '🇲🇻': 'Maldives', '🇧🇹': 'Bhutan',
    '🇳🇵': 'Nepal', '🇲🇲': 'Myanmar', '🇹🇭': 'Thailand', '🇱🇦': 'Laos', '🇰🇭': 'Cambodia',
    '🇻🇳': 'Vietnam', '🇲🇾': 'Malaysia', '🇸🇬': 'Singapore', '🇮🇩': 'Indonesia', '🇧🇳': 'Brunei',
    '🇵🇭': 'Philippines', '🇹🇱': 'East Timor', '🇵🇬': 'Papua New Guinea', '🇫🇯': 'Fiji', '🇸🇧': 'Solomon Islands',
    '🇻🇺': 'Vanuatu', '🇳🇨': 'New Caledonia', '🇵🇫': 'French Polynesia', '🇼🇸': 'Samoa', '🇹🇴': 'Tonga',
    '🇰🇮': 'Kiribati', '🇹🇻': 'Tuvalu', '🇳🇷': 'Nauru', '🇵🇼': 'Palau', '🇫🇲': 'Micronesia',
    '🇲🇭': 'Marshall Islands', '🇳🇿': 'New Zealand', '🇮🇷': 'Iran', '🇮🇶': 'Iraq', '🇸🇾': 'Syria',
    '🇱🇧': 'Lebanon', '🇯🇴': 'Jordan', '🇮🇱': 'Israel', '🇵🇸': 'Palestine', '🇸🇦': 'Saudi Arabia',
    '🇾🇪': 'Yemen', '🇴🇲': 'Oman', '🇦🇪': 'United Arab Emirates', '🇶🇦': 'Qatar', '🇧🇭': 'Bahrain',
    '🇰🇼': 'Kuwait', '🇹🇷': 'Turkey', '🇦🇲': 'Armenia', '🇦🇿': 'Azerbaijan', '🇬🇪': 'Georgia'
  }

  private static readonly LOCATION_PATTERNS = [
    /(?:from|in|at|based\s+in|located\s+in|living\s+in|residing\s+in)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
    /(?:🏠|🏡|🏢|🌍|🌎|🌏|📍)\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*(?:🏠|🏡|🏢|🌍|🌎|🌏|📍)/i
  ]

  static extractLocation(profile: HeadlessMember | PublicProfile | null, memberData: unknown): string {
    // Priority 1: Profile info location (works for both HeadlessMember and PublicProfile)
    if (profile && 'profile_info' in profile && profile.profile_info?.location?.trim()) {
      const location = profile.profile_info.location.trim()
      // Extract country from location string like "Málaga, Málaga, Spain" -> "Spain"
      const parts = location.split(',').map((part: string) => part.trim())
      return parts.length > 1 ? parts[parts.length - 1] : location
    }

    // Priority 1.5: Direct location field for PublicProfile (if different structure)
    if (profile && !('profile_info' in profile) && 'location' in profile && (profile as Record<string, unknown>).location && typeof (profile as Record<string, unknown>).location === 'string') {
      const location = ((profile as Record<string, unknown>).location as string).trim()
      const parts = location.split(',').map((part: string) => part.trim())
      return parts.length > 1 ? parts[parts.length - 1] : location
    }

    // Priority 2: Profile fields (location/country fields)
    if (profile?.profile_fields?.visible) {
      const locationField = profile.profile_fields.visible.find(field => 
        field.key.toLowerCase().includes('location') || 
        field.key.toLowerCase().includes('country') ||
        field.label.toLowerCase().includes('location') ||
        field.label.toLowerCase().includes('country') ||
        field.key.toLowerCase().includes('city') ||
        field.key.toLowerCase().includes('state')
      )
      
      if (locationField?.community_member_profile_field?.display_value) {
        const value = locationField.community_member_profile_field.display_value
        const locationStr = typeof value === 'string' ? value : Array.isArray(value) ? value.join(', ') : ''
        if (locationStr.trim()) return locationStr.trim()
      }
    }

    // Priority 3: Bio text analysis (works for both HeadlessMember and PublicProfile)
    const bioText = profile && 'bio' in profile ? profile.bio : null
    if (bioText?.trim()) {
      // Check for flag emojis first
      const flagMatch = bioText.match(/🇺🇸|🇬🇧|🇨🇦|🇦🇺|🇩🇪|🇫🇷|🇪🇸|🇮🇹|🇯🇵|🇨🇳|🇮🇳|🇧🇷|🇲🇽|🇰🇷|🇳🇴|🇸🇪|🇩🇰|🇫🇮|🇳🇱|🇨🇴|🇦🇷|🇨🇱|🇵🇪|🇻🇪|🇪🇨|🇺🇾|🇵🇾|🇧🇴|🇬🇾|🇸🇷|🇫🇫|🇨🇷|🇵🇦|🇳🇮|🇭🇳|🇬🇹|🇧🇿|🇸🇻|🇨🇺|🇯🇲|🇭🇹|🇩🇴|🇵🇷|🇹🇹|🇧🇧|🇬🇩|🇱🇨|🇻🇨|🇦🇬|🇩🇲|🇰🇳|🇧🇸|🇿🇦|🇳🇬|🇪🇬|🇰🇪|🇬🇭|🇪🇹|🇺🇬|🇹🇿|🇷🇼|🇿🇼|🇧🇼|🇳🇦|🇿🇲|🇲🇼|🇲🇿|🇦🇴|🇨🇩|🇨🇬|🇨🇲|🇨🇫|🇹🇩|🇸🇩|🇸🇸|🇪🇷|🇩🇯|🇸🇴|🇲🇦|🇩🇿|🇹🇳|🇱🇾|🇲🇷|🇲🇱|🇧🇫|🇳🇪|🇸🇳|🇬🇲|🇬🇼|🇬🇳|🇸🇱|🇱🇷|🇨🇮|🇹🇬|🇧🇯|🇬🇦|🇬🇶|🇸🇹|🇨🇻|🇲🇺|🇸🇨|🇰🇲|🇲🇬|🇷🇺|🇺🇦|🇧🇾|🇲🇩|🇷🇴|🇧🇬|🇷🇸|🇲🇪|🇧🇦|🇭🇷|🇸🇮|🇸🇰|🇨🇿|🇵🇱|🇭🇺|🇦🇹|🇨🇭|🇱🇮|🇱🇺|🇧🇪|🇮🇪|🇮🇸|🇲🇹|🇨🇾|🇬🇷|🇦🇱|🇲🇰|🇽🇰|🇲🇳|🇰🇿|🇺🇿|🇹🇲|🇰🇬|🇹🇯|🇦🇫|🇵🇰|🇧🇩|🇱🇰|🇲🇻|🇧🇹|🇳🇵|🇲🇲|🇹🇭|🇱🇦|🇰🇭|🇻🇳|🇲🇾|🇸🇬|🇮🇩|🇧🇳|🇵🇭|🇹🇱|🇵🇬|🇫🇯|🇸🇧|🇻🇺|🇳🇨|🇵🇫|🇼🇸|🇹🇴|🇰🇮|🇹🇻|🇳🇷|🇵🇼|🇫🇲|🇲🇭|🇳🇿|🇮🇷|🇮🇶|🇸🇾|🇱🇧|🇯🇴|🇮🇱|🇵🇸|🇸🇦|🇾🇪|🇴🇲|🇦🇪|🇶🇦|🇧🇭|🇰🇼|🇹🇷|🇦🇲|🇦🇿|🇬🇪/)
      if (flagMatch) {
        return this.FLAG_TO_COUNTRY[flagMatch[0]] || 'Unknown'
      }

      // Check for location patterns
      for (const pattern of this.LOCATION_PATTERNS) {
        const match = bioText.match(pattern)
        if (match && match[1]?.trim()) {
          return match[1].trim()
        }
      }
    }

    // Priority 4: Member headline analysis
    if (memberData && typeof memberData === 'object' && memberData !== null && 'headline' in memberData && typeof (memberData as Record<string, unknown>).headline === 'string') {
      const headline = (memberData as Record<string, unknown>).headline as string
      if (headline.trim()) {
        // Check for flag emojis in headline
        const flagMatch = headline.match(/🇺🇸|🇬🇧|🇨🇦|🇦🇺|🇩🇪|🇫🇷|🇪🇸|🇮🇹|🇯🇵|🇨🇳|🇮🇳|🇧🇷|🇲🇽|🇰🇷|🇳🇴|🇸🇪|🇩🇰|🇫🇮|🇳🇱|🇨🇴/)
        if (flagMatch) {
          return this.FLAG_TO_COUNTRY[flagMatch[0]] || 'Unknown'
        }

        // Check for location patterns in headline
        for (const pattern of this.LOCATION_PATTERNS) {
          const match = headline.match(pattern)
          if (match && match[1]?.trim()) {
            return match[1].trim()
          }
        }
      }
    }

    return 'Unknown'
  }
}

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

    console.log(`Processing ${base.records.length} members with profile data extraction...`)

    // Add rate limiting to prevent overwhelming the API
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
    
    const records: EnhancedMemberRow[] = await Promise.all(
      base.records.map(async (member, index): Promise<EnhancedMemberRow> => {
        // Add small delay between requests to respect API limits
        if (index > 0) {
          await delay(100 + Math.random() * 200) // 100-300ms delay
        }
        try {
          console.log(`Processing member ${index + 1}/${base.records.length}: ${member.name}`)
          
          // Use public profile API (more reliable than full member details)
          const publicProfile = await getMemberPublicProfile(member.community_member_id)
          console.log(`✓ Public profile fetched for ${member.name}`)

          // Extract location using our professional utility
          const country = LocationExtractor.extractLocation(publicProfile, member)
          
          // Debug logging for location extraction
          if (publicProfile.profile_info?.location) {
            console.log(`📍 Location data for ${member.name}: Raw="${publicProfile.profile_info.location}" -> Extracted="${country}"`)
          } else {
            console.log(`⚠️ No profile_info.location found for ${member.name}, extracted: "${country}"`)
          }
          
          // Extract invitedBy information
          let invitedBy = 'N/A'
          if (publicProfile?.profile_fields?.visible) {
            const invitedField = publicProfile.profile_fields.visible.find((f) => f.key === 'Name_or_account')
            if (invitedField?.community_member_profile_field?.display_value) {
              const invitedValue = invitedField.community_member_profile_field.display_value
              invitedBy = typeof invitedValue === 'string' ? invitedValue : Array.isArray(invitedValue) ? invitedValue.join(', ') : 'N/A'
            }
          }

          console.log(`✓ Processed ${member.name}: Country = ${country}, InvitedBy = ${invitedBy}`)

          return {
            ...member,
            invitedBy,
            country
          }
        } catch (error) {
          console.error(`✗ Error processing member ${member.name}:`, error)
          
          // Fallback: extract basic location from headline if available
          const fallbackCountry = LocationExtractor.extractLocation(null, member)
          
          return {
            ...member,
            invitedBy: 'N/A',
            country: fallbackCountry
          }
        }
      })
    )

    console.log(`✅ Successfully processed all ${records.length} members`)

    return NextResponse.json({ ...base, records })
  } catch (error) {
    console.error('Members list fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch members' },
      { status: 500 }
    )
  }
}


