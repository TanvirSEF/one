// lib/circle-headless.ts
import { unstable_cache } from 'next/cache'

export type HeadlessAuthResponse = {
  access_token: string
  refresh_token: string
  access_token_expires_at: string
  refresh_token_expires_at: string
  community_member_id: number
  community_id: number
}

export type HeadlessConfig = {
  baseUrl: string
  apiToken: string
  email: string
  communityId: string
}

export type HeadlessMember = {
  id: number
  user_id: number
  public_uid: string
  email: string
  name: string
  avatar_url: string | null
  large_avatar_url: string | null
  bio: string
  posts_count: number
  comments_count: number
  spaces_count: number
  bookmarks_count: number
  default_space_id: number
  active: boolean
  profile_info: {
    website: string
    location: string
    twitter_url: string
    facebook_url: string
    instagram_url: string
    linkedin_url: string
  }
  roles: {
    admin: boolean
    moderator: boolean
  }
  profile_fields: {
    visible: Array<{
      id: number
      label: string
      key: string
      field_type: string
      community_member_profile_field: {
        id: number
        text: string | null
        textarea: string | null
        display_value: string | string[]
      }
    }>
    not_visible: Array<{
      id: number
      label: string
      key: string
      field_type: string
      community_member_profile_field: {
        id: number
        text: string | null
        textarea: string | null
        display_value: string
      }
    }>
  }
}

export type HeadlessMembersListResponse = {
  page: number
  per_page: number
  has_next_page: boolean
  count: number
  page_count: number
  records: Array<{
    headline: string
    name: string
    roles: {
      admin: boolean
      moderator: boolean
    }
    community_member_id: number
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
  }>
  next_search_after: number[]
}

function getHeadlessConfig(): HeadlessConfig {
  const baseUrl = process.env.CIRCLE_HEADLESS_BASE_URL || 'https://app.circle.so'
  const apiToken = process.env.CIRCLE_API_TOKEN || ''
  const email = process.env.CIRCLE_HEADLESS_EMAIL || ''
  const communityId = process.env.CIRCLE_COMMUNITY_ID || ''

  if (!apiToken) {
    throw new Error('CIRCLE_API_TOKEN is required for headless API')
  }

  if (!email) {
    throw new Error('CIRCLE_HEADLESS_EMAIL is required for headless API authentication')
  }

  if (!communityId) {
    throw new Error('CIRCLE_COMMUNITY_ID is required')
  }

  return { baseUrl, apiToken, email, communityId }
}

// Cache auth tokens for 15 minutes (tokens are valid for ~1 hour)
const getAuthTokenCached = unstable_cache(
  async (): Promise<HeadlessAuthResponse> => {
    const config = getHeadlessConfig()
    
    const response = await fetch(`${config.baseUrl}/api/v1/headless/auth_token`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: config.email,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Failed to authenticate: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`)
    }

    const data: HeadlessAuthResponse = await response.json()
    return data
  },
  ['circle-auth-token'],
  {
    revalidate: 900, // 15 minutes
  }
)

async function headlessFetch<T>(
  path: string, 
  init?: RequestInit
): Promise<T> {
  const config = getHeadlessConfig()
  const auth = await getAuthTokenCached()
  
  const url = `${config.baseUrl}${path}`
  const response = await fetch(url, {
    ...init,
    headers: {
      'Authorization': `Bearer ${auth.access_token}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    cache: 'no-store', // Always fetch fresh data for dashboard
  })

  if (!response.ok) {
    // If token expired, clear cache and retry once
    if (response.status === 401) {
      // Clear the cached auth token
      await fetch('/api/revalidate?tag=circle-auth-token', { method: 'POST' }).catch(() => {})
      
      // Retry with fresh token
      const freshAuth = await getAuthTokenCached()
      const retryResponse = await fetch(url, {
        ...init,
        headers: {
          'Authorization': `Bearer ${freshAuth.access_token}`,
          'Content-Type': 'application/json',
          ...(init?.headers || {}),
        },
        cache: 'no-store',
      })
      
      if (!retryResponse.ok) {
        const errorText = await retryResponse.text().catch(() => '')
        throw new Error(`Circle Headless API Error: ${retryResponse.status} ${retryResponse.statusText} - ${errorText}`)
      }
      
      return await retryResponse.json()
    }
    
    const errorText = await response.text().catch(() => '')
    throw new Error(`Circle Headless API Error: ${response.status} ${response.statusText} - ${errorText}`)
  }

  return await response.json()
}

// API Functions
export async function getMemberProfile(): Promise<HeadlessMember> {
  return await headlessFetch<HeadlessMember>('/api/headless/v1/community_member')
}

export async function listMembers(params?: {
  page?: number
  per_page?: number
  search?: string
}): Promise<HeadlessMembersListResponse> {
  const searchParams = new URLSearchParams()
  
  if (params?.page) searchParams.set('page', String(params.page))
  if (params?.per_page) searchParams.set('per_page', String(params.per_page))
  if (params?.search) searchParams.set('search', params.search)
  
  const query = searchParams.toString()
  const path = `/api/headless/v1/community_members${query ? `?${query}` : ''}`
  
  return await headlessFetch<HeadlessMembersListResponse>(path)
}

export async function getMemberDetails(memberId: number): Promise<HeadlessMember> {
  return await headlessFetch<HeadlessMember>(`/api/headless/v1/community_members/${memberId}`)
}

export type PublicProfileField = {
  id: number
  label: string
  key: string
  field_type: string
  community_member_profile_field: {
    id: number
    text: string | null
    textarea: string | null
    display_value: string | string[]
  }
}

export type PublicProfile = {
  id: number
  headline?: string
  bio?: string
  name?: string
  email?: string
  posts_count?: number
  comments_count?: number
  spaces_count?: number
  bookmarks_count?: number
  can_receive_dm_from_current_member?: boolean
  messaging_enabled?: boolean
  profile_info?: {
    website?: string
    location?: string
    twitter_url?: string
    facebook_url?: string
    instagram_url?: string
    linkedin_url?: string
  }
  roles?: {
    admin: boolean
    moderator: boolean
  }
  member_tags?: Array<{
    id: number
    name: string
    color: string
    is_public: boolean
    is_background_enabled?: boolean
    display_format: string
    display_locations?: Record<string, boolean>
    text_color?: string
    emoji?: string
    custom_emoji_url?: string | null
    custom_emoji_dark_url?: string | null
  }>
  avatar_url?: string
  large_avatar_url?: string
  profile_fields?: {
    visible?: PublicProfileField[]
    not_visible?: PublicProfileField[]
  }
  gamification_stats?: Record<string, unknown>
}

export async function getMemberPublicProfile(memberId: number): Promise<PublicProfile> {
  return await headlessFetch<PublicProfile>(`/api/headless/v1/community_members/${memberId}/public_profile`)
}

// Transform headless API data to dashboard format
export type DashboardMemberRow = {
  id: number
  header: string
  type: string
  status: string
  invitedBy: string
  referrer: string
}

export function transformHeadlessMemberToRow(member: HeadlessMembersListResponse['records'][0]): DashboardMemberRow {
  // Extract broker ID from profile (this would need to be enhanced based on your specific fields)
  const brokerId = 'N/A' // You'll need to extract this from member data when available
  
  // Determine status based on roles and activity
  const status = member.roles.admin ? 'Admin' : 'Active'
  
  // Extract location/country - you might need to get this from member details
  const location = 'Unknown' // This might require a separate API call to get full profile
  
  return {
    id: member.community_member_id,
    header: member.name || 'Unknown Member',
    type: location,
    status: status,
    invitedBy: 'N/A', // This information might not be available in headless API
    referrer: brokerId,
  }
}

export async function getTransformedMembersList(params?: {
  page?: number
  per_page?: number
  search?: string
}): Promise<{ data: DashboardMemberRow[], meta: { page: number, per_page: number, page_count: number, count: number, has_next_page: boolean } }> {
  const response = await listMembers(params)
  
  const data = response.records.map(transformHeadlessMemberToRow)
  const meta = {
    page: response.page,
    per_page: response.per_page,
    page_count: response.page_count,
    count: response.count,
    has_next_page: response.has_next_page,
  }
  
  return { data, meta }
}