'use client'
import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense } from 'react'

function FailContent() {
  const params = useSearchParams()
  const router = useRouter()
  const message = params.get('message') || '결제가 취소되었습니다.'
  const code    = params.get('code') || ''

  return (
    <div style={{maxWidth:480,margin:'80px auto',padding:'0 24px',textAlign:'center',fontFamily:'Noto Sans KR,sans-serif'}}>
      <div style={{fontSize:60,marginBottom:20}}>❌</div>
      <h2 style={{fontSize:24,fontWeight:900,marginBottom:8}}>결제 실패</h2>
      <p style={{color:'#888',marginBottom:8}}>{message}</p>
      {code && <p style={{fontSize:12,color:'#ccc',marginBottom:28}}>오류 코드: {code}</p>}
      <div style={{display:'flex',gap:12,justifyContent:'center'}}>
        <button onClick={()=>router.back()} style={{background:'transparent',border:'1.5px solid rgba(0,0,0,0.2)',padding:'11px 24px',borderRadius:6,cursor:'pointer',fontSize:14}}>← 다시 시도</button>
        <button onClick={()=>router.push('/')} style={{background:'#1a4fd6',color:'#fff',border:'none',padding:'11px 24px',borderRadius:6,cursor:'pointer',fontWeight:700,fontSize:14}}>처음으로</button>
      </div>
    </div>
  )
}

export default function PaymentFailPage() {
  return <Suspense fallback={<div style={{textAlign:'center',padding:80}}>로딩 중...</div>}><FailContent /></Suspense>
}
