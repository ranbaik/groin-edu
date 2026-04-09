// ============================================================
// middleware.ts  (C:\groin-edu\ 루트에 저장)
// 로그인 없이 /admin, /report 접근 차단
// ============================================================
import { NextRequest, NextResponse } from 'next/server'

const PROTECTED = ['/admin', '/report']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 보호된 경로인지 확인
  const isProtected = PROTECTED.some(p => pathname.startsWith(p))
  if (!isProtected) return NextResponse.next()

  // 쿠키에서 세션 확인 (고정 관리자 계정 또는 Supabase 세션)
  const token = request.cookies.get('admin-token')?.value ||
                request.cookies.get('sb-access-token')?.value ||
                request.cookies.get('supabase-auth-token')?.value

  if (!token) {
    // 로그인 페이지로 리다이렉트
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/report/:path*'],
}
