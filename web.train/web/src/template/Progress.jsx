import Pulse from "./Pulse";

const ProgressBar = ({
	height = "h-2",
	progress,
	color = "bg-secondary-100",
	hideLabel,
	pulse,
}) => {
	const left = `${progress.toFixed(2)}%`;

	return (
		<div className="w-full text-center relative">
			{!hideLabel && `${progress} %`}
			<div
				className={`bg-def-gray w-full absolute b-0 rounded-full ${height}`}
			></div>
			<div
				style={{ width: left }}
				className={`absolute b-0 rounded-full ${height} ${color}`}
			></div>
			{pulse && (
				<div
					className="absolute b-0 ml-2"
					style={{
						left: left,
						marginTop: "-2px",
					}}
				>
					<Pulse color={color}></Pulse>
				</div>
			)}
			<div className="text-right pt-2 text-xs">{left}</div>
		</div>
	);
};

export default ProgressBar;
