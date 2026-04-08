// src/components/member/ui/StatusBadge.tsx
// Figma: 섹션 "상태" > 수행-상태 컴포넌트 (Default / 완료 / 추가)

interface Props {
	status: 'default' | 'done' | 'added'
}

export default function StatusBadge({ status }: Props) {
	if (status === 'done') {
		return (
			<span className="badge badge-success">완료!!</span>
		)
	}
	if (status === 'added') {
		return (
			<span className="badge-add">

				<svg width="14" height="14" viewBox="0 0 14 14" fill="none" >
					<path d="M11.6663 3.5L5.24967 9.91667L2.33301 7" stroke="#46A758" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
				</svg>

				추가
			</span>
		)
	}
	// default
	return (
		<span className="badge badge-muted">아직 안했어요~</span>
	)
}
