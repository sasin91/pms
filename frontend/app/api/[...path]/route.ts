import { type NextRequest, NextResponse } from "next/server"

const API_URL = process.env.API_URL ?? "http://localhost:3000"

async function proxy(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params
  const url = new URL(path.join("/"), `${API_URL}/`)
  url.search = request.nextUrl.search

  const headers = new Headers(request.headers)
  headers.delete("cookie")
  headers.delete("host")

  const token = request.cookies.get("pms_session")?.value
  if (token) headers.set("authorization", `Bearer ${token}`)

  const response = await fetch(url, {
    method: request.method,
    headers,
    body:
      request.method === "GET" || request.method === "HEAD"
        ? undefined
        : await request.arrayBuffer(),
  })

  if (path.join("/") !== "auth/login" || !response.ok) {
    return new Response(response.body, {
      status: response.status,
      headers: response.headers,
    })
  }

  const body = (await response.json()) as {
    token: string
    user: { email: string; role: "admin" | "user" }
  }
  const result = NextResponse.json({ user: body.user }, { status: response.status })
  const rememberMe = request.headers.get("x-pms-remember-me") === "true"
  const expires = rememberMe
    ? new Date(
        JSON.parse(
          Buffer.from(body.token.split(".")[1], "base64url").toString(),
        ).exp * 1000,
      )
    : undefined

  result.cookies.set("pms_session", body.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  })

  return result
}

export const GET = proxy
export const POST = proxy
export const PUT = proxy
export const PATCH = proxy
export const DELETE = proxy
