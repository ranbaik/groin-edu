'use client'
import { useState, useEffect } from 'react'
import { loadTossPayments, ANONYMOUS } from '@tosspayments/tosspayments-sdk'
import { getCourses, registerStudent } from '../lib/supabase'

type Course = {
  id: string; category: string; title: string; description: string
  price: number; duration: string; method: string
  capacity: number; enrolled: number; badge: string; instructor: string
}
type Step = 'list' | 'form' | 'payment'

const BADGE_LABEL: Record<string,string> = { hot:'🔥 HOT', new:'✨ NEW', open:'모집중' }
const BADGE_COLOR: Record<string,{bg:string;color:string;border:string}> = {
  hot:  {bg:'#fff3e0',color:'#e65100', border:'#ffcc02'},
  new:  {bg:'#e3f2fd',color:'#1565c0', border:'#90caf9'},
  open: {bg:'#e8f5e9',color:'#1a6b33', border:'#a5d6a7'},
}

export default function Home() {
  const [courses,  setCourses]  = useState<Course[]>([])
  const [loading,  setLoading]  = useState(true)
  const [dbStatus, setDbStatus] = useState('')
  const [step,     setStep]     = useState<Step>('list')
  const [selected, setSelected] = useState<Course | null>(null)
  const [form,     setForm]     = useState({name:'',email:'',phone:'',job:'',purpose:'업무 역량 향상'})
  const [paying,   setPaying]   = useState(false)
  const [payMethod, setPayMethod] = useState('CARD')

  // Supabase 과정 목록 로드
  useEffect(() => {
    getCourses()
      .then(data => {
        setCourses(data)
        setDbStatus(`✅ Supabase 연결 완료 · ${data.length}개 과정`)
        setLoading(false)
      })
      .catch(err => {
        setDbStatus('❌ DB 연결 실패: ' + err.message)
        setLoading(false)
      })
  }, [])

  // 토스페이먼츠 결제창 호출
  async function handleTossPayment() {
    if (!selected) return
    if (!form.name || !form.email || !form.phone) {
      alert('이름, 이메일, 연락처를 입력해주세요.'); return
    }
    setPaying(true)
    try {
      // 1. Supabase에 수강생 먼저 저장
      const student = await registerStudent(form)

      // 2. 토스페이먼츠 SDK 초기화
      const toss = await loadTossPayments(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!)
      const payment = toss.payment({ customerKey: ANONYMOUS })

      // 3. 결제창 호출
      await payment.requestPayment({
        method: 'CARD',
        amount: { currency: 'KRW', value: selected.price },
        orderId: `${selected.id}_${student.id}`,   // courseId_studentId 형식
        orderName: selected.title,
        customerName: form.name,
        customerEmail: form.email,
        customerMobilePhone: form.phone.replace(/-/g, ''),
        successUrl: `${window.location.origin}/payment/success`,
        failUrl:    `${window.location.origin}/payment/fail`,
      })
    } catch (err: any) {
      if (err.code !== 'USER_CANCEL') {
        alert('결제 오류: ' + (err.message || '알 수 없는 오류'))
      }
    } finally {
      setPaying(false)
    }
  }

  return (
    <div style={{fontFamily:'Noto Sans KR,sans-serif',minHeight:'100vh',background:'#f8f6f1'}}>

      {/* HEADER */}
      <header style={{background:'#0a0a0a',color:'#f8f6f1',padding:'0 32px',height:60,display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:'2px solid #1a4fd6',position:'sticky',top:0,zIndex:100}}>
        <div>
          <span style={{fontFamily:'monospace',fontWeight:700,fontSize:18}}>그로인</span>
          <span style={{fontSize:11,color:'#c9a84c',marginLeft:8,letterSpacing:2}}>GROW·IN EDUCATION</span>
        </div>
        <div style={{display:'flex',gap:8}}>
          {(['list','form','payment'] as Step[]).map((s,i) => (
            <div key={s} style={{padding:'4px 12px',borderRadius:4,fontSize:12,background:step===s?'#1a4fd6':'transparent',color:step===s?'#fff':'rgba(255,255,255,0.4)',border:'1px solid',borderColor:step===s?'#1a4fd6':'rgba(255,255,255,0.15)'}}>
              {['과정선택','신청정보','결제'][i]}
            </div>
          ))}
        </div>
      </header>

      {/* ── STEP 1: 과정 목록 ── */}
      {step === 'list' && (
        <div style={{maxWidth:1100,margin:'0 auto',padding:'48px 24px'}}>
          <div style={{background:'#0a0a0a',borderRadius:12,padding:'48px 40px',marginBottom:40}}>
            <div style={{display:'inline-block',background:'#e84c2b',color:'#fff',fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:2,letterSpacing:1,marginBottom:16}}>2025 AI 전문 교육</div>
            <h1 style={{fontSize:40,fontWeight:900,color:'#f8f6f1',letterSpacing:-2,lineHeight:1.1,margin:'0 0 12px'}}>
              당신의 성장을<br/><span style={{color:'#c9a84c'}}>데이터로 증명</span>합니다
            </h1>
            <p style={{color:'rgba(255,255,255,0.6)',fontSize:15,margin:0}}>5월 1일 개강 · 토스페이먼츠 안전 결제</p>
            <div style={{display:'flex',gap:40,marginTop:32,paddingTop:24,borderTop:'1px solid rgba(255,255,255,0.1)'}}>
              {[['1,240+','누적 수강생'],['94%','만족도'],[String(courses.length||'6'),'개설 과정'],['D-27','5월 개강']].map(([n,l])=>(
                <div key={l}><div style={{fontFamily:'monospace',fontSize:28,fontWeight:700,color:'#c9a84c'}}>{n}</div><div style={{fontSize:12,color:'rgba(255,255,255,0.5)',marginTop:2}}>{l}</div></div>
              ))}
            </div>
          </div>

          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
            <h2 style={{fontSize:22,fontWeight:900,letterSpacing:-1}}>5월 개강 과정</h2>
            <span style={{fontSize:12,color:loading?'#888':dbStatus.startsWith('✅')?'#1a8a3c':'#e84c2b'}}>{loading?'⏳ 로딩 중...':dbStatus}</span>
          </div>

          {/* 로딩 스켈레톤 */}
          {loading && (
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:20}}>
              {[1,2,3,4,5,6].map(i=>(
                <div key={i} style={{background:'#fff',borderRadius:10,overflow:'hidden',border:'1px solid rgba(0,0,0,0.08)'}}>
                  <div style={{background:'#f0ede6',height:100,padding:22}}>
                    <div style={{background:'#e0ddd6',height:12,borderRadius:4,width:'40%',marginBottom:10}}/>
                    <div style={{background:'#e0ddd6',height:18,borderRadius:4,width:'75%'}}/>
                  </div>
                  <div style={{padding:22}}>{[90,70,80,60].map((w,j)=><div key={j} style={{background:'#f0f0f0',height:10,borderRadius:4,width:`${w}%`,marginBottom:8}}/>)}</div>
                </div>
              ))}
            </div>
          )}

          {/* 과정 카드 */}
          {!loading && (
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:20}}>
              {courses.map(c => {
                const bc = BADGE_COLOR[c.badge]||BADGE_COLOR.open
                const pct = Math.round(c.enrolled/c.capacity*100)
                const isFull = c.enrolled >= c.capacity
                return (
                  <div key={c.id} style={{background:'#fff',border:'1px solid rgba(0,0,0,0.08)',borderRadius:10,overflow:'hidden',transition:'transform 0.2s,box-shadow 0.2s',cursor:'pointer'}}
                    onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-4px)';e.currentTarget.style.boxShadow='0 12px 40px rgba(0,0,0,0.1)'}}
                    onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='none'}}>
                    <div style={{background:'#f0ede6',padding:'20px 22px',borderBottom:'1px solid rgba(0,0,0,0.08)',position:'relative',minHeight:90}}>
                      <div style={{fontSize:11,fontWeight:700,color:'#1a4fd6',letterSpacing:2,marginBottom:6}}>{c.category}</div>
                      <div style={{fontSize:16,fontWeight:700,lineHeight:1.3}}>{c.title}</div>
                      <div style={{position:'absolute',top:14,right:14,padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:700,background:bc.bg,color:bc.color,border:`1px solid ${bc.border}`}}>{BADGE_LABEL[c.badge]||c.badge}</div>
                    </div>
                    <div style={{padding:'16px 22px'}}>
                      {[['개강일','2025.05.01'],['방식',c.method],['기간',c.duration],['강사',c.instructor]].map(([k,v])=>(
                        <div key={k} style={{display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:7}}>
                          <span style={{color:'#888'}}>{k}</span><span style={{fontWeight:500,fontSize:12}}>{v}</span>
                        </div>
                      ))}
                      <div style={{marginBottom:14}}>
                        <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:4}}>
                          <span style={{color:'#888'}}>수강 현황</span>
                          <span style={{fontWeight:700,color:isFull?'#e84c2b':pct>80?'#e65100':'#1a8a3c'}}>{c.enrolled}/{c.capacity}명</span>
                        </div>
                        <div style={{background:'#eee',borderRadius:3,height:5}}>
                          <div style={{background:isFull?'#e84c2b':pct>80?'#e65100':'#1a4fd6',width:`${Math.min(100,pct)}%`,height:'100%',borderRadius:3,transition:'width 0.5s'}}/>
                        </div>
                      </div>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',paddingTop:14,borderTop:'1px solid rgba(0,0,0,0.08)'}}>
                        <div>
                          <div style={{fontFamily:'monospace',fontSize:20,fontWeight:700,color:'#1a4fd6'}}>₩{c.price.toLocaleString()}</div>
                          <div style={{fontSize:11,color:'#888'}}>VAT 포함</div>
                        </div>
                        <button disabled={isFull} onClick={()=>{setSelected(c);setStep('form')}}
                          style={{background:isFull?'#ccc':'#1a4fd6',color:'#fff',border:'none',padding:'9px 18px',borderRadius:6,fontWeight:700,fontSize:13,cursor:isFull?'not-allowed':'pointer'}}>
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
      {step === 'form' && selected && (
        <div style={{maxWidth:680,margin:'40px auto',padding:'0 24px'}}>
          <div style={{background:'#fff',border:'1px solid rgba(0,0,0,0.1)',borderRadius:12,overflow:'hidden'}}>
            <div style={{background:'#f0ede6',padding:'20px 28px',borderBottom:'1px solid rgba(0,0,0,0.08)'}}>
              <div style={{fontSize:11,color:'#888',marginBottom:4}}>선택하신 과정</div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div style={{fontSize:17,fontWeight:700}}>{selected.title}</div>
                <div style={{fontFamily:'monospace',fontSize:20,fontWeight:700,color:'#1a4fd6'}}>₩{selected.price.toLocaleString()}</div>
              </div>
              <div style={{fontSize:12,color:'#888',marginTop:4}}>개강일: 2025.05.01 · {selected.method} · {selected.duration}</div>
            </div>
            <div style={{padding:28}}>
              {([['이름 *','text','name','홍길동'],['이메일 *','email','email','hong@example.com'],['연락처 *','tel','phone','010-0000-0000'],['직업/소속','text','job','예) ㈜그로인 CTO']] as [string,string,string,string][]).map(([label,type,key,ph])=>(
                <div key={key} style={{marginBottom:16}}>
                  <label style={{display:'block',fontSize:13,fontWeight:700,marginBottom:6}}>{label}</label>
                  <input type={type} placeholder={ph} value={(form as any)[key]}
                    onChange={e=>setForm({...form,[key]:e.target.value})}
                    style={{width:'100%',border:'1.5px solid rgba(0,0,0,0.15)',borderRadius:6,padding:'10px 12px',fontSize:14,outline:'none',boxSizing:'border-box'}}/>
                </div>
              ))}
              <div style={{marginBottom:16}}>
                <label style={{display:'block',fontSize:13,fontWeight:700,marginBottom:8}}>수강 목적 *</label>
                <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                  {['업무 역량 향상','이직/취업 준비','창업/사이드 프로젝트','학문적 관심'].map(p=>(
                    <div key={p} onClick={()=>setForm({...form,purpose:p})}
                      style={{padding:'8px 14px',borderRadius:6,border:'1.5px solid',borderColor:form.purpose===p?'#1a4fd6':'rgba(0,0,0,0.15)',background:form.purpose===p?'#1a4fd6':'#fff',color:form.purpose===p?'#fff':'#333',fontSize:13,cursor:'pointer',fontWeight:form.purpose===p?700:400}}>
                      {p}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',marginTop:24,paddingTop:20,borderTop:'1px solid rgba(0,0,0,0.08)'}}>
                <button onClick={()=>setStep('list')} style={{background:'transparent',border:'1.5px solid rgba(0,0,0,0.2)',padding:'10px 20px',borderRadius:6,cursor:'pointer',fontSize:14}}>← 과정 선택</button>
                <button onClick={()=>{
                  if(!form.name||!form.email||!form.phone){alert('이름, 이메일, 연락처를 입력해주세요.');return}
                  setStep('payment')
                }} style={{background:'#1a4fd6',color:'#fff',border:'none',padding:'10px 28px',borderRadius:6,fontWeight:700,fontSize:14,cursor:'pointer'}}>결제 단계로 →</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 3: 결제 ── */}
      {step === 'payment' && selected && (
        <div style={{maxWidth:860,margin:'40px auto',padding:'0 24px',display:'grid',gridTemplateColumns:'1fr 300px',gap:20}}>
          <div style={{background:'#fff',border:'1px solid rgba(0,0,0,0.1)',borderRadius:12,overflow:'hidden'}}>
            <div style={{background:'#f0ede6',padding:'20px 28px',borderBottom:'1px solid rgba(0,0,0,0.08)'}}>
              <div style={{fontSize:17,fontWeight:700}}>결제 방법 선택</div>
              <div style={{fontSize:13,color:'#888',marginTop:4}}>토스페이먼츠 안전 결제 · 결제 완료 즉시 이메일+문자 발송</div>
            </div>
            <div style={{padding:28}}>
              {([['CARD','💳','신용/체크카드','국내외 모든 카드'],['VIRTUAL_ACCOUNT','🏦','가상계좌 (무통장입금)','실시간 입금 확인'],['EASY_PAY','📱','간편결제','카카오페이·네이버페이·토스페이']] as [string,string,string,string][]).map(([id,icon,name,desc])=>(
                <div key={id} onClick={()=>setPayMethod(id)}
                  style={{display:'flex',alignItems:'center',gap:14,padding:'14px 16px',borderRadius:8,border:'1.5px solid',borderColor:payMethod===id?'#1a4fd6':'rgba(0,0,0,0.12)',background:payMethod===id?'#eff6ff':'#fff',marginBottom:10,cursor:'pointer'}}>
                  <div style={{fontSize:22}}>{icon}</div>
                  <div><div style={{fontWeight:700,fontSize:14}}>{name}</div><div style={{fontSize:12,color:'#888',marginTop:2}}>{desc}</div></div>
                </div>
              ))}

              {/* 토스페이먼츠 결제 버튼 */}
              <div style={{background:'#eff6ff',border:'1px solid #bfdbfe',borderRadius:8,padding:'14px 16px',marginTop:16,marginBottom:20,fontSize:13,color:'#1565c0'}}>
                💡 아래 버튼을 누르면 <b>토스페이먼츠 결제창</b>이 팝업됩니다. 테스트 환경이라 실제 결제는 되지 않습니다.
              </div>

              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',paddingTop:20,borderTop:'1px solid rgba(0,0,0,0.08)'}}>
                <button onClick={()=>setStep('form')} style={{background:'transparent',border:'1.5px solid rgba(0,0,0,0.2)',padding:'10px 20px',borderRadius:6,cursor:'pointer',fontSize:14}}>← 정보 수정</button>
                <button onClick={handleTossPayment} disabled={paying}
                  style={{background:paying?'#999':'#1a4fd6',color:'#fff',border:'none',padding:'12px 28px',borderRadius:6,fontWeight:700,fontSize:15,cursor:paying?'not-allowed':'pointer',minWidth:200}}>
                  {paying ? '⏳ 처리 중...' : `💳 ₩${selected.price.toLocaleString()} 결제하기`}
                </button>
              </div>
            </div>
          </div>

          {/* 결제 요약 */}
          <div style={{background:'#f0ede6',border:'1px solid rgba(0,0,0,0.1)',borderRadius:12,padding:24,height:'fit-content'}}>
            <div style={{fontWeight:700,fontSize:15,marginBottom:16}}>결제 내역</div>
            {[['과정',selected.title],['수강생',form.name],['이메일',form.email],['개강일','2025.05.01'],['방식',selected.method]].map(([k,v])=>(
              <div key={k} style={{display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:10}}>
                <span style={{color:'#888'}}>{k}</span>
                <span style={{fontWeight:500,maxWidth:150,textAlign:'right',fontSize:12}}>{v}</span>
              </div>
            ))}
            <div style={{borderTop:'1px solid rgba(0,0,0,0.15)',paddingTop:14,marginTop:4,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{fontWeight:700}}>최종 결제액</span>
              <span style={{fontFamily:'monospace',fontSize:20,fontWeight:700,color:'#1a4fd6'}}>₩{selected.price.toLocaleString()}</span>
            </div>
            <div style={{marginTop:16,padding:'10px 12px',background:'#fff',borderRadius:6,fontSize:12,color:'#888'}}>
              🔒 토스페이먼츠 보안 결제<br/>결제 정보는 암호화되어 전송됩니다.
            </div>
          </div>
        </div>
      )}

      <footer style={{background:'#0a0a0a',color:'rgba(255,255,255,0.4)',textAlign:'center',padding:20,fontSize:12,marginTop:60}}>
        © 2025 주)그로인 · Powered by Supabase + 토스페이먼츠
      </footer>
    </div>
  )

}
