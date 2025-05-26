import { RiCheckFill, RiFocusFill } from "react-icons/ri";

const TimeLineItem = ({
	icon,
	active,
	activeClass = "bg-secondary-100 text-white border-def-primary",
	children,
}) => {
	return (
		<div className="flex w-full">
			<div
				className={`w-8 h-8 z-10 rounded-full border flex items-center justify-center ${
					active ? activeClass : "bg-white"
				}`}
			>
				{icon ? icon : active ? <RiCheckFill /> : <RiFocusFill />}
			</div>
			<div
				className={`flex-grow border-l -ml-4 pl-6 pb-2 ${
					active ? "font-bold" : ""
				}`}
			>
				{children}
			</div>
		</div>
	);
};

export default TimeLineItem;
