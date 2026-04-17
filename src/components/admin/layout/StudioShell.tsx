'use client'

// src/components/admin/layout/StudioShell.tsx
// layout.tsx가 서버 컴포넌트라 상태 관리 불가 → 여기서 사이드바 토글 상태 관리

import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'

interface Props {
	header: React.ReactNode    // StudioHeader
	sidebar: React.ReactNode   // MemberListSidebarContainer
	children: React.ReactNode  // 페이지 콘텐츠
}

function StudioShellInner({ header, sidebar, children }: Props) {
	const { sidebarOpen, setSidebarOpen } = useSidebar()

	return (
		<>
			{/* 헤더 행 — 토글 버튼 + StudioHeader */}
			<div className="sticky top-0 z-15 flex items-stretch shrink-0">
				<button
					type="button"
					onClick={() => setSidebarOpen(!sidebarOpen)}
					className={`shrink-0 px-3 border-b border-r border-neutral-200  transition-colors ${sidebarOpen ? 'bg-white hover:bg-zinc-100' : 'bg-gray-700 hover:bg-gray-800'}`}
					title={sidebarOpen ? '사이드바 닫기' : '사이드바 열기'}
				>
					{sidebarOpen
						? <PanelLeftClose size={18} className="text-neutral-600" />
						: <PanelLeftOpen size={18} className="text-neutral-100" />
					}
				</button>
				<div className="flex-1">{header}</div>
			</div>

			{/* ── 모바일 오버레이 ── */}
			{sidebarOpen && (
				<div
					className="fixed inset-0 z-10 bg-black/40 xl:hidden"
					onClick={() => setSidebarOpen(false)}
				/>
			)}

			{/* ── 사이드바 슬라이드 래퍼 ──
				MemberListSidebar 자체가 fixed라서 래퍼는 애니메이션만 담당.
				xl 이상: 항상 표시 (translate 고정)
				xl 미만: 토글에 따라 슬라이드 인/아웃
			── */}
			<div className={`
				fixed left-0 z-10 transition-transform duration-300 ease-out
				top-0 h-screen
				xl:top-14 xl:h-[calc(100vh-56px)]
				${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
			>
				{sidebar}
			</div>

			{/* 바디 — 사이드바 + 콘텐츠 */}
			<main className={`studio-container flex-1 `}
				style={{
					padding: sidebarOpen ? '1rem 1rem 1rem calc(.25rem * 64 + 1rem)' : '1rem'
				}} >
				{children}
			</main>
		</>
	)
}

export default function StudioShell(props: Props) {
	return (
		<SidebarProvider>
			<StudioShellInner {...props} />
		</SidebarProvider>
	)
}
