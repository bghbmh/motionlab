// src/components/member/PageHeader.tsx
// 기록탭, 알림장탭 등 페이지 상단 헤더 공용 컴포넌트
//
// 사용 예시:
//   <PageHeader title="내 운동 기록" count={14} unit="일" />
//   <PageHeader title="알림장" count={2} unit="개" />

interface PageHeaderProps {
	title: string
	count: number
	unit: string    // '일', '개' 등
}

export function PageHeader({ title, count, unit }: PageHeaderProps) {
	return (
		<div className="flex items-center justify-between px-2 pt-2 pb-1 mt-5">
			<h1 className="text-[18px] font-bold text-gray-700">{title}</h1>
			<span className="text-xs text-gray-600">총 {count}{unit}</span>
		</div>
	)
}
