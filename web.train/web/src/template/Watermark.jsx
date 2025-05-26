const Watermark = () => {
	return (
		<div className="flex absolute top-0 right-0 left-0 bottom-0 items-center justify-center z-0">
			<img
				src={"/images/logo.png"}
				alt="Gafety"
				className="w-1/2"
				style={{ opacity: 0.05 }}
			/>
		</div>
	);
};

export default Watermark;
