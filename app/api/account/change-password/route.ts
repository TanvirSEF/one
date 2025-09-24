import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import bcrypt from "bcryptjs"
import { ObjectId } from "mongodb"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { currentPassword, newPassword } = await req.json().catch(() => ({ }))
  if (typeof currentPassword !== "string" || typeof newPassword !== "string") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: "Password too short" }, { status: 400 })
  }

  const client = await clientPromise
  const db = client.db()
  const users = db.collection("users")

  const user = await users.findOne<{ _id: ObjectId; email: string; password?: string }>({ email: session.user.email })
  if (!user || !user.password) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const ok = await bcrypt.compare(currentPassword, user.password)
  if (!ok) {
    return NextResponse.json({ error: "Current password incorrect" }, { status: 400 })
  }

  const hash = await bcrypt.hash(newPassword, 10)
  await users.updateOne({ _id: new ObjectId(user._id) }, { $set: { password: hash } })

  return NextResponse.json({ success: true })
}


