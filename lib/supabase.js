// ============================================================
// lib/supabase.js  (C:\groin-edu\lib\supabase.js 에 저장)
// Supabase 클라이언트 + 그로인 DB 함수 전체
// ============================================================
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// 브라우저 + 서버 공용 클라이언트
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)

// ── 과정 목록 조회 ──
export async function getCourses() {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('is_active', true)
    .order('id')
  if (error) throw error
  return data ?? []
}

// ── 수강생 등록 ──
export async function registerStudent(studentData) {
  const { data, error } = await supabase
    .from('students')
    .insert({
      name:            studentData.name,
      email:           studentData.email,
      phone:           studentData.phone,
      job:             studentData.job || null,
      purpose:         studentData.purpose,
      agree_privacy:   true,
      agree_sms:       true,
    })
    .select('id, reg_number')
    .single()
  if (error) throw error
  return data
}

// ── 수강 신청 생성 ──
export async function createEnrollment(studentId, courseId, price, payMethod) {
  const { data, error } = await supabase
    .from('enrollments')
    .insert({
      student_id:     studentId,
      course_id:      courseId,
      status:         'paid',
      payment_method: payMethod,
      payment_amount: price,
      payment_at:     new Date().toISOString(),
    })
    .select('id')
    .single()
  if (error) throw error
  return data
}

// ── 수강생 목록 조회 (관리자) ──
export async function getEnrollments() {
  const { data, error } = await supabase
    .from('v_enrollment_detail')
    .select('*')
    .order('applied_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

// ── 통계 조회 ──
export async function getStats() {
  const { data, error } = await supabase
    .from('v_revenue_stats')
    .select('*')
  if (error) throw error
  return data ?? []
}
