import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === 'development';

const nextConfig: NextConfig = {
	/* config options here */
	experimental: {
		// 시스템이 자동으로 판단한 모드가 'development'일 때만 허용
		// @ts-ignore: Next.js 버전과 TS 타입 정의 간의 일시적 불일치 해결
		allowedDevOrigins: isDev ? ["*"] : [],
	},
};

export default nextConfig;
