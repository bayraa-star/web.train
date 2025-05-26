const BG = {
	red: "bg-def-red",
	green: "bg-def-green",
	orange: "bg-def-orange",
};

const COLOR = {
	red: "text-def-red",
	green: "text-def-green",
	orange: "text-def-orange",
};

const Dot = ({ color = "red" }) => {
	return (
		<div
			className={`h-2 w-2 mr-1 rounded-full ${BG[color]} flex-shrink-0`}
		></div>
	);
};

const Status = ({ color = "red", right, left }) => {
	return (
		<div
			className={`flex justify-between items-center p-2 rounded-lg text-sm ${BG[color]} bg-opacity-5 my-2 leading-none`}
		>
			<div>{left}</div>
			<div
				className={`flex items-center justify-end font-semibold ${COLOR[color]}`}
			>
				<Dot color={color} />
				{right}
			</div>
		</div>
	);
};

export default Status;
