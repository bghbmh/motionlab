// 이 파일을 아래 4곳에 모두 동일하게 복사해주세요:
//   src/app/m/[token]/notifications/loading.tsx
//   src/app/m/[token]/record/loading.tsx
//   src/app/m/[token]/notes/loading.tsx
//   src/app/m/[token]/videos/loading.tsx
//
// 헤더(58px) + GNB(72px)를 제외한 콘텐츠 영역만 덮음
// → 페이지 이동 시 헤더/GNB는 그대로 보이고 콘텐츠만 로딩 표시

export default function Loading() {
	return (
		<div
			style={{
				minHeight: 'calc(100dvh - 58px - 72px)',
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				gap: 20,
				backgroundColor: '#f8faf8',
			}}
		>
			{/* 스피너 */}
			<svg
				className="animate-spin"
				width="28"
				height="28"
				viewBox="0 0 24 24"
				fill="none"
			>
				<circle
					cx="12" cy="12" r="10"
					stroke="#0bb489"
					strokeWidth="2.5"
					strokeOpacity="0.2"
				/>
				<path
					d="M12 2a10 10 0 0 1 10 10"
					stroke="#0bb489"
					strokeWidth="2.5"
					strokeLinecap="round"
				/>
			</svg>
		</div>
	)
}
