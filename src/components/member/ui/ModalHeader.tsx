// src/components/member/ui/ModalHeader.tsx
// 공통 모달 헤더
// Figma: Dialog Header — 타이틀 텍스트 + 우상단 X 닫기 버튼

interface Props {
	title: string
	subtitle?: string
	onClose: () => void
}

export default function ModalHeader({ title, subtitle, onClose }: Props) {
	return (
		<div className="relative flex items-center px-6 pt-6 pb-0">
			<div>
				<p
					className="font-bold pr-8"
					style={{ fontSize: 18, color: 'var(--m-text)' }}
				>
					{title}
				</p>
				{subtitle && <small>{subtitle}</small>}
			</div>


			{/* X 닫기 버튼 — absolute로 우상단 고정 */}
			<button
				onClick={onClose}
				className="absolute top-[18px] right-[18px]"
				style={{ color: 'var(--m-text-muted)', lineHeight: 1 }}
				aria-label="닫기"
			>
				<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
					<path
						d="M15 5L5 15M5 5l10 10"
						stroke="currentColor"
						strokeWidth="1.5"
						strokeLinecap="round"
					/>
				</svg>
			</button>
		</div>
	)
}
