# motion-log

센터 외 활동 데이터(METs) 기반 운동 루틴 매니지먼트

## 기술 스택

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS v4**
- **Supabase** (DB + Auth)
- **Vercel** (배포)

## 시작하기

### 1. 패키지 설치

```bash
npm install
npm install @supabase/supabase-js @supabase/ssr
```

### 2. 환경변수 설정

```bash
cp .env.local.example .env.local
```

`.env.local` 을 열어 Supabase 프로젝트 URL과 키를 입력하세요.
(Supabase 대시보드 → Settings → API)

### 3. 개발 서버 실행

```bash
npm run dev
```

→ http://localhost:3000 접속

## 폴더 구조

```
src/
├── app/
│   ├── login/           # 강사 로그인
│   ├── studio/          # 스튜디오 (강사용, 태블릿)
│   │   ├── page.tsx     # 회원 목록
│   │   └── members/
│   │       └── [id]/
│   │           ├── page.tsx          # 회원 상세
│   │           ├── notes/new/        # 알림장 작성
│   │           └── inbody/new/       # 인바디 입력
│   └── m/
│       └── [token]/     # 회원 앱 (모바일, 토큰 기반 접근)
│           ├── page.tsx # 홈
│           ├── record/  # 운동 기록 입력
│           ├── notes/   # 알림장 목록
│           └── videos/  # 추천 영상
├── components/
│   ├── studio/
│   │   ├── StudioHeader.tsx   # 헤더 (날짜, 신규회원 추가)
│   │   └── NewMemberModal.tsx # 신규회원 등록 모달
│   ├── member/
│   │   └── MemberTabBar.tsx   # 하단 탭바
│   └── BackHeader.tsx         # 뒤로가기 헤더
├── lib/
│   └── supabase/
│       ├── client.ts   # 브라우저 클라이언트
│       └── server.ts   # 서버 클라이언트
└── types/
    └── database.ts     # DB 타입 정의
```

## 회원 앱 접속 방법

회원은 별도 로그인 없이 고유 링크로 접속합니다.

```
https://your-domain.com/m/{access_token}
```

`access_token` 은 Supabase `members` 테이블에서 확인하거나,
추후 카카오 알림톡/문자로 전송하는 방식으로 사용합니다.

개발 중 테스트 시:
```
http://localhost:3000/m/{members 테이블의 access_token 값}
```

## 배포 (Vercel)

1. GitHub에 push
2. Vercel에서 새 프로젝트 연결
3. Environment Variables에 `.env.local` 값 동일하게 입력
4. Deploy
# motionlab
