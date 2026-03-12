import { useEffect, RefObject } from 'react';

// target: 잠그고 싶은 요소의 ref (전달 안 하면 기본 body)
export function useScrollLock(isLocked: boolean, targetRef?: RefObject<HTMLElement>) {
	useEffect(() => {
		if (!isLocked) return;

		// 대상을 결정 (전달받은 ref가 있으면 그 요소, 없으면 body)
		const element = targetRef?.current || document.body;
		const originalStyle = window.getComputedStyle(element).overflow;

		element.style.overflow = 'hidden';

		return () => {
			element.style.overflow = originalStyle;
		};
	}, [isLocked, targetRef]);
}