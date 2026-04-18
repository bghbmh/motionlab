// src/components/member/ui/EmptyState.tsx
// Figma: 컴포넌트 섹션 > empty (1:1045)
// 데이터가 없을 때 카드 내부에 표시하는 공통 빈 상태

interface Props {
	message?: string
	icon?: string | React.ReactNode        // 이모지 또는 아이콘 문자열
}

export default function EmptyState({
	message = '데이터가 없습니다',
	icon = '😴',
}: Props) {
	return (
		<div
			className="flex flex-col items-center justify-center gap-3 py-8 w-full rounded-2xl"
			style={{
				backgroundColor: '#fafafa',
				border: '1px dashed #e2e8f0',
			}}
		>
			{icon && (
				<span style={{ fontSize: 32, lineHeight: 1 }}>{icon}</span>
			)}
			<p className="text-xs text-center text-gray-500">
				{message}
			</p>
		</div>
	)
}
