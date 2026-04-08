// src/components/member/ui/BottomSheet.tsx
// 하단에서 위로 올라오는 시트 형태 모달
// WorkoutRecordModal 등 bottom sheet 형태가 필요한 곳에서 사용
// Modal.tsx (중앙 모달)와 용도 구분

interface Props {
	onClose?: () => void      // 딤 배경 클릭 시 닫기 — undefined면 비활성
	children: React.ReactNode
}

export default function BottomSheet({ onClose, children }: Props) {
	return (
		<div
			className="fixed inset-0 flex items-end justify-center"
			style={{
				background: 'rgba(0,0,0,0.4)',
				zIndex: 200,          // m-gnb z-50(50)보다 높게
			}}
			onClick={onClose}
		>
			<div
				className="w-full relative flex flex-col"
				style={{
					maxWidth: '98vw',               // m-layout 최대 너비와 동일
					maxHeight: '90dvh',           // 화면의 90% 상한
					backgroundColor: '#ffffff',
					borderRadius: '24px 24px 0 0',
					animation: 'bottomSheetUp 0.3s cubic-bezier(0.32, 0.72, 0, 1) forwards',
				}}
				onClick={e => e.stopPropagation()}
			>
				{/* 드래그 핸들 */}
				<div className="flex justify-center pt-3 pb-1 shrink-0">
					<div
						className="rounded-full"
						style={{ width: 40, height: 4, backgroundColor: '#e2e8f0' }}
					/>
				</div>

				{/* children — BottomSheet 안에서 헤더/스크롤영역/버튼을 직접 구성 */}
				{children}
			</div>

			<style>{`
				@keyframes bottomSheetUp {
					from { transform: translateY(100%); }
					to   { transform: translateY(0); }
				}
			`}</style>
		</div>
	)
}
