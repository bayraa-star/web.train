import { useState } from "react";
import { RiArrowLeftSLine, RiArrowRightSLine } from "react-icons/ri";
import { renderMedia } from "../inputs/FileUpload";

const Slides = ({ files, width = "w-full" }) => {
	const [selected, setSelected] = useState(0);

	const clickOnArrow = (value) => {
		const newSelected = selected + value;

		if (newSelected === files.length) {
			setSelected(0);
			return;
		}
		if (newSelected === -1) {
			setSelected(files.length - 1);
			return;
		}

		setSelected(newSelected);
	};

	return (
		<div>
			<div key={selected} className={width}>
				{renderMedia(files[selected])}
			</div>
			{files.length > 1 && (
				<div className="flex items-center justify-between text-white text-xl bg-def-gray mt-2">
					<div
						onClick={() => {
							clickOnArrow(-1);
						}}
						className="w-10 h-10 bg-black bg-opacity-50 flex items-center justify-center cursor"
					>
						<RiArrowLeftSLine />
					</div>
					<div className="flex items-center">
						{files.map((file, index) => {
							return (
								<div
									key={index}
									onClick={() => {
										setSelected(index);
									}}
									className={`cursor rounded-full bg-black bg-opacity-50 mx-1 ${
										selected === index ? "w-3 h-3" : "w-2 h-2"
									}`}
								></div>
							);
						})}
					</div>
					<div
						onClick={() => {
							clickOnArrow(1);
						}}
						className="w-10 h-10 bg-black bg-opacity-50 flex items-center justify-center cursor"
					>
						<RiArrowRightSLine />
					</div>
				</div>
			)}
		</div>
	);
};

const Gallery = ({ files, width }) => {
	if (!files || files?.length === 0) return null;

	return <Slides files={files} width={width} />;
};

export default Gallery;
