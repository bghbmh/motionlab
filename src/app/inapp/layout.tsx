// src/app/inapp/layout.tsx
export default function InAppLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<html lang="ko">
			<head>
				<meta charSet="UTF-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
			</head>
			<body style={{ margin: 0, padding: 0, backgroundColor: '#f8faf8' }}>
				{children}
			</body>
		</html>
	)
}
