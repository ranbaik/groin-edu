// ============================================================
// app/api/payment/confirm/route.ts (최종 버전)
// 결제 확인 + DB 저장 + 이메일 + SMS + Google Calendar
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendAllEnrollmentNotifications } from '../../../../lib/notifications'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { paymentKey, orderId, amount } = await request.json()

    // ── 1. 토스페이먼츠 결제 승인 ──
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
      return NextResponse.json({ success: false, error: tossData.message }, { status: 400 })
    }

    // ── 2. orderId 파싱 ──
    const parts     = orderId.split('_')
    const courseId  = parts[0]
    const studentId = parts.slice(1).join('_')

    // ── 3. 수강생 + 과정 정보 조회 ──
    const [{ data: student }, { data: course }] = await Promise.all([
      supabaseAdmin.from('students').select('id,name,email,phone,reg_number').eq('id', studentId).single(),
      supabaseAdmin.from('courses').select('title,method,duration,price').eq('id', courseId).single(),
    ])

    if (!student || !course) {
      return NextResponse.json({ success: false, error: '정보를 찾을 수 없습니다.' }, { status: 404 })
    }

    // ── 4. DB 저장 ──
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

    // ── 5. 이메일 + SMS 동시 발송 ──
    const notifications = await sendAllEnrollmentNotifications({ student, course, enrollment: { payment_amount: amount } })

    // ── 6. Google Calendar 이벤트 추가 ──
    let calendarResult = { success: false, eventUrl: '' }
    try {
      const calRes = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/calendar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName:  student.name,
          studentEmail: student.email,
          courseTitle:  course.title,
          method:       course.method,
          startDate:    '2026-03-01T10:00:00+09:00',
        }),
      })
      calendarResult = await calRes.json()
      console.log('📅 Calendar:', calendarResult.success ? '✅ 완료' : '❌ 실패')
    } catch (e) {
      console.error('Calendar 오류:', e)
    }

    // ── 7. 알림 로그 기록 ──
    await supabaseAdmin.from('notification_logs').insert([
      { student_id: studentId, type: 'email',    event: 'payment', status: notifications.email.success ? 'sent' : 'failed', recipient: student.email },
      { student_id: studentId, type: 'sms',      event: 'payment', status: notifications.sms.success   ? 'sent' : 'failed', recipient: student.phone },
      { student_id: studentId, type: 'calendar', event: 'payment', status: calendarResult.success       ? 'sent' : 'failed', recipient: student.email },
    ])

    return NextResponse.json({
      success:     true,
      regNumber:   student.reg_number,
      studentName: student.name,
      notifications: {
        email:    notifications.email.success ? '✅ 발송 완료' : '❌ 실패',
        sms:      notifications.sms.success   ? '✅ 발송 완료' : '❌ 실패',
        calendar: calendarResult.success      ? '✅ 일정 추가' : '❌ 실패',
      },
    })

  } catch (error: any) {
    console.error('결제 확인 오류:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
