// src/components/member/ui/ModalContents.tsx
// 공통 모달 콘텐츠 영역
// 헤더 아래 본문 — 패딩 + 세로 gap 처리

interface Props {
	children: React.ReactNode
	gap?: number   // flex gap (px), 기본 20
}

export default function ModalContents({ children, gap = 20 }: Props) {
	return (
		<div
			className="flex flex-col px-6 pt-5 pb-8"
			style={{ gap }}
		>
			{children}
		</div>
	)
}
