// ============================================================
// app/api/payment/confirm/route.ts
// 토스페이먼츠 결제 최종 확인 + Supabase DB 저장
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { paymentKey, orderId, amount } = await request.json()

    // ── 1. 토스페이먼츠 결제 최종 승인 ──
    const tossRes = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(process.env.TOSS_SECRET_KEY! + ':').toString('base64'),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    })

    const tossData = await tossRes.json()

    if (!tossRes.ok) {
      return NextResponse.json({ success: false, error: tossData.message || '결제 승인 실패' }, { status: 400 })
    }

    // ── 2. orderId 파싱 (형식: courseId_studentId) ──
    // orderId 예: "C01_uuid-student-id"
    const [courseId, studentId] = orderId.split('_')

    // ── 3. Supabase enrollments 테이블에 저장 ──
    const { error: enrollError } = await supabaseAdmin
      .from('enrollments')
      .insert({
        student_id:     studentId,
        course_id:      courseId,
        status:         'paid',
        payment_method: tossData.method || 'card',
        payment_amount: amount,
        payment_key:    paymentKey,
        payment_at:     new Date().toISOString(),
      })

    if (enrollError) throw enrollError

    // ── 4. 등록번호 조회 ──
    const { data: student } = await supabaseAdmin
      .from('students')
      .select('reg_number, name, email, phone')
      .eq('id', studentId)
      .single()

    // ── 5. 알림 로그 기록 ──
    await supabaseAdmin.from('notification_logs').insert([
      { student_id: studentId, type: 'email', event: 'payment', status: 'sent', recipient: student?.email, subject: '수강 등록 완료 안내' },
      { student_id: studentId, type: 'sms',   event: 'payment', status: 'sent', recipient: student?.phone, body: '수강 등록이 완료되었습니다.' },
    ])

    return NextResponse.json({
      success: true,
      regNumber: student?.reg_number,
      studentName: student?.name,
    })

  } catch (error: any) {
    console.error('결제 확인 오류:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
