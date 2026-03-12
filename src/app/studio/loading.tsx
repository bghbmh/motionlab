// app/studio/loading.tsx

export default function Loading() {
	return (
		<div className="flex flex-col items-center justify-center min-h-[400px] w-full gap-4">
			{/* 세련된 스피너 애니메이션 */}
			<div className="relative w-10 h-10">
				<div className="absolute w-full h-full rounded-full border-4 border-solid"
					style={{ borderColor: 'rgba(61,219,181,0.1)' }} />
				<div className="absolute w-full h-full rounded-full border-4 border-solid animate-spin"
					style={{
						borderColor: '#3DDBB5 transparent transparent transparent',
						borderWidth: '4px'
					}} />
			</div>

			<div className="flex flex-col items-center gap-1">
				<p className="text-sm font-medium text-white/60 animate-pulse">
					데이터를 불러오는 중입니다
				</p>
				<p className="text-[11px] text-white/20">잠시만 기다려 주세요</p>
			</div>
		</div>
	)
}