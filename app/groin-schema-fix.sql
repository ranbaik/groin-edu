-- ============================================================
-- 주)그로인 교육 플랫폼 · Supabase 스키마 (오류 수정본)
-- "already exists" 오류 해결 - IF NOT EXISTS 적용
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. 과정(courses) 테이블
CREATE TABLE IF NOT EXISTS courses (
  id            TEXT PRIMARY KEY,
  category      TEXT NOT NULL,
  title         TEXT NOT NULL,
  description   TEXT,
  price         INTEGER NOT NULL,
  duration      TEXT,
  method        TEXT,
  capacity      INTEGER DEFAULT 30,
  enrolled      INTEGER DEFAULT 0,
  badge         TEXT DEFAULT 'open',
  instructor    TEXT,
  start_date    DATE DEFAULT '2025-05-01',
  end_date      DATE,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 수강생(students) 테이블
CREATE TABLE IF NOT EXISTS students (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reg_number    TEXT UNIQUE,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL,
  phone         TEXT NOT NULL,
  birth_date    DATE,
  job           TEXT,
  purpose       TEXT,
  experience    TEXT DEFAULT '처음 수강',
  note          TEXT,
  agree_privacy BOOLEAN DEFAULT FALSE,
  agree_sms     BOOLEAN DEFAULT FALSE,
  agree_marketing BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 (IF NOT EXISTS 추가 - 오류 방지)
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_students_phone ON students(phone);

-- 3. 수강신청(enrollments) 테이블
CREATE TABLE IF NOT EXISTS enrollments (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id    UUID REFERENCES students(id) ON DELETE CASCADE,
  course_id     TEXT REFERENCES courses(id),
  status        TEXT DEFAULT 'pending',
  payment_method TEXT,
  payment_amount INTEGER NOT NULL,
  payment_key   TEXT,
  payment_at    TIMESTAMPTZ,
  cancel_reason TEXT,
  cancelled_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course  ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status  ON enrollments(status);

-- 4. 알림 로그(notification_logs) 테이블
CREATE TABLE IF NOT EXISTS notification_logs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_id UUID REFERENCES enrollments(id),
  student_id    UUID REFERENCES students(id),
  type          TEXT NOT NULL,
  event         TEXT NOT NULL,
  status        TEXT DEFAULT 'sent',
  recipient     TEXT,
  subject       TEXT,
  body          TEXT,
  sent_at       TIMESTAMPTZ DEFAULT NOW(),
  error_msg     TEXT
);

-- 5. 기본 과정 데이터 (중복 무시)
INSERT INTO courses (id, category, title, description, price, duration, method, capacity, enrolled, badge, instructor, end_date)
VALUES
  ('C01','인공지능','AI 바이브코딩 실전 과정','Claude Code로 업무 자동화 시스템을 직접 만드는 실전 과정',490000,'12주','온라인 실시간',20,17,'hot','CTO 특강','2025-07-31'),
  ('C02','수학·AI','AI를 위한 수학 기초 완성','선형대수·미적분·확률통계를 AI 관점에서 재해석하는 과정',380000,'8주','온라인 자율',30,12,'new','이수학 박사','2025-06-30'),
  ('C03','데이터분석','파이썬 데이터분석 실무','판다스·시각화·머신러닝까지 데이터 전과정 실습',420000,'10주','온라인 실시간',25,19,'open','김데이터 강사','2025-07-15'),
  ('C04','인공지능','ChatGPT·Claude 업무 자동화','프롬프트 엔지니어링부터 MCP 자동화까지 비개발자도 OK',290000,'6주','온라인+오프라인',40,28,'hot','CTO 특강','2025-06-15'),
  ('C05','데이터분석','경영진을 위한 AI 데이터 의사결정','데이터 기반 전략 수립과 AI 도구 활용 리더십 과정',650000,'8주','오프라인 집중',15,8,'new','임원 전용 클래스','2025-06-30'),
  ('C06','수학·AI','딥러닝 수학 마스터','신경망·역전파·최적화의 수학적 원리를 완전 정복',520000,'12주','온라인 실시간',20,9,'open','AI 연구원 특강','2025-07-31')
ON CONFLICT (id) DO NOTHING;

-- 6. 가상 수강생 (기존 데이터 있으면 건너뜀)
DO $$
DECLARE
  names TEXT[] := ARRAY['김지수','이민준','박서연','최준혁','정다은','강현우','윤소희','임태양','한아름','오지훈','신예진','류민성','황채원','전동현','노지혜','고민채','백승우','문지영','장현석','조예림'];
  courses_arr TEXT[] := ARRAY['C01','C02','C03','C04','C05','C06'];
  statuses TEXT[] := ARRAY['paid','paid','paid','pending','paid'];
  methods TEXT[] := ARRAY['card','card','transfer','kakaopay'];
  jobs TEXT[] := ARRAY['개발자','마케터','교사','컨설턴트','의사','공무원','대학원생','프리랜서','기업임원','디자이너'];
  purposes TEXT[] := ARRAY['업무 역량 향상','이직/취업 준비','창업/사이드 프로젝트','학문적 관심'];
  s_id UUID;
  c_id TEXT;
  c_price INTEGER;
  st TEXT;
  reg_dt TIMESTAMPTZ;
  i INTEGER;
BEGIN
  IF (SELECT COUNT(*) FROM students) = 0 THEN
    FOR i IN 1..20 LOOP
      s_id := uuid_generate_v4();
      c_id := courses_arr[1 + (i % array_length(courses_arr,1))];
      st   := statuses[1 + (i % array_length(statuses,1))];
      reg_dt := NOW() - ((30 - i) || ' days')::INTERVAL;
      SELECT price INTO c_price FROM courses WHERE id = c_id;
      INSERT INTO students (id, name, email, phone, job, purpose, agree_privacy, agree_sms, created_at)
      VALUES (s_id, names[i],
        'user' || i || '@test.com',
        '010-' || LPAD((1000+i*31)::TEXT,4,'0') || '-' || LPAD((2000+i*17)::TEXT,4,'0'),
        jobs[1 + (i % array_length(jobs,1))],
        purposes[1 + (i % array_length(purposes,1))],
        TRUE, TRUE, reg_dt);
      INSERT INTO enrollments (student_id, course_id, status, payment_method, payment_amount, payment_at, created_at)
      VALUES (s_id, c_id, st,
        methods[1 + (i % array_length(methods,1))],
        c_price,
        CASE WHEN st = 'paid' THEN reg_dt + INTERVAL '30 minutes' ELSE NULL END,
        reg_dt);
    END LOOP;
  END IF;
END $$;

-- 7. 편의 뷰
CREATE OR REPLACE VIEW v_enrollment_detail AS
SELECT e.id AS enrollment_id, s.reg_number, s.name, s.email, s.phone,
  s.job, s.purpose, c.title AS course_title, c.category, c.method,
  e.status, e.payment_method, e.payment_amount, e.payment_at,
  e.created_at AS applied_at
FROM enrollments e
JOIN students s ON s.id = e.student_id
JOIN courses c  ON c.id = e.course_id
ORDER BY e.created_at DESC;

CREATE OR REPLACE VIEW v_revenue_stats AS
SELECT c.title, c.category,
  COUNT(e.id) AS total_applicants,
  COUNT(CASE WHEN e.status = 'paid' THEN 1 END) AS paid_count,
  SUM(CASE WHEN e.status = 'paid' THEN e.payment_amount ELSE 0 END) AS revenue,
  c.capacity, c.enrolled
FROM courses c
LEFT JOIN enrollments e ON e.course_id = c.id
GROUP BY c.id, c.title, c.category, c.capacity, c.enrolled
ORDER BY revenue DESC;

-- 8. RLS 설정
ALTER TABLE students     ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses      ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "courses_public_read" ON courses;
CREATE POLICY "courses_public_read" ON courses FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "students_service_all" ON students;
CREATE POLICY "students_service_all" ON students USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS "enrollments_service_all" ON enrollments;
CREATE POLICY "enrollments_service_all" ON enrollments USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS "notifications_service_all" ON notification_logs;
CREATE POLICY "notifications_service_all" ON notification_logs USING (TRUE) WITH CHECK (TRUE);

-- 9. 등록번호 자동 생성 트리거
CREATE OR REPLACE FUNCTION generate_reg_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.reg_number IS NULL THEN
    NEW.reg_number := 'GRN-' ||
      TO_CHAR(NOW(), 'YYYYMMDD') || '-' ||
      LPAD((SELECT COUNT(*) + 1001 FROM students)::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_reg_number ON students;
CREATE TRIGGER trg_reg_number
  BEFORE INSERT ON students
  FOR EACH ROW EXECUTE FUNCTION generate_reg_number();

-- 완료 확인
SELECT '✅ 그로인 DB 스키마 설치 완료! ' ||
  (SELECT COUNT(*) FROM courses) || '개 과정, ' ||
  (SELECT COUNT(*) FROM students) || '명 가상 수강생 생성됨' AS result;
