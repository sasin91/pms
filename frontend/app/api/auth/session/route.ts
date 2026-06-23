import { type NextRequest, NextResponse } from "next/server"

export function GET(request: NextRequest) {
  const token = request.cookies.get("pms_session")?.value
  if (!token) return new Response(null, { status: 401 })

  try {
    const { role } = JSON.parse(
      Buffer.from(token.split(".")[1], "base64url").toString(),
    ) as { role: "admin" | "user" }

    return NextResponse.json({ role })
  } catch {
    return new Response(null, { status: 401 })
  }
}
