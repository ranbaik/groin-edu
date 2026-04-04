'use client'
import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { supabase } from '../../lib/supabase'

function PaymentSuccessContent() {
  const params = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [regNum, setRegNum] = useState('')

  useEffect(() => {
    const paymentKey = params.get('paymentKey')
    const orderId    = params.get('orderId')
    const amount     = params.get('amount')

    if (!paymentKey || !orderId || !amount) {
      setStatus('error')
      setMessage('결제 정보가 올바르지 않습니다.')
      return
    }

    // API Route 호출 → 결제 최종 확인 + DB 저장
    fetch('/api/payment/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentKey, orderId, amount: Number(amount) }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setRegNum(data.regNumber || orderId)
          setStatus('success')
        } else {
          setStatus('error')
          setMessage(data.error || '결제 확인 중 오류가 발생했습니다.')
        }
      })
      .catch(() => { setStatus('error'); setMessage('네트워크 오류가 발생했습니다.') })
  }, [params])

  if (status === 'loading') return (
    <div style={{ textAlign: 'center', padding: '80px 24px' }}>
      <div style={{ fontSize: 48, marginBottom: 20 }}>⏳</div>
      <div style={{ fontSize: 18, fontWeight: 700 }}>결제 확인 중...</div>
      <div style={{ color: '#888', marginTop: 8 }}>잠시만 기다려주세요</div>
    </div>
  )

  if (status === 'error') return (
    <div style={{ textAlign: 'center', padding: '80px 24px' }}>
      <div style={{ fontSize: 48, marginBottom: 20 }}>❌</div>
      <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>결제 실패</div>
      <div style={{ color: '#e84c2b', marginBottom: 24 }}>{message}</div>
      <button onClick={() => router.push('/')} style={{ background: '#1a4fd6', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: 6, cursor: 'pointer', fontWeight: 700 }}>
        처음으로 돌아가기
      </button>
    </div>
  )

  return (
    <div style={{ maxWidth: 560, margin: '60px auto', padding: '0 24px', textAlign: 'center' }}>
      <div style={{ width: 80, height: 80, background: '#e8f5e9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, margin: '0 auto 24px' }}>✅</div>
      <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8 }}>결제 완료!</h2>
      <p style={{ color: '#888', marginBottom: 28 }}>수강 등록이 완료되었습니다. 이메일과 문자로 안내를 보내드렸습니다.</p>
      <div style={{ background: '#f0ede6', borderRadius: 8, padding: '16px 20px', textAlign: 'left', marginBottom: 24 }}>
        <div style={{ fontSize: 11, letterSpacing: 2, color: '#888', fontFamily: 'monospace', marginBottom: 10 }}>자동 발송 알림</div>
        {[['📧', '이메일 — 수강 확인 안내', '발송 완료'], ['📱', 'SMS — 등록 완료 알림', '발송 완료'], ['📅', 'Google Calendar — 수업 일정 초대', '발송 완료']].map(([icon, txt, st]) => (
          <div key={txt} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, marginBottom: 8 }}>
            <span>{icon}</span><span style={{ flex: 1 }}>{txt}</span>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: '#e8f5e9', color: '#1a6b33' }}>{st}</span>
          </div>
        ))}
      </div>
      <button onClick={() => router.push('/')} style={{ background: '#1a4fd6', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
        새 과정 신청하기
      </button>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return <Suspense fallback={<div style={{ textAlign: 'center', padding: 80 }}>로딩 중...</div>}><PaymentSuccessContent /></Suspense>
}
