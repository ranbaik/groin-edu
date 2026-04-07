// ============================================================
// app/api/calendar/route.ts
// 결제 완료 시 Google Calendar 수업 일정 자동 추가
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

// Google Calendar OAuth2 클라이언트
function getCalendarClient() {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )
  auth.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
  })
  return google.calendar({ version: 'v3', auth })
}

export async function POST(request: NextRequest) {
  try {
    const { studentName, studentEmail, courseTitle, method, startDate } = await request.json()

    const calendar = getCalendarClient()

    // 개강일 기준 이벤트 생성
    const start = new Date(startDate || '2026-03-01T10:00:00+09:00')
    const end   = new Date(start.getTime() + 2 * 60 * 60 * 1000) // 2시간

    const event = {
      summary:     `[그로인] ${courseTitle}`,
      description: `수강생: ${studentName}\n과정: ${courseTitle}\n수업 방식: ${method}\n\n주식회사 그로인 | contact@growin.kr | 02-6248-2000`,
      location:    '서울 송파구 법원로 114 엠스테이트 비동 1308호',
      start: {
        dateTime: start.toISOString(),
        timeZone: 'Asia/Seoul',
      },
      end: {
        dateTime: end.toISOString(),
        timeZone: 'Asia/Seoul',
      },
      attendees: [
        { email: studentEmail, displayName: studentName },
      ],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },  // 1일 전 이메일
          { method: 'popup', minutes: 60 },         // 1시간 전 팝업
        ],
      },
      conferenceData: undefined,
    }

    const response = await calendar.events.insert({
      calendarId:             'primary',
      requestBody:            event,
      sendUpdates:            'all',   // 참석자에게 초대 이메일 자동 발송
      conferenceDataVersion:  0,
    })

    console.log('✅ Calendar 이벤트 생성:', response.data.id)

    return NextResponse.json({
      success:  true,
      eventId:  response.data.id,
      eventUrl: response.data.htmlLink,
    })

  } catch (error: any) {
    console.error('❌ Calendar 오류:', error.message)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
