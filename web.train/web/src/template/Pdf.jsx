import { renderMedia } from "../inputs/FileUpload";
import { getAbsolutePath } from "../providers/format";

const Pdf = ({ file, name }) => {
	let src = getAbsolutePath(file);

	return (
		<div>
			<a
				className="bg-def-gray p-2 rounded flex items-center cursor"
				href={src}
				target="_blank"
				rel="noreferrer"
			>
				<div className="h-16 w-16 flex-shrink-0 rounded bg-white flex items-center justify-center text-def-light font-semibold mr-2">
					PDF
				</div>
				{name}
			</a>
			{renderMedia(file)}
		</div>
	);
};

export default Pdf;
