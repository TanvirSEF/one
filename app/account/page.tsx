"use client"

import { useState } from "react"
// import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"

export default function AccountPage() {
  // const router = useRouter()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)
    const res = await fetch("/api/account/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      setError(json?.error || "Unable to update password")
      setLoading(false)
      return
    }
    setSuccess("Password updated. Redirecting to login…")
    setCurrentPassword("")
    setNewPassword("")
    setLoading(false)
    // Force logout and redirect to login
    await signOut({ callbackUrl: "/login" })
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-xl font-semibold">Change password</h1>
        {error && <div className="text-sm text-red-500">{error}</div>}
        {success && <div className="text-sm text-green-600">{success}</div>}
        <div className="flex gap-2">
          <input
            type={showCurrent ? "text" : "password"}
          placeholder="Current password"
          value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full rounded-md border px-3 py-2"
            required
          />
          <button
            type="button"
            className="rounded-md border px-3 py-2 text-sm"
            onClick={() => setShowCurrent((v) => !v)}
          >
            {showCurrent ? "Hide" : "Show"}
          </button>
        </div>
        <div className="flex gap-2">
          <input
            type={showNew ? "text" : "password"}
          placeholder="New password (min 8 characters)"
          value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full rounded-md border px-3 py-2"
            required
            minLength={8}
          />
          <button
            type="button"
            className="rounded-md border px-3 py-2 text-sm"
            onClick={() => setShowNew((v) => !v)}
          >
            {showNew ? "Hide" : "Show"}
          </button>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-black text-white px-3 py-2 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save"}
        </button>
      </form>
    </div>
  )
}


