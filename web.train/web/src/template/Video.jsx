import { getAbsolutePath } from "../providers/format";

const Video = ({ file }) => {
	let src = getAbsolutePath(file);

	return (
		<div className="p-2 bg-def-gray rounded-lg">
			<video
				key={src}
				className="w-full rounded-lg"
				controls="controls"
				crossOrigin="anonymous"
			>
				<source src={src}></source>
			</video>
		</div>
	);
};

export default Video;
