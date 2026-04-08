// ============================================================
// app/api/analyze/route.ts
// Claude AI 분석 API Route (서버사이드)
// ============================================================
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-opus-4-5',
        max_tokens: 2000,
        messages:   [{ role: 'user', content: prompt }],
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      return NextResponse.json({ error: data.error?.message || 'API 오류' }, { status: 400 })
    }

    const text = data.content?.[0]?.text || '분석 결과를 가져올 수 없습니다.'
    return NextResponse.json({ result: text })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
