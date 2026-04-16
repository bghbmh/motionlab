// components/studio/SidebarLoading.tsx

export default function SidebarLoading() {
	return (
		<aside
			className="w-64 flex flex-col items-center justify-center border-r "
			style={{ height: 'calc(100vh - 70px)' }}
		>
			{/* 작고 세련된 스피너 */}
			<div className="relative w-8 h-8 mb-3">
				<div className="absolute w-full h-full rounded-full border-2 border-solid"
					style={{ borderColor: 'rgba(61,219,181,0.05)' }} />
				<div className="absolute w-full h-full rounded-full border-2 border-solid animate-spin"
					style={{
						borderColor: '#3DDBB5 transparent transparent transparent',
					}} />
			</div>

			<div className="flex flex-col items-center gap-1">
				<p className="text-[14px] font-medium text-white/70 tracking-tight">
					회원 목록 로딩 중
				</p>
				{/* 깜빡이는 애니메이션 바 (스켈레톤 느낌) */}
				<div className="flex gap-1 mt-1">
					<div className="w-1 h-1 rounded-full bg-[#3DDBB5]/40 animate-bounce" style={{ animationDelay: '0ms' }} />
					<div className="w-1 h-1 rounded-full bg-[#3DDBB5]/40 animate-bounce" style={{ animationDelay: '150ms' }} />
					<div className="w-1 h-1 rounded-full bg-[#3DDBB5]/40 animate-bounce" style={{ animationDelay: '300ms' }} />
				</div>
			</div>
		</aside>
	)
}