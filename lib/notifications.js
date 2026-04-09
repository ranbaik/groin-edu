// ============================================================
// lib/notifications.js
// 이메일(Gmail API) + 문자(CoolSMS) + Google Calendar 자동화
// ============================================================
import { google } from 'googleapis'

// ── Gmail OAuth2 설정 ──
function getGmailClient() {
  const auth = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    process.env.GMAIL_REDIRECT_URI
  )
  auth.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN })
  return google.gmail({ version: 'v1', auth })
}

// ── Google Calendar 설정 ──
function getCalendarClient() {
  const auth = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    process.env.GMAIL_REDIRECT_URI
  )
  auth.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN })
  return google.calendar({ version: 'v3', auth })
}

// ══════════════════════════════════════
// 이메일 발송
// ══════════════════════════════════════

/** Gmail API로 이메일 발송 */
async function sendEmail({ to, subject, html }) {
  const gmail = getGmailClient()
  const message = [
    `To: ${to}`,
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`,
    '',
    html,
  ].join('\n')

  const encoded = Buffer.from(message).toString('base64url')
  await gmail.users.messages.send({ userId: 'me', requestBody: { raw: encoded } })
}

/** 수강 신청 완료 이메일 */
export async function sendEnrollmentEmail({ student, course, enrollment }) {
  const subject = `[그로인] ${student.name}님, ${course.title} 수강 등록이 완료되었습니다! 🎉`
  const html = `
<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f0ede6;font-family:'Apple SD Gothic Neo','Malgun Gothic',sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" bgcolor="#f0ede6">
<tr><td align="center" style="padding:40px 20px">
<table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden">

  <!-- 헤더 -->
  <tr><td style="background:#0a0a0a;padding:28px 40px">
    <p style="margin:0;color:#c9a84c;font-size:11px;letter-spacing:3px;text-transform:uppercase">GROW·IN EDUCATION</p>
    <p style="margin:8px 0 0;color:#fff;font-size:22px;font-weight:700;letter-spacing:-0.5px">수강 등록 완료</p>
  </td></tr>

  <!-- 인사말 -->
  <tr><td style="padding:32px 40px 0">
    <p style="font-size:16px;color:#0a0a0a;margin:0 0 8px"><strong>${student.name}</strong>님, 안녕하세요!</p>
    <p style="font-size:14px;color:#666;line-height:1.7;margin:0">
      <strong>${course.title}</strong> 과정 수강 등록이 완료되었습니다.<br>
      아래 내용을 확인해 주세요.
    </p>
  </td></tr>

  <!-- 수강 정보 카드 -->
  <tr><td style="padding:24px 40px">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0ede6;border-radius:8px;padding:24px">
      <tr><td colspan="2" style="font-size:11px;letter-spacing:2px;color:#888;text-transform:uppercase;padding-bottom:16px;font-weight:700">수강 정보</td></tr>
      <tr>
        <td style="font-size:13px;color:#888;padding:8px 0;width:120px">등록번호</td>
        <td style="font-size:13px;font-weight:700;font-family:monospace">${student.reg_number}</td>
      </tr>
      <tr>
        <td style="font-size:13px;color:#888;padding:8px 0">과정명</td>
        <td style="font-size:13px;font-weight:700">${course.title}</td>
      </tr>
      <tr>
        <td style="font-size:13px;color:#888;padding:8px 0">개강일</td>
        <td style="font-size:13px;font-weight:700;color:#1a4fd6">2025년 5월 1일 (목요일)</td>
      </tr>
      <tr>
        <td style="font-size:13px;color:#888;padding:8px 0">수업 방식</td>
        <td style="font-size:13px;font-weight:700">${course.method}</td>
      </tr>
      <tr>
        <td style="font-size:13px;color:#888;padding:8px 0">수강 기간</td>
        <td style="font-size:13px;font-weight:700">${course.duration}</td>
      </tr>
      <tr style="border-top:1px solid #ddd">
        <td style="font-size:14px;font-weight:700;padding:16px 0 8px">결제 금액</td>
        <td style="font-size:18px;font-weight:700;color:#1a4fd6;font-family:monospace;padding:16px 0 8px">
          ₩${enrollment.payment_amount.toLocaleString()}
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- 다음 단계 -->
  <tr><td style="padding:0 40px 32px">
    <p style="font-size:14px;font-weight:700;margin:0 0 12px">📌 개강 전 안내</p>
    <ul style="font-size:13px;color:#555;line-height:2;padding-left:20px;margin:0">
      <li>구글 캘린더에 수업 일정이 자동 추가되었습니다.</li>
      <li>개강 전날(4/30) 리마인드 문자를 발송해 드립니다.</li>
      <li>수업 링크/장소는 개강 3일 전 별도 안내됩니다.</li>
      <li>문의: <a href="mailto:edu@groin.co.kr" style="color:#1a4fd6">edu@groin.co.kr</a></li>
    </ul>
  </td></tr>

  <!-- 푸터 -->
  <tr><td style="background:#0a0a0a;padding:20px 40px;text-align:center">
    <p style="margin:0;font-size:11px;color:#666">© 2025 주)그로인 · 인공지능 & 데이터분석 교육</p>
    <p style="margin:4px 0 0;font-size:11px;color:#444">수신 거부: <a href="#" style="color:#666">unsubscribe</a></p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`

  try {
    await sendEmail({ to: student.email, subject, html })
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

/** 개강 리마인드 이메일 (4월 30일 자동 발송) */
export async function sendReminderEmail({ student, course, enrollment }) {
  const subject = `[그로인] 내일 개강! ${course.title} 수업 준비 안내 🚀`
  const html = `
<body style="font-family:'Apple SD Gothic Neo',sans-serif;background:#f0ede6;padding:40px">
<div style="max-width:520px;margin:0 auto;background:white;border-radius:12px;overflow:hidden">
  <div style="background:#1a4fd6;padding:28px 32px">
    <p style="color:#fff;font-size:20px;font-weight:700;margin:0">내일 개강입니다! 🎉</p>
  </div>
  <div style="padding:28px 32px">
    <p style="font-size:15px">${student.name}님, 내일(5월 1일)이 드디어 개강일입니다!</p>
    <p style="font-size:14px;color:#666;line-height:1.8;margin-top:12px">
      과정: <strong>${course.title}</strong><br>
      일시: <strong>2025년 5월 1일 (목) 오전 10:00</strong><br>
      방식: <strong>${course.method}</strong>
    </p>
    <div style="background:#eff6ff;border-radius:8px;padding:16px;margin-top:20px;font-size:13px;color:#1a4fd6">
      구글 캘린더에서 수업 링크를 확인하세요. 5분 전까지 접속해 주시면 됩니다.
    </div>
  </div>
</div>
</body>`

  try {
    await sendEmail({ to: student.email, subject, html })
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

// ══════════════════════════════════════
// SMS 문자 발송 (CoolSMS)
// ══════════════════════════════════════

/** CoolSMS API 호출 */
async function sendSMS({ to, text }) {
  const timestamp = Date.now().toString()
  const apiKey = process.env.COOLSMS_API_KEY
  const apiSecret = process.env.COOLSMS_API_SECRET
  const from = process.env.COOLSMS_SENDER_PHONE

  // HMAC-SHA256 서명
  const crypto = await import('crypto')
  const signature = crypto.createHmac('sha256', apiSecret)
    .update(timestamp + apiKey).digest('hex')

  const res = await fetch('https://api.coolsms.co.kr/messages/v4/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `HMAC-SHA256 apiKey=${apiKey}, date=${timestamp}, salt=${timestamp}, signature=${signature}`,
    },
    body: JSON.stringify({ message: { to, from, text } }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'SMS 발송 실패')
  return data
}

/** 수강 등록 완료 SMS */
export async function sendEnrollmentSMS({ student, course, enrollment }) {
  const text = `[그로인] ${student.name}님\n${course.title} 수강 등록이 완료되었습니다!\n\n등록번호: ${student.reg_number}\n개강일: 2025.05.01(목)\n결제금액: ₩${enrollment.payment_amount.toLocaleString()}\n\n문의: 02-0000-0000`

  try {
    await sendSMS({ to: student.phone, text })
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

/** 개강 리마인드 SMS (D-1) */
export async function sendReminderSMS({ student, course }) {
  const text = `[그로인] 내일 개강!\n${student.name}님, ${course.title} 수업이 내일(5/1 목) 오전 10시 시작됩니다.\n구글 캘린더에서 수업 링크를 확인하세요.`
  try {
    await sendSMS({ to: student.phone, text })
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

// ══════════════════════════════════════
// Google Calendar 일정 추가
// ══════════════════════════════════════

/** 수업 일정 캘린더 초대 */
export async function addCalendarEvent({ student, course }) {
  const calendar = getCalendarClient()

  // 주 1회 12주 수업 이벤트 생성
  const event = {
    summary: `[그로인] ${course.title}`,
    description: `수강생: ${student.name}\n등록번호: ${student.reg_number}\n과정: ${course.title}\n\n문의: edu@groin.co.kr`,
    location: course.method === '오프라인 집중' ? '서울 강남구 그로인 교육센터' : 'Google Meet (링크 별도 발송)',
    start: {
      dateTime: '2025-05-01T10:00:00+09:00',
      timeZone: 'Asia/Seoul',
    },
    end: {
      dateTime: '2025-05-01T12:00:00+09:00',
      timeZone: 'Asia/Seoul',
    },
    recurrence: [`RRULE:FREQ=WEEKLY;COUNT=${parseInt(course.duration) * 1}`],
    attendees: [{ email: student.email, displayName: student.name }],
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 },   // 1일 전
        { method: 'popup', minutes: 30 },          // 30분 전
      ],
    },
    conferenceData: {
      createRequest: {
        requestId: `groin-${student.reg_number}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    },
  }

  try {
    const res = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      conferenceDataVersion: 1,
      sendUpdates: 'all',  // 참석자에게 초대 이메일 자동 발송
    })
    return { success: true, eventId: res.data.id, link: res.data.htmlLink }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

// ══════════════════════════════════════
// 통합 알림 발송 (등록 완료 시 일괄)
// ══════════════════════════════════════

/** 결제 완료 후 모든 알림 동시 발송 */
export async function sendAllEnrollmentNotifications({ student, course, enrollment }) {
  console.log(`📤 알림 발송 시작 - ${student.name} / ${course.title}`)

  const results = await Promise.allSettled([
    sendEnrollmentEmail({ student, course, enrollment }),
    sendEnrollmentSMS({ student, course, enrollment }),
    addCalendarEvent({ student, course }),
  ])

  const [emailResult, smsResult, calendarResult] = results.map(r =>
    r.status === 'fulfilled' ? r.value : { success: false, error: r.reason?.message }
  )

  console.log('📧 이메일:', emailResult.success ? '완료' : `실패(${emailResult.error})`)
  console.log('📱 SMS:', smsResult.success ? '완료' : `실패(${smsResult.error})`)
  console.log('📅 캘린더:', calendarResult.success ? '완료' : `실패(${calendarResult.error})`)

  return { email: emailResult, sms: smsResult, calendar: calendarResult }
}
