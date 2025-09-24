import { NextResponse } from "next/server"
import { listInvitationLinks } from "@/lib/circle"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = searchParams.get("page")
    const per_page = searchParams.get("per_page")
    const links = await listInvitationLinks({
      page: page ? Number(page) : undefined,
      per_page: per_page ? Number(per_page) : undefined,
    })
    return NextResponse.json({ invitation_links: links })
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error)?.message || "Failed to fetch invitation links" },
      { status: 500 }
    )
  }
}


