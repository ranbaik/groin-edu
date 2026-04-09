// ============================================================
// components/AuthHeader.tsx
// 로그인 상태 표시 + 로그아웃 버튼 (admin, report 페이지용)
// ============================================================
'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const C = {
  accent: '#64B5F6', teal: '#4DD0E1',
  white:  '#F0F4F8', muted: 'rgba(240,244,248,0.55)',
  border: 'rgba(100,181,246,0.25)', navy2: '#1B2D3F',
}

export default function AuthHeader({ currentPage }: { currentPage: string }) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user || null)
      if (!session) router.push('/login')
    })
    return () => listener.subscription.unsubscribe()
  }, [router])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div style={{display:'flex',alignItems:'center',gap:8}}>
      {/* 페이지 이동 버튼 */}
      {currentPage !== 'admin' && (
        <a href="/admin" style={{padding:'6px 14px',borderRadius:6,fontSize:12,fontWeight:700,color:C.muted,border:`1px solid ${C.border}`,textDecoration:'none'}}>
          관리자
        </a>
      )}
      {currentPage !== 'report' && (
        <a href="/report" style={{padding:'6px 14px',borderRadius:6,fontSize:12,fontWeight:700,color:C.muted,border:`1px solid ${C.border}`,textDecoration:'none'}}>
          AI 리포트
        </a>
      )}
      <a href="/" style={{padding:'6px 14px',borderRadius:6,fontSize:12,fontWeight:700,color:C.muted,border:`1px solid ${C.border}`,textDecoration:'none'}}>
        수강 신청
      </a>

      {/* 사용자 정보 + 로그아웃 */}
      {user && (
        <div style={{display:'flex',alignItems:'center',gap:8,marginLeft:8,paddingLeft:12,borderLeft:`1px solid ${C.border}`}}>
          <div style={{fontSize:12,color:C.muted,maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
            {user.email}
          </div>
          <button onClick={handleLogout}
            style={{padding:'6px 14px',borderRadius:6,fontSize:12,fontWeight:700,background:'rgba(239,154,154,0.1)',color:'#ef9a9a',border:'1px solid rgba(239,154,154,0.3)',cursor:'pointer'}}>
            로그아웃
          </button>
        </div>
      )}
    </div>
  )
}
