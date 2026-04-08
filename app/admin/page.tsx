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

type Enrollment = {
  reg_number: string
  student_name: string
  email: string
  phone: string
  course_title: string
  category: string
  payment_amount: number
  payment_method: string
  status: string
  applied_at: string
}

type Stat = {
  course_title: string
  category: string
  enrolled: number
  capacity: number
  total_revenue: number
}

export default function AdminPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [stats,       setStats]       = useState<Stat[]>([])
  const [loading,     setLoading]     = useState(true)
  const [search,      setSearch]      = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [tab,         setTab]         = useState<'list' | 'stats'>('list')

  useEffect(() => {
    Promise.all([
      supabase.from('v_enrollment_detail').select('*').order('applied_at', { ascending: false }),
      supabase.from('v_revenue_stats').select('*'),
    ]).then(([e, s]) => {
      setEnrollments(e.data || [])
      setStats(s.data || [])
      setLoading(false)
    })
  }, [])

  // ?ÑÌÑ∞Îß?
  const filtered = enrollments.filter(e => {
    const matchSearch = !search ||
      e.student_name?.includes(search) ||
      e.email?.includes(search) ||
      e.course_title?.includes(search) ||
      e.reg_number?.includes(search)
    const matchStatus = filterStatus === 'all' || e.status === filterStatus
    return matchSearch && matchStatus
  })

  // ?µÍ≥Ñ Í≥ÑÏÇ∞
  const totalRevenue  = enrollments.filter(e => e.status === 'paid').reduce((s, e) => s + (e.payment_amount || 0), 0)
  const totalStudents = enrollments.length
  const paidCount     = enrollments.filter(e => e.status === 'paid').length

  // CSV ?§Ïö¥Î°úÎìú
  function downloadCSV() {
    const headers = ['?±Î°ùÎ≤àÌò∏', '?¥Î¶Ñ', '?¥Î©î??, '?∞ÎùΩÏ≤?, 'Í≥ºÏ†ïÎ™?, 'Í≤∞Ï†úÍ∏àÏï°', 'Í≤∞Ï†úÎ∞©Î≤ï', '?ÅÌÉú', '?†Ï≤≠??]
    const rows = filtered.map(e => [
      e.reg_number, e.student_name, e.email, e.phone,
      e.course_title, e.payment_amount, e.payment_method, e.status,
      new Date(e.applied_at).toLocaleDateString('ko-KR')
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a'); a.href = url
    a.download = `Í∑∏Î°ú???òÍ∞ï??${new Date().toLocaleDateString('ko-KR')}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  const statusBadge = (s: string) => {
    const map: Record<string, {bg:string;color:string;label:string}> = {
      paid:    {bg:'rgba(77,208,225,0.15)',  color:'#4dd0e1', label:'Í≤∞Ï†ú?ÑÎ£å'},
      pending: {bg:'rgba(255,213,79,0.15)',  color:'#ffd54f', label:'?ÄÍ∏∞Ï§ë'},
      cancel:  {bg:'rgba(239,154,154,0.15)', color:'#ef9a9a', label:'Ï∑®ÏÜå'},
    }
    const b = map[s] || map.pending
    return <span style={{padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:700,background:b.bg,color:b.color}}>{b.label}</span>
  }

  return (
    <div style={{fontFamily:'Noto Sans KR,sans-serif',minHeight:'100vh',background:C.bg,color:C.white}}>

      {/* HEADER */}
      <header style={{background:'rgba(15,32,39,0.97)',backdropFilter:'blur(8px)',padding:'0 36px',height:64,display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:`1px solid ${C.border2}`,position:'sticky',top:0,zIndex:100}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <a href="/" style={{display:'flex',alignItems:'center',gap:10,textDecoration:'none'}}>
            <div style={{width:36,height:36,borderRadius:8,background:`linear-gradient(135deg,${C.accent},${C.accent2})`,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:16,color:'#0f2027',fontFamily:'monospace'}}>G</div>
            <div>
              <div style={{fontWeight:900,fontSize:15,color:C.white}}>Ï£ºÏãù?åÏÇ¨ Í∑∏Î°ú??/div>
              <div style={{fontSize:9,color:C.accent,letterSpacing:2,fontWeight:700}}>ADMIN DASHBOARD</div>
            </div>
          </a>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <a href="/" style={{padding:'6px 16px',borderRadius:6,fontSize:12,fontWeight:700,color:C.muted,border:`1px solid ${C.border}`,textDecoration:'none'}}>???òÍ∞ï ?†Ï≤≠ ?òÏù¥ÏßÄ</a>
          <button onClick={downloadCSV} style={{padding:'6px 16px',borderRadius:6,fontSize:12,fontWeight:700,background:`linear-gradient(135deg,${C.accent},${C.accent2})`,color:'#0f2027',border:'none',cursor:'pointer'}}>
            ?ì• CSV ?§Ïö¥Î°úÎìú
          </button>
        </div>
      </header>

      <div style={{maxWidth:1200,margin:'0 auto',padding:'40px 24px'}}>

        {/* ?µÍ≥Ñ Ïπ¥Îìú 4Í∞?*/}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:32}}>
          {[
            ['?ë•', '?ÑÏ≤¥ ?òÍ∞ï??, totalStudents + 'Î™?, C.accent],
            ['??, 'Í≤∞Ï†ú ?ÑÎ£å',   paidCount + 'Î™?,     C.accent2],
            ['?í∞', 'Ï¥?Îß§Ï∂ú',     '?? + totalRevenue.toLocaleString(), C.gold],
            ['?ìö', 'Í∞úÏÑ§ Í≥ºÏ†ï',   stats.length + 'Í∞?,  C.accent],
          ].map(([icon, label, value, color]) => (
            <div key={String(label)} style={{background:C.cardBg,border:`1px solid ${C.border}`,borderRadius:12,padding:'20px 22px'}}>
              <div style={{fontSize:22,marginBottom:8}}>{icon}</div>
              <div style={{fontSize:12,color:C.muted,marginBottom:4}}>{label}</div>
              <div style={{fontFamily:'monospace',fontSize:24,fontWeight:700,color:String(color)}}>{value}</div>
            </div>
          ))}
        </div>

        {/* ??*/}
        <div style={{display:'flex',gap:8,marginBottom:20}}>
          {([['list','?òÍ∞ï??Î™©Î°ù'],['stats','Í≥ºÏ†ïÎ≥??µÍ≥Ñ']] as [string,string][]).map(([t,l]) => (
            <div key={t} onClick={()=>setTab(t as 'list'|'stats')}
              style={{padding:'8px 20px',borderRadius:6,fontSize:13,fontWeight:700,cursor:'pointer',
                background:tab===t?C.accent:'transparent',
                color:tab===t?'#0f2027':C.muted,
                border:`1px solid ${tab===t?C.accent:C.border}`}}>
              {l}
            </div>
          ))}
        </div>

        {/* ?òÍ∞ï??Î™©Î°ù ??*/}
        {tab === 'list' && (
          <>
            {/* Í≤Ä??+ ?ÑÌÑ∞ */}
            <div style={{display:'flex',gap:10,marginBottom:16}}>
              <input
                placeholder="?¥Î¶Ñ, ?¥Î©î?? Í≥ºÏ†ïÎ™? ?±Î°ùÎ≤àÌò∏ Í≤Ä??.."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{flex:1,background:'rgba(255,255,255,0.05)',border:`1px solid ${C.border}`,borderRadius:8,padding:'10px 14px',fontSize:13,color:C.white,outline:'none'}}
              />
              <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}
                style={{background:C.cardBg,border:`1px solid ${C.border}`,borderRadius:8,padding:'10px 14px',fontSize:13,color:C.white,outline:'none',cursor:'pointer'}}>
                <option value="all">?ÑÏ≤¥ ?ÅÌÉú</option>
                <option value="paid">Í≤∞Ï†ú?ÑÎ£å</option>
                <option value="pending">?ÄÍ∏∞Ï§ë</option>
                <option value="cancel">Ï∑®ÏÜå</option>
              </select>
            </div>

            {/* ?åÏù¥Î∏?*/}
            <div style={{background:C.cardBg,border:`1px solid ${C.border}`,borderRadius:12,overflow:'hidden'}}>
              <div style={{overflowX:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse'}}>
                  <thead>
                    <tr style={{background:'rgba(255,255,255,0.04)',borderBottom:`1px solid ${C.border}`}}>
                      {['?±Î°ùÎ≤àÌò∏','?¥Î¶Ñ','?∞ÎùΩÏ≤?,'Í≥ºÏ†ïÎ™?,'Í≤∞Ï†úÍ∏àÏï°','?ÅÌÉú','?†Ï≤≠??].map(h => (
                        <th key={h} style={{padding:'12px 16px',fontSize:11,fontWeight:700,color:C.muted,textAlign:'left',letterSpacing:1,whiteSpace:'nowrap'}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading && (
                      <tr><td colSpan={7} style={{padding:40,textAlign:'center',color:C.muted}}>??Î°úÎî© Ï§?..</td></tr>
                    )}
                    {!loading && filtered.length === 0 && (
                      <tr><td colSpan={7} style={{padding:40,textAlign:'center',color:C.muted}}>Í≤Ä??Í≤∞Í≥ºÍ∞Ä ?ÜÏäµ?àÎã§.</td></tr>
                    )}
                    {filtered.map((e, i) => (
                      <tr key={e.reg_number + i}
                        style={{borderBottom:`1px solid ${C.border}`,transition:'background 0.15s'}}
                        onMouseEnter={el=>el.currentTarget.style.background='rgba(100,181,246,0.05)'}
                        onMouseLeave={el=>el.currentTarget.style.background='transparent'}>
                        <td style={{padding:'12px 16px',fontSize:12,fontFamily:'monospace',color:C.accent}}>{e.reg_number}</td>
                        <td style={{padding:'12px 16px',fontSize:13,fontWeight:600,color:C.white}}>{e.student_name}</td>
                        <td style={{padding:'12px 16px',fontSize:12,color:C.muted}}>{e.phone}</td>
                        <td style={{padding:'12px 16px',fontSize:12,color:C.white,maxWidth:200}}>{e.course_title}</td>
                        <td style={{padding:'12px 16px',fontSize:13,fontWeight:700,fontFamily:'monospace',color:C.gold}}>??(e.payment_amount||0).toLocaleString()}</td>
                        <td style={{padding:'12px 16px'}}>{statusBadge(e.status)}</td>
                        <td style={{padding:'12px 16px',fontSize:11,color:C.muted,whiteSpace:'nowrap'}}>{new Date(e.applied_at).toLocaleDateString('ko-KR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{padding:'12px 16px',borderTop:`1px solid ${C.border}`,fontSize:12,color:C.muted}}>
                Ï¥?{filtered.length}Î™??úÏãú Ï§?(?ÑÏ≤¥ {totalStudents}Î™?
              </div>
            </div>
          </>
        )}

        {/* Í≥ºÏ†ïÎ≥??µÍ≥Ñ ??*/}
        {tab === 'stats' && (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))',gap:16}}>
            {loading && <div style={{color:C.muted,padding:40}}>??Î°úÎî© Ï§?..</div>}
            {stats.map(s => {
              const pct = Math.round((s.enrolled||0) / (s.capacity||1) * 100)
              return (
                <div key={s.course_title} style={{background:C.cardBg,border:`1px solid ${C.border}`,borderRadius:12,overflow:'hidden'}}>
                  <div style={{background:'#fce4ec',padding:'16px 20px',borderBottom:'1px solid #f8bbd0'}}>
                    <div style={{fontSize:10,fontWeight:700,color:'#c2185b',letterSpacing:2,marginBottom:4}}>{s.category}</div>
                    <div style={{fontSize:15,fontWeight:700,color:'#0f2027',lineHeight:1.3}}>{s.course_title}</div>
                  </div>
                  <div style={{padding:'16px 20px'}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:12}}>
                      <div style={{textAlign:'center'}}>
                        <div style={{fontFamily:'monospace',fontSize:22,fontWeight:700,color:C.accent}}>{s.enrolled||0}</div>
                        <div style={{fontSize:11,color:C.muted}}>?òÍ∞ï??/div>
                      </div>
                      <div style={{textAlign:'center'}}>
                        <div style={{fontFamily:'monospace',fontSize:22,fontWeight:700,color:C.accent2}}>{s.capacity||0}</div>
                        <div style={{fontSize:11,color:C.muted}}>?ïÏõê</div>
                      </div>
                      <div style={{textAlign:'center'}}>
                        <div style={{fontFamily:'monospace',fontSize:22,fontWeight:700,color:C.gold}}>??((s.total_revenue||0)/10000).toFixed(0)}Îß?/div>
                        <div style={{fontSize:11,color:C.muted}}>Îß§Ï∂ú</div>
                      </div>
                    </div>
                    <div style={{fontSize:12,color:C.muted,marginBottom:5,display:'flex',justifyContent:'space-between'}}>
                      <span>?òÍ∞ïÎ•?/span><span style={{color:pct>80?C.gold:C.accent,fontWeight:700}}>{pct}%</span>
                    </div>
                    <div style={{background:'rgba(255,255,255,0.08)',borderRadius:3,height:6}}>
                      <div style={{background:pct>80?C.gold:C.accent,width:`${Math.min(100,pct)}%`,height:'100%',borderRadius:3,transition:'width 0.5s'}}/>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <footer style={{background:'rgba(15,32,39,0.9)',borderTop:`1px solid ${C.border}`,textAlign:'center',padding:'20px',fontSize:12,marginTop:60,color:C.muted}}>
        ¬© 2026 Ï£ºÏãù?åÏÇ¨ Í∑∏Î°ú??¬∑ Í¥ÄÎ¶¨Ïûê ?Ä?úÎ≥¥??
      </footer>
    </div>
  )
}
