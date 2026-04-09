'use client'
import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const C = {
  bg:     '0D1B2A', navy2: '1B2D3F',
  accent: '64B5F6', teal:  '4DD0E1',
  gold:   'FFD54F', white: 'F0F4F8',
  muted:  'rgba(240,244,248,0.55)',
  border: 'rgba(100,181,246,0.25)',
}

function LoginContent() {
  const router = useRouter()
  const params = useSearchParams()
  const redirect = params.get('redirect') || '/admin'

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [mode,     setMode]     = useState<'login'|'signup'>('login')
  const [success,  setSuccess]  = useState('')

  async function handleSubmit() {
    if (!email || !password) { setError('이메일과 비밀번호를 입력해주세요.'); return }
    setLoading(true); setError('')

    if (mode === 'login') {
      // 고정 관리자 계정 체크
      if (email === 'admin@growin.kr' && password === 'growin2026!') {
        document.cookie = `admin-token=growin-admin-session; path=/; max-age=${60*60*24*7}`
        router.push(redirect)
        setLoading(false)
        return
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError('이메일 또는 비밀번호가 올바르지 않습니다.'); setLoading(false); return }
      router.push(redirect)
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) { setError(error.message); setLoading(false); return }
      setSuccess('가입 완료! 이메일을 확인하거나 바로 로그인해주세요.')
      setMode('login')
    }
    setLoading(false)
  }

  return (
    <div style={{fontFamily:'Noto Sans KR,sans-serif',minHeight:'100vh',background:'#0D1B2A',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>

      {/* 배경 장식 */}
      <div style={{position:'fixed',top:-100,right:-100,width:400,height:400,borderRadius:'50%',background:'rgba(100,181,246,0.04)',pointerEvents:'none'}}/>
      <div style={{position:'fixed',bottom:-80,left:-80,width:300,height:300,borderRadius:'50%',background:'rgba(77,208,225,0.04)',pointerEvents:'none'}}/>

      {/* 로고 */}
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:40}}>
        <a href="/" style={{display:'flex',alignItems:'center',gap:12,textDecoration:'none'}}>
          <div style={{width:44,height:44,borderRadius:12,background:'linear-gradient(135deg,#64B5F6,#4DD0E1)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:20,color:'#0f2027',fontFamily:'monospace'}}>G</div>
          <div>
            <div style={{fontWeight:900,fontSize:18,color:'#F0F4F8'}}>주식회사 그로인</div>
            <div style={{fontSize:10,color:'#64B5F6',letterSpacing:2,fontWeight:700}}>GROW·IN AI EDUCATION</div>
          </div>
        </a>
      </div>

      {/* 로그인 카드 */}
      <div style={{background:'rgba(27,45,63,0.9)',border:'1px solid rgba(100,181,246,0.25)',borderRadius:16,padding:'40px 40px',width:'100%',maxWidth:420,backdropFilter:'blur(8px)'}}>

        {/* 탭 */}
        <div style={{display:'flex',marginBottom:28,background:'rgba(255,255,255,0.04)',borderRadius:8,padding:4}}>
          {(['login','signup'] as const).map(m => (
            <div key={m} onClick={()=>{setMode(m);setError('');setSuccess('')}}
              style={{flex:1,padding:'8px 0',borderRadius:6,textAlign:'center',fontSize:14,fontWeight:700,cursor:'pointer',
                background:mode===m?'rgba(100,181,246,0.2)':'transparent',
                color:mode===m?'#64B5F6':'rgba(240,244,248,0.5)',
                transition:'all 0.15s'}}>
              {m==='login'?'로그인':'회원가입'}
            </div>
          ))}
        </div>

        <div style={{fontSize:22,fontWeight:900,color:'#F0F4F8',marginBottom:6}}>
          {mode==='login'?'관리자 로그인':'계정 만들기'}
        </div>
        <div style={{fontSize:13,color:'rgba(240,244,248,0.5)',marginBottom:28}}>
          {mode==='login'?'그로인 교육 플랫폼 관리자 전용':'관리자 계정을 새로 만듭니다'}
        </div>

        {/* 입력 필드 */}
        <div style={{marginBottom:16}}>
          <label style={{display:'block',fontSize:12,fontWeight:700,color:'rgba(240,244,248,0.6)',marginBottom:6,letterSpacing:0.5}}>이메일</label>
          <input
            type="email"
            placeholder="contact@growin.kr"
            value={email}
            onChange={e=>setEmail(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&handleSubmit()}
            style={{width:'100%',background:'rgba(255,255,255,0.05)',border:'1.5px solid rgba(100,181,246,0.2)',borderRadius:8,padding:'12px 14px',fontSize:14,color:'#F0F4F8',outline:'none',boxSizing:'border-box' as const}}
          />
        </div>
        <div style={{marginBottom:8}}>
          <label style={{display:'block',fontSize:12,fontWeight:700,color:'rgba(240,244,248,0.6)',marginBottom:6,letterSpacing:0.5}}>비밀번호</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e=>setPassword(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&handleSubmit()}
            style={{width:'100%',background:'rgba(255,255,255,0.05)',border:'1.5px solid rgba(100,181,246,0.2)',borderRadius:8,padding:'12px 14px',fontSize:14,color:'#F0F4F8',outline:'none',boxSizing:'border-box' as const}}
          />
        </div>

        {/* 에러 / 성공 메시지 */}
        {error && (
          <div style={{background:'rgba(239,154,154,0.1)',border:'1px solid rgba(239,154,154,0.3)',borderRadius:6,padding:'10px 14px',fontSize:13,color:'#ef9a9a',marginBottom:16,marginTop:8}}>
            ⚠️ {error}
          </div>
        )}
        {success && (
          <div style={{background:'rgba(77,208,225,0.1)',border:'1px solid rgba(77,208,225,0.3)',borderRadius:6,padding:'10px 14px',fontSize:13,color:'#4DD0E1',marginBottom:16,marginTop:8}}>
            ✅ {success}
          </div>
        )}

        {/* 로그인 버튼 */}
        <button onClick={handleSubmit} disabled={loading}
          style={{width:'100%',background:loading?'rgba(255,255,255,0.1)':`linear-gradient(135deg,#64B5F6,#4DD0E1)`,
            color:loading?'rgba(240,244,248,0.4)':'#0f2027',
            border:'none',padding:'13px',borderRadius:8,fontWeight:900,fontSize:15,
            cursor:loading?'not-allowed':'pointer',marginTop:8,transition:'all 0.15s'}}>
          {loading?'처리 중...':(mode==='login'?'🔐 로그인':'✨ 가입하기')}
        </button>

        {/* 구분선 */}
        <div style={{display:'flex',alignItems:'center',gap:12,margin:'20px 0'}}>
          <div style={{flex:1,height:1,background:'rgba(100,181,246,0.15)'}}/>
          <span style={{fontSize:12,color:'rgba(240,244,248,0.3)'}}>또는</span>
          <div style={{flex:1,height:1,background:'rgba(100,181,246,0.15)'}}/>
        </div>

        {/* Google 로그인 */}
        <button onClick={async()=>{
          await supabase.auth.signInWithOAuth({
            provider:'google',
            options:{ redirectTo: `${window.location.origin}/auth/callback?redirect=${redirect}` }
          })
        }}
          style={{width:'100%',background:'rgba(255,255,255,0.06)',border:'1px solid rgba(100,181,246,0.2)',
            color:'#F0F4F8',padding:'12px',borderRadius:8,fontWeight:700,fontSize:14,
            cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:10}}>
          <span style={{fontSize:18}}>G</span> Google 계정으로 로그인
        </button>

        {/* 수강 신청으로 돌아가기 */}
        <div style={{textAlign:'center',marginTop:24,fontSize:13,color:'rgba(240,244,248,0.4)'}}>
          <a href="/" style={{color:'#64B5F6',textDecoration:'none',fontWeight:700}}>← 수강 신청 페이지로 돌아가기</a>
        </div>
      </div>

      {/* 안내 문구 */}
      <div style={{marginTop:24,fontSize:12,color:'rgba(240,244,248,0.3)',textAlign:'center'}}>
        관리자 계정 문의: contact@growin.kr
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{background:'#0D1B2A',minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',color:'#F0F4F8'}}>로딩 중...</div>}>
      <LoginContent />
    </Suspense>
  )
}
