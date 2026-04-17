'use client'

// contexts/SidebarContext.tsx

import { createContext, useContext, useState, useEffect } from 'react'

interface SidebarContextType {
	sidebarOpen: boolean
	setSidebarOpen: (open: boolean) => void
	closeSidebar: () => void
}

const SidebarContext = createContext<SidebarContextType | null>(null)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
	const [sidebarOpen, setSidebarOpen] = useState(true)

	// 화면 크기에 따라 초기값 설정
	useEffect(() => {
		const mq = window.matchMedia('(min-width: 1280px)')
		setSidebarOpen(mq.matches)
		const handler = (e: MediaQueryListEvent) => setSidebarOpen(e.matches)
		mq.addEventListener('change', handler)
		return () => mq.removeEventListener('change', handler)
	}, [])

	const closeSidebar = () => {
		if (window.innerWidth < 1280) setSidebarOpen(false)
	}

	return (
		<SidebarContext.Provider value={{ sidebarOpen, setSidebarOpen, closeSidebar }}>
			{children}
		</SidebarContext.Provider>
	)
}

export function useSidebar() {
	const ctx = useContext(SidebarContext)
	if (!ctx) throw new Error('useSidebar must be used within SidebarProvider')
	return ctx
}