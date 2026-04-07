<<<<<<< HEAD
'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const C = {
  bg:      '#0d1b2a',
  bg2:     '#1b2d3f',
  accent:  '#64b5f6',
  accent2: '#4dd0e1',
  gold:    '#ffd54f',
  white:   '#f0f4f8',
  muted:   'rgba(240,244,248,0.55)',
  border:  'rgba(100,181,246,0.18)',
  border2: 'rgba(100,181,246,0.35)',
  cardBg:  'rgba(255,255,255,0.04)',
}

export default function AIReportPage() {
  const [loading,    setLoading]    = useState(false)
  const [report,     setReport]     = useState('')
  const [dbData,     setDbData]     = useState<any>(null)
  const [loadingDb,  setLoadingDb]  = useState(true)
  const [reportType, setReportType] = useState('weekly')

  // DB 데이터 로드
  useEffect(() => {
    Promise.all([
      supabase.from('v_enrollment_detail').select('*'),
      supabase.from('v_revenue_stats').select('*'),
    ]).then(([e, s]) => {
      setDbData({ enrollments: e.data || [], stats: s.data || [] })
      setLoadingDb(false)
    })
  }, [])

  // Claude AI 분석 요청
  async function generateReport() {
    if (!dbData) return
    setLoading(true)
    setReport('')

    const totalRevenue  = dbData.enrollments.filter((e: any) => e.status === 'paid').reduce((s: number, e: any) => s + (e.payment_amount || 0), 0)
    const paidCount     = dbData.enrollments.filter((e: any) => e.status === 'paid').length
    const pendingCount  = dbData.enrollments.filter((e: any) => e.status === 'pending').length
    const courseRevenue = dbData.stats.map((s: any) => `${s.course_title}: ${s.enrolled}명, ₩${(s.total_revenue||0).toLocaleString()}`).join('\n')

    const prompts: Record<string, string> = {
      weekly: `당신은 주식회사 그로인(AI·수학·데이터분석 교육 전문기업)의 데이터 분석 전문가입니다.
아래 이번 주 수강 신청 데이터를 분석하여 경영진을 위한 주간 리포트를 작성해주세요.

[데이터]
- 전체 수강생: ${dbData.enrollments.length}명
- 결제 완료: ${paidCount}명
- 대기 중: ${pendingCount}명
- 총 매출: ₩${totalRevenue.toLocaleString()}
- 과정별 현황:
${courseRevenue}

[요청 사항]
1. 핵심 성과 요약 (3줄)
2. 과정별 분석 및 인사이트
3. 수강생 패턴 분석
4. 이탈 위험 수강생 식별
5. 다음 주 액션 아이템 3가지
6. 매출 증대를 위한 전략 제안

한국어로 작성하고 데이터 기반의 구체적인 인사이트를 제공해주세요.`,

      marketing: `당신은 주식회사 그로인의 마케팅 전략 전문가입니다.
아래 수강 데이터를 분석하여 마케팅 인사이트 리포트를 작성해주세요.

[데이터]
- 전체 수강생: ${dbData.enrollments.length}명
- 결제 완료율: ${Math.round(paidCount/Math.max(dbData.enrollments.length,1)*100)}%
- 총 매출: ₩${totalRevenue.toLocaleString()}
- 과정별 현황:
${courseRevenue}

[요청 사항]
1. 가장 인기 있는 과정 분석
2. 수강생 전환율 개선 방안
3. 타겟 마케팅 전략 (과정별)
4. SNS/온라인 마케팅 액션 플랜
5. 가격 전략 제안

CTO(Transformation) 강연자 관점에서 AI 교육 트렌드와 연계한 인사이트를 포함해주세요.`,

      prediction: `당신은 주식회사 그로인의 데이터 사이언티스트입니다.
현재 수강 데이터를 기반으로 미래 예측 분석을 수행해주세요.

[데이터]
- 전체 수강생: ${dbData.enrollments.length}명
- 결제 완료: ${paidCount}명
- 총 매출: ₩${totalRevenue.toLocaleString()}
- 과정별 현황:
${courseRevenue}

[요청 사항]
1. 다음 달 수강생 수 예측
2. 매출 예측 (낙관/기본/비관 시나리오)
3. 과정별 마감 예상 시기
4. 신규 과정 개설 추천
5. 위험 요인 및 대응 전략

데이터 기반의 구체적인 수치와 함께 분석해주세요.`,
    }

    try {
      // 서버사이드 API Route 호출 (브라우저에서 직접 Anthropic 호출 불가)
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompts[reportType] }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'API 오류')
      setReport(data.result || '분석 결과를 가져올 수 없습니다.')
    } catch (err: any) {
      setReport('오류가 발생했습니다: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // 리포트 복사
  function copyReport() {
    navigator.clipboard.writeText(report)
    alert('클립보드에 복사되었습니다!')
  }

  // 리포트 다운로드
  function downloadReport() {
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `그로인_AI분석_${new Date().toLocaleDateString('ko-KR')}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{fontFamily:'Noto Sans KR,sans-serif',minHeight:'100vh',background:C.bg,color:C.white}}>

      {/* HEADER */}
      <header style={{background:'rgba(15,32,39,0.97)',backdropFilter:'blur(8px)',padding:'0 36px',height:64,display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:`1px solid ${C.border2}`,position:'sticky',top:0,zIndex:100}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <a href="/" style={{display:'flex',alignItems:'center',gap:10,textDecoration:'none'}}>
            <div style={{width:36,height:36,borderRadius:8,background:`linear-gradient(135deg,${C.accent},${C.accent2})`,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:16,color:'#0f2027',fontFamily:'monospace'}}>G</div>
            <div>
              <div style={{fontWeight:900,fontSize:15,color:C.white}}>주식회사 그로인</div>
              <div style={{fontSize:9,color:C.accent,letterSpacing:2,fontWeight:700}}>AI ANALYTICS REPORT</div>
            </div>
          </a>
        </div>
        <div style={{display:'flex',gap:8}}>
          <a href="/admin" style={{padding:'6px 16px',borderRadius:6,fontSize:12,fontWeight:700,color:C.muted,border:`1px solid ${C.border}`,textDecoration:'none'}}>← 관리자 대시보드</a>
        </div>
      </header>

      <div style={{maxWidth:1000,margin:'0 auto',padding:'40px 24px'}}>

        {/* 상단 타이틀 */}
        <div style={{marginBottom:32}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:8,background:'rgba(100,181,246,0.12)',border:`1px solid ${C.border2}`,borderRadius:20,padding:'5px 14px',marginBottom:16}}>
            <div style={{width:6,height:6,borderRadius:'50%',background:C.accent2}}/>
            <span style={{fontSize:11,fontWeight:700,color:C.accent,letterSpacing:2}}>Claude AI 수강생 데이터 분석</span>
          </div>
          <h1 style={{fontSize:32,fontWeight:900,letterSpacing:-1.5,margin:'0 0 8px',color:C.white}}>
            AI 분석 <span style={{color:C.accent}}>리포트</span>
          </h1>
          <p style={{color:C.muted,fontSize:14,margin:0}}>Supabase 실시간 데이터를 Claude AI가 분석하여 경영 인사이트를 제공합니다</p>
        </div>

        {/* 현재 데이터 요약 */}
        {!loadingDb && dbData && (
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:28}}>
            {[
              ['👥', '전체 수강생', dbData.enrollments.length + '명', C.accent],
              ['✅', '결제 완료',   dbData.enrollments.filter((e: any) => e.status==='paid').length + '명', C.accent2],
              ['💰', '총 매출',     '₩' + dbData.enrollments.filter((e: any) => e.status==='paid').reduce((s: number, e: any) => s + (e.payment_amount||0), 0).toLocaleString(), C.gold],
              ['📚', '개설 과정',   dbData.stats.length + '개', C.accent],
            ].map(([icon, label, value, color]) => (
              <div key={String(label)} style={{background:C.cardBg,border:`1px solid ${C.border}`,borderRadius:10,padding:'16px 18px'}}>
                <div style={{fontSize:20,marginBottom:6}}>{icon}</div>
                <div style={{fontSize:11,color:C.muted,marginBottom:3}}>{label}</div>
                <div style={{fontFamily:'monospace',fontSize:20,fontWeight:700,color:String(color)}}>{value}</div>
              </div>
            ))}
          </div>
        )}

        {/* 리포트 타입 선택 */}
        <div style={{background:C.cardBg,border:`1px solid ${C.border}`,borderRadius:12,padding:24,marginBottom:20}}>
          <div style={{fontSize:14,fontWeight:700,color:C.white,marginBottom:16}}>📊 분석 리포트 유형 선택</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:20}}>
            {[
              ['weekly',     '📅 주간 성과 리포트',   '수강 현황·매출·액션 아이템'],
              ['marketing',  '📣 마케팅 인사이트',     '전환율·타겟·전략 제안'],
              ['prediction', '🔮 미래 예측 분석',      '수강생·매출·과정 예측'],
            ].map(([type, title, desc]) => (
              <div key={type} onClick={() => setReportType(type)}
                style={{padding:'14px 16px',borderRadius:8,border:`1.5px solid ${reportType===type?C.accent:C.border}`,background:reportType===type?'rgba(100,181,246,0.1)':'transparent',cursor:'pointer',transition:'all 0.15s'}}>
                <div style={{fontSize:14,fontWeight:700,color:reportType===type?C.accent:C.white,marginBottom:4}}>{title}</div>
                <div style={{fontSize:11,color:C.muted}}>{desc}</div>
              </div>
            ))}
          </div>

          <button onClick={generateReport} disabled={loading||loadingDb}
            style={{width:'100%',background:loading?'rgba(255,255,255,0.1)':`linear-gradient(135deg,${C.accent},${C.accent2})`,color:loading?C.muted:'#0f2027',border:'none',padding:'14px',borderRadius:8,fontWeight:900,fontSize:15,cursor:loading?'not-allowed':'pointer',transition:'all 0.15s'}}>
            {loading ? '🤖 Claude AI 분석 중...' : '🚀 AI 분석 시작'}
          </button>
        </div>

        {/* 분석 결과 */}
        {(loading || report) && (
          <div style={{background:C.cardBg,border:`1px solid ${C.border}`,borderRadius:12,overflow:'hidden'}}>
            <div style={{background:'rgba(255,255,255,0.03)',padding:'16px 24px',borderBottom:`1px solid ${C.border}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div style={{fontWeight:700,color:C.white,fontSize:15}}>
                🤖 Claude AI 분석 결과
              </div>
              {report && (
                <div style={{display:'flex',gap:8}}>
                  <button onClick={copyReport} style={{padding:'6px 14px',borderRadius:6,fontSize:12,fontWeight:700,background:'rgba(100,181,246,0.1)',color:C.accent,border:`1px solid ${C.border}`,cursor:'pointer'}}>
                    📋 복사
                  </button>
                  <button onClick={downloadReport} style={{padding:'6px 14px',borderRadius:6,fontSize:12,fontWeight:700,background:`linear-gradient(135deg,${C.accent},${C.accent2})`,color:'#0f2027',border:'none',cursor:'pointer'}}>
                    📥 다운로드
                  </button>
                </div>
              )}
            </div>
            <div style={{padding:28}}>
              {loading && (
                <div style={{textAlign:'center',padding:'40px 0',color:C.muted}}>
                  <div style={{fontSize:40,marginBottom:16}}>🤖</div>
                  <div style={{fontSize:15,fontWeight:700,color:C.accent,marginBottom:8}}>Claude AI가 데이터를 분석하고 있습니다...</div>
                  <div style={{fontSize:13,color:C.muted}}>Supabase 데이터 기반 인사이트 생성 중</div>
                </div>
              )}
              {report && (
                <div style={{fontSize:14,lineHeight:1.9,color:C.white,whiteSpace:'pre-wrap' as const}}>
                  {report}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <footer style={{background:'rgba(15,32,39,0.9)',borderTop:`1px solid ${C.border}`,textAlign:'center',padding:'20px',fontSize:12,marginTop:60,color:C.muted}}>
        © 2026 주식회사 그로인 · AI Analytics Dashboard · Powered by Claude AI + Supabase
      </footer>
    </div>
  )
}
=======

>>>>>>> 87d9eb0287591b0e003771fd4cb581ec973c5e10
