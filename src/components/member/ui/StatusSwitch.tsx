// src/components/member/ui/StatusSwitch.tsx
// 알림장 탭 > 운동 완료 여부 토글 스위치
// Figma: 시안 > Switch 컴포넌트

interface Props {
	checked: boolean
	onChange: (checked: boolean) => void
}

export default function StatusSwitch({ checked, onChange }: Props) {
	return (
		<button
			type="button"
			role="switch"
			aria-checked={checked}
			onClick={() => onChange(!checked)}
			className="relative shrink-0 transition-colors duration-200"
			style={{
				width: 44,
				height: 24,
				borderRadius: 9999,
				backgroundColor: checked ? 'var(--color-primary)' : '#e2e8f0',
				padding: 2,
				display: 'flex',
				alignItems: 'center',
				justifyContent: checked ? 'flex-end' : 'flex-start',
			}}
		>
			<span
				className="block rounded-full bg-white"
				style={{
					width: 20,
					height: 20,
					boxShadow: '0 2px 4px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.08)',
				}}
			/>
		</button>
	)
}
