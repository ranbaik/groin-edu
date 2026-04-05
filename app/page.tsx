'use client'
import { useState, useEffect } from 'react'
import { loadTossPayments, ANONYMOUS } from '@tosspayments/tosspayments-sdk'
import { getCourses, registerStudent } from '../lib/supabase'

// ── 딥 네이비 색상 시스템 ──
const C = {
  bg:       '#0d1b2a',   // 최외곽 배경
  bg2:      '#1b2d3f',   // 카드 배경
  bg3:      '#162030',   // 히어로 배경
  navy:     '#0f2027',   // 진한 네이비
  mid:      '#203a43',   // 중간 네이비
  accent:   '#64b5f6',   // 스카이블루 포인트
  accent2:  '#4dd0e1',   // 청록 포인트
  gold:     '#ffd54f',   // 골드 강조
  white:    '#f0f4f8',   // 기본 텍스트
  muted:    'rgba(240,244,248,0.55)',
  border:   'rgba(100,181,246,0.18)',
  border2:  'rgba(100,181,246,0.35)',
  cardBg:   'rgba(255,255,255,0.04)',
  cardHover:'rgba(100,181,246,0.06)',
}

type Course = {
  id: string; category: string; title: string; description: string
  price: number; duration: string; method: string
  capacity: number; enrolled: number; badge: string; instructor: string
}
type Step = 'list' | 'form' | 'payment'

const BADGE_LABEL: Record<string,string> = { hot:'🔥 HOT', new:'✨ NEW', open:'모집중' }
const BADGE_COLOR: Record<string,{bg:string;color:string;border:string}> = {
  hot:  {bg:'rgba(255,213,79,0.15)',  color:'#ffd54f', border:'rgba(255,213,79,0.4)'},
  new:  {bg:'rgba(77,208,225,0.15)',  color:'#4dd0e1', border:'rgba(77,208,225,0.4)'},
  open: {bg:'rgba(100,181,246,0.15)', color:'#64b5f6', border:'rgba(100,181,246,0.4)'},
}

export default function Home() {
  const [courses,   setCourses]   = useState<Course[]>([])
  const [loading,   setLoading]   = useState(true)
  const [dbStatus,  setDbStatus]  = useState('')
  const [step,      setStep]      = useState<Step>('list')
  const [selected,  setSelected]  = useState<Course | null>(null)
  const [form,      setForm]      = useState({name:'',email:'',phone:'',job:'',purpose:'업무 역량 향상'})
  const [paying,    setPaying]    = useState(false)
  const [payMethod, setPayMethod] = useState('CARD')
  const [formError, setFormError] = useState('')

  useEffect(() => {
    getCourses()
      .then(data => { setCourses(data); setDbStatus(`✅ Supabase 연결 · ${data.length}개 과정`); setLoading(false) })
      .catch(err  => { setDbStatus('❌ DB 연결 실패: ' + err.message); setLoading(false) })
  }, [])

  async function handleTossPayment() {
    if (!selected) return
    setPaying(true)
    try {
      const student = await registerStudent(form)
      const toss    = await loadTossPayments(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!)
      const payment = toss.payment({ customerKey: ANONYMOUS })
      await payment.requestPayment({
        method: 'CARD',
        amount: { currency: 'KRW', value: selected.price },
        orderId: `${selected.id}_${student.id}`,
        orderName: selected.title,
        customerName: form.name,
        customerEmail: form.email,
        customerMobilePhone: form.phone.replace(/-/g, ''),
        successUrl: `${window.location.origin}/payment/success`,
        failUrl:    `${window.location.origin}/payment/fail`,
      })
    } catch (err: any) {
      if (err.code !== 'USER_CANCEL') alert('결제 오류: ' + (err.message || '알 수 없는 오류'))
    } finally { setPaying(false) }
  }

  return (
    <div style={{fontFamily:'Noto Sans KR,sans-serif',minHeight:'100vh',background:C.bg,color:C.white}}>

      {/* ── HEADER ── */}
      <header style={{background:'rgba(15,32,39,0.97)',backdropFilter:'blur(8px)',padding:'0 36px',height:64,display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:`1px solid ${C.border2}`,position:'sticky',top:0,zIndex:100}}>
        <a href="https://growin.kr/" target="_blank" rel="noopener noreferrer" style={{display:'flex',alignItems:'center',gap:12,textDecoration:'none'}}>
          <div style={{width:38,height:38,borderRadius:10,background:`linear-gradient(135deg,${C.accent},${C.accent2})`,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:17,color:'#0f2027',fontFamily:'monospace'}}>G</div>
          <div>
            <div style={{fontWeight:900,fontSize:17,color:C.white,letterSpacing:-0.5}}>주식회사 그로인</div>
            <div style={{fontSize:9,color:C.accent,letterSpacing:2.5,fontWeight:700,marginTop:-1}}>GROW·IN AI EDUCATION & CONSULTING</div>
          </div>
        </a>
        <div style={{display:'flex',gap:6}}>
          {(['list','form','payment'] as Step[]).map((s,i) => (
            <div key={s}
              onClick={()=>{
                if(s==='form'&&!selected) return
                if(s==='payment'&&(!selected||!form.name||!form.email||!form.phone)) return
                setStep(s)
              }}
              style={{padding:'6px 16px',borderRadius:6,fontSize:12,fontWeight:700,
                background:step===s?C.accent:'transparent',
                color:step===s?C.navy:C.muted,
                border:`1px solid ${step===s?C.accent:C.border}`,
                cursor:'pointer',transition:'all 0.15s',userSelect:'none' as const}}>
              {['과정선택','신청정보','결제'][i]}
            </div>
          ))}
        </div>
      </header>

      {/* ── STEP 1: 과정 목록 ── */}
      {step === 'list' && (
        <div style={{maxWidth:1100,margin:'0 auto',padding:'52px 24px'}}>

          {/* 히어로 */}
          <div style={{background:`linear-gradient(135deg,${C.bg3},${C.mid})`,borderRadius:16,padding:'56px 48px',marginBottom:48,border:`1px solid ${C.border}`,position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',top:-60,right:-60,width:240,height:240,borderRadius:'50%',background:'rgba(100,181,246,0.05)'}}/>
            <div style={{position:'absolute',bottom:-40,left:40,width:160,height:160,borderRadius:'50%',background:'rgba(77,208,225,0.05)'}}/>
            <div style={{display:'inline-flex',alignItems:'center',gap:8,background:'rgba(100,181,246,0.12)',border:`1px solid ${C.border2}`,borderRadius:20,padding:'5px 14px',marginBottom:24}}>
              <div style={{width:6,height:6,borderRadius:'50%',background:C.accent2}}/>
              <span style={{fontSize:11,fontWeight:700,color:C.accent,letterSpacing:2}}>2026 AI 전문 교육 · 주식회사 그로인</span>
            </div>
            <h1 style={{fontSize:44,fontWeight:900,color:C.white,letterSpacing:-2,lineHeight:1.15,margin:'0 0 16px'}}>
              AI와 수학으로<br/><span style={{color:C.accent}}>비즈니스를 혁신</span>합니다
            </h1>
            <p style={{color:C.muted,fontSize:15,margin:'0 0 6px'}}>인공지능 · 수학 · 데이터분석 전문 교육 및 컨설팅</p>
            <p style={{color:'rgba(240,244,248,0.4)',fontSize:13,margin:0}}>CTO(Transformation) 직강 · 현장 중심 실무 교육 · 기업 맞춤 자문</p>
            <div style={{display:'flex',gap:48,marginTop:40,paddingTop:32,borderTop:`1px solid ${C.border}`}}>
              {[['1,240+','누적 수강생'],['94%','만족도'],[String(courses.length||'6'),'개설 과정'],['2026','개강 연도']].map(([n,l])=>(
                <div key={l}>
                  <div style={{fontFamily:'monospace',fontSize:30,fontWeight:700,color:C.gold}}>{n}</div>
                  <div style={{fontSize:12,color:C.muted,marginTop:3}}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 과정 헤더 */}
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
            <h2 style={{fontSize:22,fontWeight:900,color:C.white,letterSpacing:-1}}>2026 개강 과정</h2>
            <span style={{fontSize:12,color:loading?C.muted:dbStatus.startsWith('✅')?C.accent2:'#ef9a9a',background:C.cardBg,padding:'5px 14px',borderRadius:20,border:`1px solid ${C.border}`}}>
              {loading?'⏳ 로딩 중...':dbStatus}
            </span>
          </div>

          {/* 로딩 스켈레톤 */}
          {loading && (
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(310px,1fr))',gap:20}}>
              {[1,2,3,4,5,6].map(i=>(
                <div key={i} style={{background:C.cardBg,borderRadius:12,overflow:'hidden',border:`1px solid ${C.border}`}}>
                  <div style={{background:'rgba(255,255,255,0.04)',height:100,padding:22}}>
                    <div style={{background:'rgba(255,255,255,0.08)',height:10,borderRadius:4,width:'40%',marginBottom:10}}/>
                    <div style={{background:'rgba(255,255,255,0.06)',height:16,borderRadius:4,width:'75%'}}/>
                  </div>
                  <div style={{padding:20}}>{[80,60,75,55].map((w,j)=><div key={j} style={{background:'rgba(255,255,255,0.05)',height:9,borderRadius:4,width:`${w}%`,marginBottom:9}}/>)}</div>
                </div>
              ))}
            </div>
          )}

          {/* 과정 카드 */}
          {!loading && (
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(310px,1fr))',gap:20}}>
              {courses.map(c => {
                const bc  = BADGE_COLOR[c.badge]||BADGE_COLOR.open
                const pct = Math.round(c.enrolled/c.capacity*100)
                const isFull = c.enrolled >= c.capacity
                return (
                  <div key={c.id}
                    style={{background:C.cardBg,border:`1px solid ${C.border}`,borderRadius:12,overflow:'hidden',transition:'all 0.2s',cursor:'pointer'}}
                    onMouseEnter={e=>{e.currentTarget.style.background=C.cardHover;e.currentTarget.style.borderColor=C.border2;e.currentTarget.style.transform='translateY(-3px)'}}
                    onMouseLeave={e=>{e.currentTarget.style.background=C.cardBg;e.currentTarget.style.borderColor=C.border;e.currentTarget.style.transform='none'}}>
                    {/* 카드 상단 - 파스텔 핑크 배경 + 네이비 텍스트 */}
                    <div style={{background:'#fce4ec',padding:'20px 22px',borderBottom:'1px solid #f8bbd0',position:'relative',minHeight:90}}>
                      <div style={{fontSize:10,fontWeight:700,color:'#c2185b',letterSpacing:2.5,marginBottom:7,textTransform:'uppercase' as const}}>{c.category}</div>
                      <div style={{fontSize:16,fontWeight:700,color:'#0f2027',lineHeight:1.35}}>{c.title}</div>
                      <div style={{position:'absolute',top:14,right:14,padding:'3px 10px',borderRadius:20,fontSize:10,fontWeight:700,background:bc.bg,color:bc.color,border:`1px solid ${bc.border}`}}>{BADGE_LABEL[c.badge]||c.badge}</div>
                    </div>
                    {/* 카드 하단 */}
                    <div style={{padding:'16px 22px'}}>
                      {[['개강일','2026.03.01'],['방식',c.method],['기간',c.duration],['강사',c.instructor]].map(([k,v])=>(
                        <div key={k} style={{display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:8}}>
                          <span style={{color:C.muted}}>{k}</span>
                          <span style={{fontWeight:500,color:C.white,fontSize:12}}>{v}</span>
                        </div>
                      ))}
                      {/* 수강 현황 바 */}
                      <div style={{marginBottom:16}}>
                        <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:5}}>
                          <span style={{color:C.muted}}>수강 현황</span>
                          <span style={{fontWeight:700,color:isFull?'#ef9a9a':pct>80?C.gold:C.accent}}>{c.enrolled}/{c.capacity}명</span>
                        </div>
                        <div style={{background:'rgba(255,255,255,0.08)',borderRadius:3,height:4}}>
                          <div style={{background:isFull?'#ef9a9a':pct>80?C.gold:C.accent,width:`${Math.min(100,pct)}%`,height:'100%',borderRadius:3,transition:'width 0.5s'}}/>
                        </div>
                      </div>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',paddingTop:14,borderTop:`1px solid ${C.border}`}}>
                        <div>
                          <div style={{fontFamily:'monospace',fontSize:20,fontWeight:700,color:C.accent}}>₩{c.price.toLocaleString()}</div>
                          <div style={{fontSize:11,color:C.muted}}>VAT 포함</div>
                        </div>
                        <button disabled={isFull} onClick={()=>{setSelected(c);setStep('form')}}
                          style={{background:isFull?'rgba(255,255,255,0.1)':`linear-gradient(135deg,${C.accent},${C.accent2})`,color:isFull?C.muted:C.navy,border:'none',padding:'9px 20px',borderRadius:8,fontWeight:700,fontSize:13,cursor:isFull?'not-allowed':'pointer'}}>
                          {isFull?'마감':'신청하기'}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── STEP 2: 신청 폼 ── */}
      {step === 'form' && (
        <div style={{maxWidth:680,margin:'44px auto',padding:'0 24px'}}>
          {!selected && (
            <div style={{background:'rgba(255,213,79,0.1)',border:'1px solid rgba(255,213,79,0.3)',borderRadius:8,padding:'14px 18px',marginBottom:16,fontSize:13,color:C.gold}}>
              ⚠️ 과정을 먼저 선택해주세요.
              <button onClick={()=>setStep('list')} style={{marginLeft:12,color:C.accent,background:'none',border:'none',cursor:'pointer',fontWeight:700,fontSize:13}}>과정 선택 →</button>
            </div>
          )}
          <div style={{background:C.cardBg,border:`1px solid ${C.border}`,borderRadius:14,overflow:'hidden'}}>
            {/* 선택 과정 배너 */}
            <div style={{background:'rgba(255,255,255,0.03)',padding:'20px 28px',borderBottom:`1px solid ${C.border}`}}>
              <div style={{fontSize:10,color:C.muted,marginBottom:5,letterSpacing:1}}>선택하신 과정</div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div style={{fontSize:17,fontWeight:700,color:C.white}}>{selected?.title||'과정 미선택'}</div>
                <div style={{fontFamily:'monospace',fontSize:20,fontWeight:700,color:C.accent}}>₩{(selected?.price||0).toLocaleString()}</div>
              </div>
              <div style={{fontSize:12,color:C.muted,marginTop:5}}>개강일: 2026.03.01 · {selected?.method} · {selected?.duration}</div>
            </div>
            <div style={{padding:28}}>
              {([['이름 *','text','name','홍길동'],['이메일 *','email','email','hong@example.com'],['연락처 *','tel','phone','010-0000-0000'],['직업/소속','text','job','예) 주식회사 그로인 CTO']] as [string,string,string,string][]).map(([label,type,key,ph])=>(
                <div key={key} style={{marginBottom:16}}>
                  <label style={{display:'block',fontSize:12,fontWeight:700,marginBottom:6,color:C.muted,letterSpacing:0.5}}>{label}</label>
                  <input type={type} placeholder={ph} value={(form as any)[key]}
                    onChange={e=>{setForm({...form,[key]:e.target.value});setFormError('')}}
                    style={{width:'100%',background:'rgba(255,255,255,0.05)',border:`1.5px solid ${formError&&!((form as any)[key])&&['name','email','phone'].includes(key)?'#ef9a9a':C.border}`,borderRadius:8,padding:'11px 14px',fontSize:14,outline:'none',boxSizing:'border-box' as const,color:C.white}}/>
                </div>
              ))}
              <div style={{marginBottom:16}}>
                <label style={{display:'block',fontSize:12,fontWeight:700,marginBottom:8,color:C.muted,letterSpacing:0.5}}>수강 목적 *</label>
                <div style={{display:'flex',gap:8,flexWrap:'wrap' as const}}>
                  {['업무 역량 향상','이직/취업 준비','창업/사이드 프로젝트','학문적 관심'].map(p=>(
                    <div key={p} onClick={()=>setForm({...form,purpose:p})}
                      style={{padding:'8px 14px',borderRadius:8,border:`1.5px solid ${form.purpose===p?C.accent:C.border}`,background:form.purpose===p?`rgba(100,181,246,0.15)`:'transparent',color:form.purpose===p?C.accent:C.muted,fontSize:12,cursor:'pointer',fontWeight:form.purpose===p?700:400,transition:'all 0.15s'}}>
                      {p}
                    </div>
                  ))}
                </div>
              </div>
              {formError && (
                <div style={{background:'rgba(239,154,154,0.1)',border:'1px solid rgba(239,154,154,0.3)',borderRadius:6,padding:'10px 14px',fontSize:13,color:'#ef9a9a',marginBottom:16}}>
                  ⚠️ {formError}
                </div>
              )}
              <div style={{display:'flex',justifyContent:'space-between',marginTop:24,paddingTop:20,borderTop:`1px solid ${C.border}`}}>
                <button onClick={()=>setStep('list')} style={{background:'transparent',border:`1.5px solid ${C.border}`,color:C.muted,padding:'10px 20px',borderRadius:8,cursor:'pointer',fontSize:13}}>← 과정 선택</button>
                <button onClick={()=>{
                  if(!form.name.trim()){setFormError('이름을 입력해주세요.');return}
                  if(!form.email.trim()){setFormError('이메일을 입력해주세요.');return}
                  if(!form.phone.trim()){setFormError('연락처를 입력해주세요.');return}
                  if(!selected){setFormError('과정을 먼저 선택해주세요.');return}
                  setFormError('');setStep('payment')
                }} style={{background:`linear-gradient(135deg,${C.accent},${C.accent2})`,color:C.navy,border:'none',padding:'10px 28px',borderRadius:8,fontWeight:700,fontSize:14,cursor:'pointer'}}>
                  결제 단계로 →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 3: 결제 ── */}
      {step === 'payment' && (
        <div style={{maxWidth:880,margin:'44px auto',padding:'0 24px',display:'grid',gridTemplateColumns:'1fr 300px',gap:20}}>
          <div style={{background:C.cardBg,border:`1px solid ${C.border}`,borderRadius:14,overflow:'hidden'}}>
            <div style={{background:'rgba(255,255,255,0.03)',padding:'20px 28px',borderBottom:`1px solid ${C.border}`}}>
              <div style={{fontSize:17,fontWeight:700,color:C.white}}>결제 방법 선택</div>
              <div style={{fontSize:12,color:C.muted,marginTop:4}}>토스페이먼츠 안전 결제 · 결제 완료 즉시 이메일+문자 발송</div>
            </div>
            <div style={{padding:28}}>
              {([['CARD','💳','신용/체크카드','국내외 모든 카드'],['VIRTUAL_ACCOUNT','🏦','가상계좌 (무통장입금)','실시간 입금 확인'],['EASY_PAY','📱','간편결제','카카오페이·네이버페이·토스페이']] as [string,string,string,string][]).map(([id,icon,name,desc])=>(
                <div key={id} onClick={()=>setPayMethod(id)}
                  style={{display:'flex',alignItems:'center',gap:14,padding:'14px 16px',borderRadius:10,border:`1.5px solid ${payMethod===id?C.accent:C.border}`,background:payMethod===id?'rgba(100,181,246,0.1)':'transparent',marginBottom:10,cursor:'pointer',transition:'all 0.15s'}}>
                  <div style={{fontSize:22}}>{icon}</div>
                  <div>
                    <div style={{fontWeight:700,fontSize:14,color:C.white}}>{name}</div>
                    <div style={{fontSize:12,color:C.muted,marginTop:2}}>{desc}</div>
                  </div>
                </div>
              ))}
              <div style={{background:'rgba(100,181,246,0.08)',border:`1px solid ${C.border}`,borderRadius:8,padding:'12px 16px',marginTop:16,marginBottom:20,fontSize:12,color:C.accent}}>
                💡 아래 버튼을 누르면 토스페이먼츠 결제창이 팝업됩니다. 테스트 환경이라 실제 결제가 되지 않습니다.
              </div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',paddingTop:20,borderTop:`1px solid ${C.border}`}}>
                <button onClick={()=>setStep('form')} style={{background:'transparent',border:`1.5px solid ${C.border}`,color:C.muted,padding:'10px 20px',borderRadius:8,cursor:'pointer',fontSize:13}}>← 정보 수정</button>
                <button onClick={handleTossPayment} disabled={paying}
                  style={{background:paying?'rgba(255,255,255,0.1)':`linear-gradient(135deg,${C.accent},${C.accent2})`,color:paying?C.muted:C.navy,border:'none',padding:'12px 28px',borderRadius:8,fontWeight:700,fontSize:15,cursor:paying?'not-allowed':'pointer',minWidth:200}}>
                  {paying?'⏳ 처리 중...':`💳 ₩${(selected?.price||0).toLocaleString()} 결제하기`}
                </button>
              </div>
            </div>
          </div>
          {/* 결제 요약 */}
          <div style={{background:'rgba(255,255,255,0.03)',border:`1px solid ${C.border}`,borderRadius:14,padding:24,height:'fit-content'}}>
            <div style={{fontWeight:700,fontSize:15,color:C.white,marginBottom:16}}>결제 내역</div>
            {[['과정',selected?.title||''],['수강생',form.name],['이메일',form.email],['개강일','2026.03.01'],['방식',selected?.method||'']].map(([k,v])=>(
              <div key={k} style={{display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:10}}>
                <span style={{color:C.muted}}>{k}</span>
                <span style={{fontWeight:500,color:C.white,maxWidth:150,textAlign:'right',fontSize:12}}>{v}</span>
              </div>
            ))}
            <div style={{borderTop:`1px solid ${C.border}`,paddingTop:14,marginTop:4,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{fontWeight:700,color:C.white}}>최종 결제액</span>
              <span style={{fontFamily:'monospace',fontSize:20,fontWeight:700,color:C.accent}}>₩{(selected?.price||0).toLocaleString()}</span>
            </div>
            <div style={{marginTop:16,padding:'10px 12px',background:'rgba(255,255,255,0.04)',borderRadius:8,fontSize:12,color:C.muted}}>
              🔒 토스페이먼츠 보안 결제<br/>결제 정보는 암호화되어 전송됩니다.
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer style={{background:'rgba(15,32,39,0.9)',borderTop:`1px solid ${C.border}`,textAlign:'center',padding:'28px 20px',fontSize:12,marginTop:60}}>
        <div style={{fontWeight:700,color:C.accent,fontSize:14,marginBottom:6}}>주식회사 그로인 GROW·IN</div>
        <div style={{color:C.muted}}>인공지능 · 수학 · 데이터분석 교육 및 컨설팅 전문기업</div>
        <div style={{color:'rgba(240,244,248,0.3)',marginTop:4}}>© 2026 주식회사 그로인 · Powered by Supabase + 토스페이먼츠</div>
      </footer>
    </div>
  )
}
