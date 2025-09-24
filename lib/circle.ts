// Minimal Circle Admin API client with typed helpers
// Reads configuration from environment variables

export type CircleClientConfig = {
  baseUrl?: string
  apiToken: string
  authScheme?: "bearer" | "token" | "x-api-token"
  communityId?: string | number
}

export function getCircleConfig(): CircleClientConfig {
  const baseUrl = process.env.CIRCLE_ADMIN_BASE_URL || "https://app.circle.so"
  const apiToken = process.env.CIRCLE_API_TOKEN || ""
  const communityId = process.env.CIRCLE_COMMUNITY_ID
  const authScheme = (process.env.CIRCLE_ADMIN_AUTH_SCHEME || "bearer") as
    | "bearer"
    | "token"
    | "x-api-token"

  if (!apiToken) {
    throw new Error(
      "CIRCLE_API_TOKEN is not set. Add it to your environment variables."
    )
  }

  return {
    baseUrl,
    apiToken,
    authScheme,
    communityId,
  }
}

function buildHeaders(cfg: CircleClientConfig): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  }

  switch (cfg.authScheme) {
    case "token":
      // Some Circle Admin deployments use Rails-style token auth
      headers["Authorization"] = `Token token=${cfg.apiToken}`
      break
    case "x-api-token":
      headers["X-API-Token"] = cfg.apiToken
      break
    case "bearer":
    default:
      headers["Authorization"] = `Bearer ${cfg.apiToken}`
      break
  }

  return headers
}

async function circleFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const cfg = getCircleConfig()
  const url = `${cfg.baseUrl}${path}`
  const res = await fetch(url, {
    ...init,
    headers: {
      ...buildHeaders(cfg),
      ...(init?.headers || {}),
    },
    // Revalidate frequently by default when used in Next.js App Router
    cache: "no-store",
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Circle API ${res.status} ${res.statusText}: ${text}`)
  }

  return (await res.json()) as T
}

// ---- Types (best-effort, narrow to what we render) ----

export type CircleMember = {
  id: number
  first_name?: string
  last_name?: string
  name?: string
  email?: string
  country?: string
  country_code?: string
  country_name?: string
  location?: string
  status?: string
  invitation_link_id?: number | null
  invitation_link?: { id?: number; name?: string; creator?: { name?: string } | null; created_by?: { name?: string } | null } | null
  invited_by?: { id: number; name?: string } | null
  invited_by_member?: { id: number; name?: string } | null
  invited_by_user?: { id: number; name?: string } | null
}

export type CircleMembersResponse = {
  community_members?: CircleMember[]
  members?: CircleMember[]
  data?: CircleMember[]
  records?: CircleMember[]
  page?: number
  per_page?: number
  page_count?: number
  count?: number
  has_next_page?: boolean
}

export type CircleInvitationLink = {
  id: number
  url?: string
  code?: string
  created_at?: string
  revoked_at?: string | null
  creator?: { id: number; name?: string } | null
  created_by?: { id: number; name?: string } | null
  usage_count?: number
  name?: string
}

export type CircleInvitationLinksResponse = {
  invitation_links?: CircleInvitationLink[]
  data?: CircleInvitationLink[]
  records?: CircleInvitationLink[]
  page?: number
  per_page?: number
  page_count?: number
  count?: number
  has_next_page?: boolean
}

// ---- Public helpers ----

// Generic list normalizer to accommodate admin v2 shape variations
function unwrapContainer<T extends Record<string, unknown>>(item: unknown): T {
  if (item && typeof item === "object") {
    const keys = Object.keys(item)
    if (keys.length === 1 && typeof (item as Record<string, unknown>)[keys[0]] === "object") {
      return (item as Record<string, unknown>)[keys[0]] as T
    }
  }
  return item as T
}

function pickItemsArray(res: unknown): unknown[] {
  if (!res || typeof res !== "object") return []
  const resObj = res as Record<string, unknown>
  const candidates = [
    resObj.records,
    resObj.community_members,
    resObj.members,
    resObj.data,
    resObj.items,
    resObj.list,
  ]
  for (const arr of candidates) {
    if (Array.isArray(arr)) return arr
  }
  // Fallback: if any property is an array, use the first one
  for (const key of Object.keys(resObj)) {
    const val = resObj[key]
    if (Array.isArray(val)) return val
  }
  return []
}

export async function listInvitationLinks(params?: {
  page?: number
  per_page?: number
}): Promise<CircleInvitationLink[]> {
  const cfg = getCircleConfig()
  const searchParams = new URLSearchParams()
  if (params?.page) searchParams.set("page", String(params.page))
  if (params?.per_page) searchParams.set("per_page", String(params.per_page))
  if (cfg.communityId) searchParams.set("community_id", String(cfg.communityId))
  const query = searchParams.toString()

  const res = await circleFetch<CircleInvitationLinksResponse>(
    `/api/admin/v2/invitation_links${query ? `?${query}` : ""}`
  )

  const records = (res as CircleInvitationLinksResponse).invitation_links || pickItemsArray(res)
  return (records as unknown[]).map((r) => unwrapContainer<CircleInvitationLink>(r))
}

export async function listCommunityMembers(params?: {
  page?: number
  per_page?: number
  search?: string
}): Promise<CircleMember[]> {
  const cfg = getCircleConfig()
  const searchParams = new URLSearchParams()
  if (params?.page) searchParams.set("page", String(params.page))
  if (params?.per_page) searchParams.set("per_page", String(params.per_page))
  if (params?.search) searchParams.set("search", params.search)
  if (cfg.communityId) searchParams.set("community_id", String(cfg.communityId))
  const query = searchParams.toString()

  const res = await circleFetch<CircleMembersResponse>(
    `/api/admin/v2/community_members${query ? `?${query}` : ""}`
  )

  const arr = pickItemsArray(res)
  return arr.map((r) => unwrapContainer<CircleMember>(r))
}

export async function listCommunityMembersWithMeta(params?: {
  page?: number
  per_page?: number
  search?: string
}): Promise<{ items: CircleMember[]; meta: Pick<CircleMembersResponse, "page" | "per_page" | "page_count" | "count" | "has_next_page"> }> {
  const cfg = getCircleConfig()
  const searchParams = new URLSearchParams()
  if (params?.page) searchParams.set("page", String(params.page))
  if (params?.per_page) searchParams.set("per_page", String(params.per_page))
  if (params?.search) searchParams.set("search", params.search)
  if (cfg.communityId) searchParams.set("community_id", String(cfg.communityId))
  const query = searchParams.toString()

  const res = await circleFetch<CircleMembersResponse>(
    `/api/admin/v2/community_members${query ? `?${query}` : ""}`
  )

  const items = pickItemsArray(res).map((r) => unwrapContainer<CircleMember>(r))
  const meta = {
    page: res.page,
    per_page: res.per_page,
    page_count: res.page_count,
    count: res.count,
    has_next_page: res.has_next_page,
  }
  return { items: items as CircleMember[], meta }
}

// Utility to map to the dashboard table schema
export type DashboardMemberRow = {
  id: number
  header: string
  type: string
  status: string
  invitedBy: string
  referrer: string
}

export function mapMemberToRow(
  member: CircleMember,
  inviteByLookup?: Map<number, string>
): DashboardMemberRow {
  const name =
    member.name ||
    [member.first_name, member.last_name].filter(Boolean).join(" ") ||
    member.email ||
    `Member ${member.id}`

  const invitedByName =
    member.invited_by?.name ||
    member.invited_by_member?.name ||
    member.invited_by_user?.name ||
    "-"

  const refFromObj = member.invitation_link?.name || member.invitation_link?.creator?.name || member.invitation_link?.created_by?.name
  const refFromId = member.invitation_link_id ? inviteByLookup?.get(member.invitation_link_id) : undefined
  const referrerLabel = refFromObj || refFromId || "-"

  const country =
    member.country ||
    member.country_name ||
    member.country_code ||
    member.location ||
    "Unknown"

  return {
    id: member.id,
    header: name,
    type: country,
    status: normalizeStatus(member.status),
    invitedBy: invitedByName,
    referrer: referrerLabel,
  }
}

function normalizeStatus(status?: string): string {
  if (!status) return "Active"
  const s = status.toLowerCase()
  if (s.includes("pending")) return "Pending"
  if (s.includes("inactive") || s.includes("deactivated")) return "Inactive"
  return "Active"
}


