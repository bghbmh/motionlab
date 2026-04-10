// src/app/m/[token]/loading.tsx
export default function MemberLoading() {
	return (
		<div className="splash-screen">
			<div className="splash-icon">
				<svg viewBox="0 0 129 124" fill="none" xmlns="http://www.w3.org/2000/svg">
					<style>{`
            .stroke-path {
              stroke-dasharray: 1;
              stroke-dashoffset: 1;
              animation: draw 1.0s cubic-bezier(0.4, 0, 0.2, 1) forwards;
            }
            @keyframes draw { to { stroke-dashoffset: 0; } }
            .p1  { animation-delay: 0s; }
            .p2  { animation-delay: 0.18s; }
            .p3  { animation-delay: 0.26s; }
            .p4  { animation-delay: 0.34s; }
            .p5  { animation-delay: 0.42s; }
            .p6  { animation-delay: 0.50s; }
            .p7  { animation-delay: 0.58s; }
            .p8  { animation-delay: 0.66s; }
            .p9  { animation-delay: 0.74s; }
            .p10 { animation-delay: 0.82s; }
            .p11 { animation-delay: 0.90s; }
            .p12 { animation-delay: 0.98s; }
            .p13 { animation-delay: 1.06s; }
            .p14 { animation-delay: 1.14s; }
          `}</style>
					<path className="stroke-path p1" pathLength="1" d="M102.588 111.059V58.3529C102.588 55.2341 100.06 52.7058 96.9411 52.7058H77.1764" stroke="#FEBC12" strokeWidth="7.52941" />
					<path className="stroke-path p2" pathLength="1" d="M64 54.5882L81.4842 38.7432C97.9229 23.8456 124.235 35.51 124.235 57.6948C124.235 58.1078 124.036 58.4954 123.7 58.7355L117.647 63.0588V111.059" stroke="#001769" strokeWidth="7.52941" />
					<path className="stroke-path p3" pathLength="1" d="M71.5293 58.353L86.0824 44.6909C98.0471 33.4587 117.647 41.9421 117.647 58.353V66.8235L123.248 71.7244C124.473 72.7967 125.176 74.3458 125.176 75.9742V111.059" stroke="#06EDC4" strokeWidth="7.52941" />
					<path className="stroke-path p4" pathLength="1" d="M74.3529 111.059V64.9413L88.4706 50.8236L88.9152 50.3209C96.3104 41.9612 110.118 47.1918 110.118 58.353V111.059C110.118 115.737 113.91 119.529 118.588 119.529H121.412" stroke="#FF4B40" strokeWidth="7.52941" />
					<path className="stroke-path p5" pathLength="1" d="M20.7058 58.353L35.2589 44.6909C47.2236 33.4587 66.8235 41.9421 66.8235 58.353V66.8235V73.4118V111.059" stroke="#001769" strokeWidth="7.52941" />
					<path className="stroke-path p6" pathLength="1" d="M45.1764 77.1765L58.3529 96.9412" stroke="#FEBC12" strokeWidth="7.52941" strokeLinecap="round" />
					<path className="stroke-path p7" pathLength="1" d="M20.7058 69.6471L38.0022 50.2414C45.4555 41.8791 59.294 47.1512 59.294 58.353V111.059" stroke="#06EDC4" strokeWidth="7.52941" />
					<path className="stroke-path p8" pathLength="1" d="M18.8235 33.8823V53.8334C18.8235 56.1385 19.6694 58.3634 21.2008 60.0862L23.9756 63.2078C25.507 64.9307 26.3529 67.1556 26.3529 69.4607V111.059" stroke="#FEBC12" strokeWidth="7.52941" />
					<path className="stroke-path p9" pathLength="1" d="M13.1764 54.5882L30.6606 38.7432C47.0993 23.8456 73.4117 35.51 73.4117 57.6948C73.4117 58.1078 73.2122 58.4954 72.8762 58.7355L66.8235 63.0588" stroke="#FEBC12" strokeWidth="7.52941" strokeLinecap="round" />
					<path className="stroke-path p10" pathLength="1" d="M26.3529 33.8823V48.9411C26.3529 51.0203 28.0384 52.7059 30.1176 52.7059H46.1176C49.2364 52.7059 51.7647 55.2341 51.7647 58.3529V111.059" stroke="#FF4B40" strokeWidth="7.52941" />
					<path className="stroke-path p11" pathLength="1" d="M3.76465 33.8823V52.7059V60.2353V111.059" stroke="#FEBC12" strokeWidth="7.52941" />
					<path className="stroke-path p12" pathLength="1" d="M47.0587 76.2353L66.8234 63.0588" stroke="#FEBC12" strokeWidth="7.52941" strokeLinecap="round" />
					<path className="stroke-path p13" pathLength="1" d="M11.2941 33.8823V72.4706V111.059" stroke="#001769" strokeWidth="7.52941" />
					<path className="stroke-path p14" pathLength="1" d="M3.76465 33.8823V46.304C3.76465 48.6091 4.61056 50.834 6.14197 52.5568L16.4461 64.149C17.9776 65.8718 18.8235 68.0968 18.8235 70.4018V111.059" stroke="#06EDC4" strokeWidth="7.52941" />
				</svg>
			</div>

			<div className="splash-loader">
				<div className="splash-loader-bar" />
			</div>
		</div>
	)
}