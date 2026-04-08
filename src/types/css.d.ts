// src/types/css.d.ts
// CSS 파일 import 시 TypeScript 타입 오류 해결

declare module '*.css' {
	const content: { [className: string]: string }
	export default content
}
