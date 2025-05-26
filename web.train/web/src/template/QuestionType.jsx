import {
	RiCalculatorFill,
	RiCalendar2Fill,
	RiCheckFill,
	RiCloseFill,
	RiImage2Fill,
	RiInformationFill,
	RiPencilFill,
} from "react-icons/ri";

const containerClass = "flex-shrink-0 flex text-2xl";
const itemClass =
	"w-8 h-8 bg-def-gray ml-1 rounded flex items-center justify-center";

// check
// text
// number
// image
// date

const QuestionType = ({ type, value }) => {
	if (type === "check")
		return (
			<div className={containerClass}>
				<div
					className={`${itemClass} ${
						value === true ? "text-def-green" : "text-gray-500"
					}`}
				>
					<RiCheckFill />
				</div>
				<div
					className={`${itemClass} ${
						value === false ? "text-def-red" : "text-gray-500"
					}`}
				>
					<RiCloseFill />
				</div>
			</div>
		);
	if (type === "text")
		return (
			<div className={containerClass}>
				<div className={itemClass}>
					<RiPencilFill />
				</div>
			</div>
		);
	if (type === "info")
		return (
			<div className={containerClass}>
				<div className={itemClass}>
					<RiInformationFill />
				</div>
			</div>
		);
	if (type === "number")
		return (
			<div className={containerClass}>
				<div className={itemClass}>
					<RiCalculatorFill />
				</div>
			</div>
		);
	if (type === "media")
		return (
			<div className={containerClass}>
				<div className={itemClass}>
					<RiImage2Fill />
				</div>
				<div
					className={`${itemClass} ${
						value === true ? "text-def-green" : "text-gray-500"
					}`}
				>
					<RiCheckFill />
				</div>
				<div
					className={`${itemClass} ${
						value === false ? "text-def-red" : "text-gray-500"
					}`}
				>
					<RiCloseFill />
				</div>
			</div>
		);
	if (type === "date")
		return (
			<div className={containerClass}>
				<div className={itemClass}>
					<RiCalendar2Fill />
				</div>
			</div>
		);
	return null;
};

export default QuestionType;
