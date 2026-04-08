// src/components/member/ui/Modal.tsx
// 공통 다이얼로그 래퍼
// 딤 배경 클릭 시 onClose, 내부 클릭 버블링 차단

interface Props {
	onClose?: () => void          // 딤 배경 클릭 시 — undefined면 닫기 비활성
	children: React.ReactNode
	maxWidth?: number
	zIndex?: number           // 기본 386px
}

export default function Modal({ onClose, children, maxWidth = 386, zIndex = 999 }: Props) {
	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center px-4 "
			style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: zIndex }}
			onClick={onClose}
		>
			<div
				className="w-full relative overflow-hidden bg-white rounded-3xl"
				style={{
					maxWidth
				}}
				onClick={e => e.stopPropagation()}
			>
				{children}
			</div>
		</div>
	)
}
