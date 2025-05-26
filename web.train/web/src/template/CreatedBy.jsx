import { format } from "date-fns";
import objectPath from "object-path";
import { DATE_FORMAT } from "../defines";
import { getAbsolutePath, nameFormat } from "../providers/format";

const CreatedBy = ({ user, date, hidden }) => {
	let firstname = objectPath.get(user, "firstname");
	let lastname = objectPath.get(user, "lastname");

	let src = hidden
		? "/images/profile.png"
		: getAbsolutePath(user?.profile, { placeholder: "/images/profile.png" });

	if (!user && date) return <div>{format(new Date(date), DATE_FORMAT)}</div>;

	return (
		<div className="flex">
			<img
				className="w-10 h-10 rounded-full border object-contain mr-2"
				src={src}
				crossOrigin="anonymous"
				alt={hidden ? "anonymous" : firstname}
			/>
			<div className="flex-grow">
				<div className="text-sm">
					{hidden ? "************" : nameFormat(firstname, lastname)}
				</div>
				<div className="text-xs text-def-light flex justify-between items-center">
					{date && <div>{format(new Date(date), DATE_FORMAT)}</div>}
				</div>
			</div>
		</div>
	);
};

export default CreatedBy;
